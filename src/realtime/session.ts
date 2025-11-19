import WebSocket from 'ws'
import { config, createSessionConfig, createUserMessageEvent } from '../config'
import { toolsSchema } from '../tools/schema'
import { toolHandlers } from '../tools'
import type { ResponseDone } from './types'

type JarvisReply = {
  text: string
  toolResults?: any[]
}

export class JarvisSession {
  private ws: WebSocket
  private ready: Promise<void>
  private resolveReady!: () => void

  constructor() {
    const url = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(
      config.openaiRealtimeModel,
    )}`

    this.ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${config.openaiApiKey}`,
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
    })
  }

  async ask(text: string): Promise<JarvisReply> {
    await this.ready

    const userMessageEvent = createUserMessageEvent(text)

    const responseEvent = {
      type: 'response.create',
      response: {
        instructions: 'Respond to the most recent user request.',
        output_modalities: ['text'],
      },
    }

    this.ws.send(JSON.stringify(userMessageEvent))
    this.ws.send(JSON.stringify(responseEvent))

    return this.collectResponse()
  }

  private collectResponse(): Promise<JarvisReply> {
    return new Promise((resolve) => {
      const toolResults: any[] = []
      let answerText = ''

      const onMessage = async (data: WebSocket.RawData) => {
        const msg = JSON.parse(data.toString())
        // console.log('[/realtime/session] msg:', msg)

        if (msg.type === 'response.output_text.delta') {
          // text streaming
          answerText += msg.delta
        }

        if (msg.type === 'response.tool_call') {
          const toolName = msg.name as keyof typeof toolHandlers
          const args = msg.arguments

          const handler = toolHandlers[toolName]
          if (handler) {
            const result = await handler(args)
            toolResults.push({ toolName, args, result })

            const toolOutputEvent = {
              type: 'tool_output',
              tool_call_id: msg.id,
              output: result,
            }

            this.ws.send(JSON.stringify(toolOutputEvent))
          } else {
            console.error(`[JarvisSession] Tool handler not found for toolName: ${toolName}`)
          }
        }

        if (msg.type === 'response.done') {
          const responseDone = msg as ResponseDone
          const output = responseDone.response.output[0]!

          if (output.name === 'run_home_automation') {
            const args = JSON.parse(output.arguments)
            const result = await toolHandlers[output.name](args)
            toolResults.push({ toolName: output.name, args, result })
          }

          this.ws.off('message', onMessage)
          resolve({ text: answerText.trim(), toolResults })
        }
      }

      this.ws.on('message', onMessage)

      // Safety timeout so a bad session doesn’t hang forever
      setTimeout(() => {
        this.ws.off('message', onMessage)
        resolve({ text: answerText.trim(), toolResults })
      }, 8000)
    })
  }
}
