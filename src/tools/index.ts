import {
  runHomeAutomation,
  type RunHomeAutomationArgs,
} from './runHomeAutomation'

export type ToolCall = {
  name: 'run_home_automation'
  arguments: RunHomeAutomationArgs
}

export const toolHandlers = {
  run_home_automation: runHomeAutomation,
}
