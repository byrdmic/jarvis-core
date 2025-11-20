import WebSocket from 'ws'
import { config, createSessionConfig, createUserMessageEvent, createAudioAppendEvent } from '../config'
import { toolsSchema } from '../tools/schema'
import { toolHandlers } from '../tools'
import type { ResponseDone } from './types'

export type JarvisEventType =
  | 'text_delta'
  | 'audio_delta'
  | 'audio_transcript_delta'
  | 'user_transcript'
  | 'response_done'
  | 'error'
  | 'interruption'

export type JarvisEvent = {
  type: JarvisEventType
  data: any
}

type JarvisEventCallback = (event: JarvisEvent) => void

export class JarvisSession {
  private ws: WebSocket
  private ready: Promise<void>
  private resolveReady!: () => void
  private eventCallback?: JarvisEventCallback

  constructor(eventCallback?: JarvisEventCallback) {
    this.eventCallback = eventCallback

    const url = "wss://api.openai.com/v1/realtime?model=gpt-realtime-mini";

    this.ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${config.openaiApiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    })

    this.ready = new Promise((resolve) => {
      this.resolveReady = resolve
    })

    this.ws.on('open', () => {
      const sessionConfig = createSessionConfig(toolsSchema)
      this.ws.send(JSON.stringify(sessionConfig))
      console.log('[/realtime/session] websocket connected and ready')
      this.resolveReady()
    })

    this.ws.on('error', (err) => {
      console.error('[JarvisSession] WS error:', err)
      this.eventCallback?.({ type: 'error', data: err })
    })

