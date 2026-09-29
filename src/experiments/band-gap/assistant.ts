import type { AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: { param: 'temperature', row: 'T_C', label: 'T', unit: '°C' },
  errorCauses: ['Wait for the oil bath to reach a steady temperature before each reading.', 'Spread the readings across 25–95 °C.'],
}
