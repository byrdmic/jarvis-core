export const config = {
  openaiApiKey: Bun.env.OPENAI_API_KEY ?? '',
  openaiRealtimeModel: Bun.env.OPENAI_REALTIME_MODEL ?? '',
  n8nWebhookUrl: Bun.env.N8N_JARVIS_WEBHOOK_URL ?? '',
  port: Number(Bun.env.PORT ?? 4000),
}

// export const modelConfig = {
//   [config.openaiRealtimeModel]: {}
// }

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
    type: 'realtime',
    output_modalities: ['text'],
    tool_choice: 'auto',
    instructions: `
You are Jarvis, a household AI assistant for Mike and his family.

You MUST:
- Understand natural language home automation commands.
- Use tools to control the house via n8n (run_home_automation).
- When chatting about non-automation topics, just respond normally.

If the user asks to control lights, scenes, devices, or routines,
you should call run_home_automation with an appropriate action, room, state, and extra info.
          `.trim(),
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
