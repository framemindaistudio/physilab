import type { Advice, AssistantConfig } from '@/assistant/types'
import { MERCURY_LINES, maxOrder } from '@/physics/optics/grating'

export const assistant: AssistantConfig = {
  sweep: {
    param: 'order',
    row: 'n',
    label: 'n',
    unit: '',
    range: (p) => [1, Math.max(1, maxOrder((MERCURY_LINES[String(p.line)] ?? MERCURY_LINES.green).nm, Number(p.grating)))],
  },
  throughOrigin: true,
  interceptCause: 'Check that the grating is set for normal incidence.',
  errorCauses: ['Read the angle on both sides and take half the difference.', 'Use every visible order — higher orders give larger, more accurate angles.'],
  rules: (ctx) => {
    const out: Advice[] = []
    const l = MERCURY_LINES[String(ctx.params.line)] ?? MERCURY_LINES.green
    const max = maxOrder(l.nm, Number(ctx.params.grating))
    if (ctx.where === 'bench' && Number(ctx.params.order) > max) {
      out.push({
        id: 'grating-order',
        level: 'warn',
        title: `Order ${ctx.params.order} is not visible`,
        detail: `With this grating the highest order for the ${l.label.toLowerCase()} line is ${max} (n ≤ d/λ).`,
        action: { kind: 'setParams', label: `Set n = ${max}`, params: { order: max } },
      })
    }
    return out
  },
}
