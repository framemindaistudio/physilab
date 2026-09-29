import type { AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: { param: 'distance', row: 'L', label: 'L', unit: 'mm' },
  errorCauses: ['Measure the spot diameter in two directions and average.', 'Use distances spread from 10 to 100 mm.'],
}
