import type { Advice, AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: { param: 'current', row: 'I', label: 'I', unit: 'mA' },
  rowKeys: { field: 'B' },
  throughOrigin: true,
  interceptCause: 'A misalignment voltage between the Hall probes — reverse the field and average to remove it.',
  errorCauses: ['Use a wide range of I·B values.', 'Keep the current small so the sample does not warm up.'],
  rules: (ctx) => {
    const out: Advice[] = []
    const fields = new Set(ctx.used.map((r) => Number(r.values.B)))
    if (fields.size === 1 && ctx.used.length >= 3) {
      const B = [...fields][0]
      const next = B >= 0.6 ? 0.3 : 0.9
      out.push({
        id: 'hall-vary-b',
        level: 'tip',
        title: 'Change the magnetic field as well',
        detail: `All readings use B = ${B.toFixed(2)} T. Readings at another field show that V_H depends on the product I·B.`,
        action: ctx.where === 'bench' ? { kind: 'setParams', label: `Set B = ${next} T`, params: { field: next } } : undefined,
      })
    }
    return out
  },
}
