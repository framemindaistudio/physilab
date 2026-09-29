import type { AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: { param: 'order', row: 'n', label: 'n', unit: '' },
  throughOrigin: true,
  interceptCause: 'Check that the grating is perpendicular to the beam.',
  errorCauses: ['Measure the spot separation to the centres of the spots.', 'Use the highest orders that fit on the screen — larger distances are measured more accurately.'],
}
