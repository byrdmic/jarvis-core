import type { toolHandlers } from "../tools"

export interface ResponseDone {
  type: 'response.done'
  event_id: string
  response: {
    object: 'realtime.response'
    id: string
    status: 'completed'
    status_details: null
    output: {
      object: 'realtime.item'
      type: 'function_call' // When set to function_call, indicates this response contains arguments for a named function call.
      name: keyof typeof toolHandlers // The name of the configured function to call
      id: string
      status: 'completed' | 'failed'
      call_id: string
      // arguments: Record<string, unknown> // A JSON string containing arguments to the function. In our case, "{\"sign\":\"Aquarius\"}".
      arguments: string // A JSON string containing arguments to the function. In our case, "{\"sign\":\"Aquarius\"}".
    }[]
  }
}
