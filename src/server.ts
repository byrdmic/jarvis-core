import { config } from './config'
import { JarvisSession } from './realtime/session'
import { DeviceManager } from './device/manager'

// Legacy session for /ask endpoint
// const legacySession = new JarvisSession()

// Device manager for WebSocket connections
const deviceManager = new DeviceManager()

type AskBody = {
  text?: string
}

const server = Bun.serve<{ deviceId: string }>({
  port: config.port,
  websocket: {
    open(ws) {
      // WebSocket opened - pass to DeviceManager
      const deviceId = ws.data.deviceId
      console.log(`[server] WebSocket opened for device: ${deviceId}`)
      deviceManager.handleConnection(ws, deviceId)
    },
    message(ws, message) {
      // Messages are handled by DeviceManager
      // console.log(`[server] WebSocket message from device: ${ws.data.deviceId}`)
      deviceManager.handleMessage(ws, message)
    },
    close(ws) {
      // console.log(`[server] WebSocket closed for device: ${ws.data.deviceId}`)
      // DeviceManager handles cleanup
      deviceManager.handleClose(ws)
    },
  },
  async fetch(req, server) {
    const url = new URL(req.url)

    // Serve static test page
    if (url.pathname === '/' || url.pathname === '/client') {
      return new Response(Bun.file('public/index.html'), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Simple health check
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({ ok: true, env: 'jarvis-core-bun' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // WebSocket upgrade for device connections
    if (url.pathname === '/ws') {
      const deviceId = url.searchParams.get('deviceId')
      if (!deviceId) {
        return new Response('Missing deviceId parameter', { status: 400 })
      }

      // Validate deviceId (basic validation)
      if (deviceId.length === 0 || deviceId.length > 100) {
        return new Response('Invalid deviceId', { status: 400 })
      }

      const upgraded = server.upgrade(req, {
        data: { deviceId }
      })

      if (upgraded) {
        // Connection will be handled by the websocket handlers
        return new Response(null, { status: 101 }) // Switching Protocols
      } else {
        return new Response('WebSocket upgrade failed', { status: 500 })
      }
    }

    if (url.pathname === '/ask' && req.method === 'POST') {
      let body: AskBody

      try {
        body = (await req.json()) as AskBody
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const text = body.text?.trim()
      if (!text) {
        return new Response(JSON.stringify({ error: "Missing 'text' field" }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      console.log('[/ask] user text:', text)

      // Create a temporary session for this request to handle the interaction
      // This prevents long-lived sessions from timing out (OpenAI limits sessions to 60m?)
      const session = new JarvisSession()
      
      try {
        const jarvisReply = await session.ask(text)

        console.log('[/ask] jarvisReply:', jarvisReply)
        if (jarvisReply.toolResults && jarvisReply.toolResults.length > 0) {
          console.log(
            '[/ask] jarvisReply.toolResults:',
            JSON.stringify(jarvisReply.toolResults, null, 2),
          )
        }

        // Clean up session
        session.disconnect()

        return new Response(JSON.stringify(jarvisReply), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (error) {
        console.error('[/ask] Error processing request:', error)
        session.disconnect()
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log(`Jarvis Core (Bun) listening on http://localhost:${server.port}`)
