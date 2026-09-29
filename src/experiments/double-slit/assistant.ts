import type { Advice, AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: { param: 'distance', row: 'D', label: 'D', unit: 'm' },
  rowKeys: { separation: 'd', slitWidth: 'slitWidth', wavelength: 'wavelength' },
  throughOrigin: true,
  interceptCause: 'This suggests a zero error in the microscope or D measured from the wrong point.',
  errorCauses: ['Measure across more fringes to reduce the least-count error.', 'Keep the screen far away compared with the slit separation.'],
  rules: (ctx) => {
    const out: Advice[] = []
    const seps = new Set(ctx.used.map((r) => Number(r.values.d)))
    if (seps.size === 1 && ctx.used.length >= 3) {
      const d = [...seps][0]
      const next = d >= 0.6 ? 0.3 : 0.8
      out.push({
        id: 'slit-vary-d',
        level: 'tip',
        title: 'Change the slit separation as well',
        detail: `All readings use d = ${d.toFixed(2)} mm. Using another d as well shows that β depends on D/d, not on D alone.`,
        action: ctx.where === 'bench' ? { kind: 'setParams', label: `Set d = ${next.toFixed(2)} mm`, params: { separation: next } } : undefined,
      })
    }
    return out
  },
}
