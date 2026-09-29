import type { AssistantConfig } from '@/assistant/types'
import { capacitance, DIELECTRICS } from '@/physics/electromagnetism/dielectric'

const tauOf = (p: Record<string, unknown>) => Number(p.resistance) * 1e6 * capacitance((DIELECTRICS[String(p.dielectric)] ?? DIELECTRICS.polyester).k)

export const assistant: AssistantConfig = {
  sweep: { param: 'time', row: 't', label: 't', unit: 's', range: (p) => [0, Math.min(150, Math.max(5, Math.round(3.5 * tauOf(p))))] },
  errorCauses: ['Readings late in the curve (V near 0 or near V₀) are the least accurate — keep within about 3τ.', 'Start timing exactly when the switch is thrown.'],
}
