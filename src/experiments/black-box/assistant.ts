import type { AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: { param: 'frequency', row: 'f', label: 'f', unit: 'Hz' },
  errorCauses: ['Use frequencies spread from 50 Hz to 2000 Hz so the trend is unmistakable.'],
}
