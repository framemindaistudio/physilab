import type { AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: { param: 'temperature', row: 'T_C', label: 'T', unit: '°C' },
  errorCauses: ['Let the oven temperature stabilise before each reading.', 'Spread the readings across the full 30–160 °C range.'],
}
