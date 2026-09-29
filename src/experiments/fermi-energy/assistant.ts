import type { AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: { param: 'temperature', row: 'T_C', label: 'T', unit: '°C' },
  errorCauses: ['E_F depends on the square of the slope, so small errors in R double in E_F — spread readings over 30–90 °C.', 'Wait for the bath temperature to settle before each reading.'],
}
