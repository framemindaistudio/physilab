import type { Advice, AssistantConfig } from '@/assistant/types'
import { LEDS } from '@/physics/modern/led'

export const assistant: AssistantConfig = {
  // The LED is chosen from a set, so the generic slider suggestion does not apply.
  sweep: { param: 'led', row: 'led', label: 'LED', unit: '' },
  throughOrigin: true,
  interceptCause: 'Real LEDs lose a little energy in the junction, which shifts every threshold by a similar amount.',
  errorCauses: ['Use only the steep, straight part of each I–V curve for the extrapolation.', 'Include LEDs across the whole range, from infrared to violet.'],
  rules: (ctx) => {
    const out: Advice[] = []
    const done = new Set(ctx.used.map((r) => String(r.values.led)))
    const next = Object.keys(LEDS).find((k) => !done.has(k))
    if (ctx.rows.length && next) {
      out.push({
        id: 'led-next',
        level: 'tip',
        title: `Next: the ${LEDS[next].label.toLowerCase()} LED`,
        detail: 'Every colour adds a point at a different 1/λ.',
        action: ctx.where === 'bench' ? { kind: 'setParams', label: `Use ${LEDS[next].label}`, params: { led: next } } : undefined,
      })
    }
    return out
  },
}
