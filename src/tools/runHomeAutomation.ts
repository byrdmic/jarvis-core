import { config } from '../config'

export type RunHomeAutomationArgs = {
  action: string
  room: string
  state?: string
  extra?: Record<string, unknown>
}

export async function runHomeAutomation(
  args: RunHomeAutomationArgs,
): Promise<{ success: boolean; detail?: unknown }> {
  if (!config.n8nWebhookUrl) {
    console.error('[runHomeAutomation] N8N_JARVIS_WEBHOOK_URL is not set')
    return { success: false, detail: 'Missing webhook URL' }
  }

  const payload = {
    source: 'jarvis-core',
    ...args,
  }

  const resp = await fetch(config.n8nWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    tls: {
      rejectUnauthorized: false,
    },
  })
  console.log(
    `[runHomeAutomation] response status: ${resp.status} : ${resp.statusText}`,
  )

  let detail: unknown = null
  try {
    detail = await resp.json()
    console.log('[runHomeAutomation] response (json):', JSON.stringify(detail))
  } catch (err) {
    console.error('[runHomeAutomation] Error parsing response:\n', err)
    detail = err
  }

  return {
    success: resp.ok,
    detail,
  }
}
