import type { Advice, AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: { param: 'angle', row: 'theta', label: 'θ', unit: '°', range: () => [0, 90] },
  throughOrigin: false,
  errorCauses: ['Stray room light adds a background — shield the detector.'],
  rules: (ctx) => {
    const out: Advice[] = []
    const angles = ctx.used.map((r) => Number(r.values.theta))
    if (ctx.used.length >= 3 && !angles.some((a) => Math.abs(a - 90) < 0.5)) {
      out.push({
        id: 'malus-extinction',
        level: 'tip',
        title: 'Include θ = 90° (crossed)',
        detail: 'At 90° the intensity should drop to (almost) zero — the clearest test of Malus’s law.',
        action: ctx.where === 'bench' ? { kind: 'setParams', label: 'Set θ = 90°', params: { angle: 90 } } : undefined,
      })
    }
    return out
  },
}
