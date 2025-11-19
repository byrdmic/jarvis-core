import { config } from './config'
import { JarvisSession } from './realtime/session'

const session = new JarvisSession()

type AskBody = {
  text?: string
}

const server = Bun.serve({
  port: config.port,
  fetch: async (req) => {
    const url = new URL(req.url)

    // Simple health check
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({ ok: true, env: 'jarvis-core-bun' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
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

      const jarvisReply = await session.ask(text)

      console.log('[/ask] jarvisReply:', jarvisReply)
      if (jarvisReply.toolResults && jarvisReply.toolResults.length > 0) {
        console.log(
          '[/ask] jarvisReply.toolResults:',
          JSON.stringify(jarvisReply.toolResults, null, 2),
        )
      }

      return new Response(JSON.stringify(jarvisReply), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log(`Jarvis Core (Bun) listening on http://localhost:${server.port}`)