    this.ws.on('message', this.handleMessage.bind(this))
  }

  async sendText(text: string): Promise<void> {
    await this.ready

    const userMessageEvent = createUserMessageEvent(text)
    this.ws.send(JSON.stringify(userMessageEvent))

    // Trigger response
    this.createResponse()
  }

  async sendAudio(audioBase64: string): Promise<void> {
    await this.ready

    const audioAppendEvent = createAudioAppendEvent(audioBase64)
    this.ws.send(JSON.stringify(audioAppendEvent))
    
    // Optional: Log to verify we are sending data
    // console.log('[JarvisSession] Sent audio chunk')

    // Note: OpenAI handles automatic response creation for audio input
    // when using server VAD, so we don't need to manually call createResponse()
  }

  generateResponse(): void {
    this.createResponse()
  }

  private createResponse(): void {
    const responseEvent = {
      type: 'response.create',
      response: {
        // Let the session instructions guide the response
      },
    }
    console.log('[/realtime/session] sending response.create')
    this.ws.send(JSON.stringify(responseEvent))
  }

  private async handleMessage(data: WebSocket.RawData): Promise<void> {
    const msg = JSON.parse(data.toString())
    
    // Log all events from OpenAI for debugging
    console.log('[JarvisSession] Event from OpenAI:', msg.type)

    // Handle text streaming
    if (msg.type === 'error') {
      console.error('[/realtime/session] Error from OpenAI:', JSON.stringify(msg, null, 2))
    }

    if (msg.type === 'response.text.delta' || msg.type === 'response.output_text.delta') {
      this.eventCallback?.({
        type: 'text_delta',
        data: msg.delta
      })
    }

    // Handle audio streaming
    if (msg.type === 'response.audio.delta' || msg.type === 'response.output_audio.delta') {
      this.eventCallback?.({
        type: 'audio_delta',
        data: msg.delta // base64 audio chunk
      })
    }

    // Handle audio transcription
    if (msg.type === 'response.audio_transcript.delta' || msg.type === 'response.output_audio_transcript.delta') {
      this.eventCallback?.({
        type: 'audio_transcript_delta',
        data: msg.delta
      })
    }

    // Handle user audio transcription completed
    if (msg.type === 'conversation.item.input_audio_transcription.completed') {
      this.eventCallback?.({
        type: 'user_transcript',
        data: msg.transcript
      })
    }

    // Handle session update confirmation
    if (msg.type === 'session.updated') {
      console.log('[JarvisSession] Session updated successfully')
    }

    // Handle interruption (user starts speaking)
    if (msg.type === 'input_audio_buffer.speech_started') {
      console.log('[JarvisSession] User started speaking - Interruption detected')
      
      // 1. Clear any pending audio in the input buffer
      this.ws.send(JSON.stringify({ type: 'input_audio_buffer.clear' }))
      
      // 2. Cancel the current response generation if any
      this.ws.send(JSON.stringify({ type: 'response.cancel' }))
      
      // 3. Notify client to stop audio playback
      this.eventCallback?.({
        type: 'interruption',
        data: null
      })
    }

    // Handle tool calls
    if (msg.type === 'response.tool_call') {
      const toolName = msg.name as keyof typeof toolHandlers
      const args = msg.arguments

      const handler = toolHandlers[toolName]
      if (handler) {
        try {
          const result = await handler(args)

          const toolOutputEvent = {
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: msg.id,
              output: JSON.stringify(result),
            }
          }

          this.ws.send(JSON.stringify(toolOutputEvent))
          this.createResponse()
        } catch (error) {
          console.error(`[JarvisSession] Tool execution error:`, error)
        }
      } else {
        console.error(`[JarvisSession] Tool handler not found for toolName: ${toolName}`)
      }
    }

    // Handle response completion
    if (msg.type === 'response.done') {
      const responseDone = msg as ResponseDone
      
      // Handle any remaining tool calls that might be in the response output
      if (responseDone.response.output) {
        for (const item of responseDone.response.output) {
           if (item.type === 'function_call') {
              const args = JSON.parse(item.arguments)
              // Check if we have a handler
              if (toolHandlers[item.name as keyof typeof toolHandlers]) {
                 const result = await toolHandlers[item.name as keyof typeof toolHandlers](args)
                 
                 const toolOutputEvent = {
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: item.call_id, 
                      output: JSON.stringify(result),
                    }
                 }
                 this.ws.send(JSON.stringify(toolOutputEvent))
                 
                 // Trigger another response to let the model acknowledge
                 this.createResponse()
              }
           }
        }
      }

      this.eventCallback?.({
        type: 'response_done',
        data: responseDone
      })
    }
  }

  // Legacy method for backward compatibility with /ask endpoint
  async ask(text: string): Promise<{ text: string; toolResults?: any[] }> {
    await this.ready

    return new Promise((resolve) => {
      const toolResults: any[] = []
      let fullText = ''
      let timeoutId: Timer

      const tempCallback = (event: JarvisEvent) => {
        if (event.type === 'text_delta' || event.type === 'audio_transcript_delta') {
          console.log('[JarvisSession.ask] Received delta:', event.data)
          fullText += event.data
        }
        if (event.type === 'response_done') {
          const response = event.data.response
          const hasToolCall = response.output?.some((item: any) => item.type === 'function_call')

          if (hasToolCall) {
             console.log('[JarvisSession.ask] Tool call detected, waiting for follow-up response...')
             if (fullText) fullText += '\n'
             return
          }

          // Tool results are handled internally now
          clearTimeout(timeoutId)
          this.eventCallback = originalCallback
          resolve({ text: fullText.trim(), toolResults })
        }
      }

      // Temporarily override the callback
      const originalCallback = this.eventCallback
      this.eventCallback = tempCallback

      // Send the text
      this.sendText(text).catch((error) => {
        console.error('[JarvisSession.ask] Error:', error)
        clearTimeout(timeoutId)
        this.eventCallback = originalCallback
        resolve({ text: fullText.trim(), toolResults })
      })

      // Restore original callback after a timeout
      timeoutId = setTimeout(() => {
        console.warn('[JarvisSession.ask] Timeout waiting for response_done')
        this.eventCallback = originalCallback
        resolve({ text: fullText.trim(), toolResults })
      }, 30000) // 30 second timeout
    })
  }

  disconnect(): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close()
    }
  }
}
