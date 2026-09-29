import type { AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: { param: 'ring', row: 'n', label: 'n', unit: '' },
  throughOrigin: true,
  interceptCause: 'Dust between the lens and plate (or imperfect contact) adds a constant to every D² — it does not affect the slope.',
  errorCauses: ['Set the crosshair on the middle of each dark ring.', 'Use ring numbers spread widely (e.g. 2 to 20).'],
}
