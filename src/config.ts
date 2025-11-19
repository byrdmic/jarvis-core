export const config = {
  openaiApiKey: Bun.env.OPENAI_API_KEY ?? '',
  openaiRealtimeModel: 'gpt-4o-realtime-preview-2024-12-17', // Update to latest model version
  n8nWebhookUrl: Bun.env.N8N_JARVIS_WEBHOOK_URL ?? '',
  port: Number(Bun.env.PORT ?? 4000),
}

if (!config.openaiApiKey) {
  console.warn('[config] OPENAI_API_KEY is not set')
}
if (!config.openaiRealtimeModel) {
  console.warn('[config] OPENAI_REALTIME_MODEL is not set')
}
if (!config.n8nWebhookUrl) {
  console.warn('[config] N8N_JARVIS_WEBHOOK_URL is not set')
}

export const createSessionConfig = (toolsSchema: any) => ({
  type: 'session.update',
  session: {
    instructions: `
You are Jarvis, a household AI assistant for Mike and his family.

You MUST:
- Understand natural language home automation commands.
- Use tools to control the house via n8n (run_home_automation).
- When chatting about non-automation topics, just respond normally.

If the user asks to control lights, scenes, devices, or routines,
you should call run_home_automation with an appropriate action, room, state, and extra info.
    `.trim(),
    input_audio_transcription: {
      model: 'whisper-1',
    },
    tools: toolsSchema,
  },
})

export const createUserMessageEvent = (text: string) => ({
  type: 'conversation.item.create',
  item: {
    type: 'message',
    role: 'user',
    content: [
      { type: 'input_text', text },
    ],
  },
})

export const createAudioMessageEvent = (audioBase64: string) => ({
  type: 'conversation.item.create',
  item: {
    type: 'message',
    role: 'user',
    content: [
      { type: 'input_audio', audio: audioBase64 },
    ],
  },
})
