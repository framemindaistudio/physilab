import type { Advice, AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: {
    param: 'supply',
    row: 'Vs',
    label: 'supply',
    unit: 'V',
    // The diode's interesting region is near its knee.
    range: (p) => (p.device === 'diode' ? [0.3, 3] : [0.5, 12]),
  },
  throughOrigin: true,
  interceptCause: 'Check for a zero error on the voltmeter or ammeter.',
  errorCauses: ['Meter least count matters most at low voltage — take more readings at higher V.'],
  rules: (ctx) => {
    const out: Advice[] = []
    const device = String(ctx.params.device)
    if (ctx.where === 'bench' && device === 'lamp') {
      out.push({
        id: 'ohm-lamp',
        level: 'info',
        title: 'A filament lamp is non-ohmic',
        detail: 'Expect a curve, not a straight line: the filament heats up and its resistance rises with current.',
      })
    }
    if (device === 'diode') {
      const nearKnee = ctx.used.filter((r) => Number(r.values.V) >= 0.45 && Number(r.values.V) <= 0.8).length
      if (nearKnee < 2) {
        out.push({
          id: 'ohm-knee',
          level: 'tip',
          title: 'Capture the diode’s knee',
          detail: 'Take a few readings with the supply between 0.5 V and 1.5 V — that is where the current starts to rise sharply.',
          action: ctx.where === 'bench' ? { kind: 'setParams', label: 'Set supply = 0.8 V', params: { supply: 0.8 } } : undefined,
        })
      }
      if (ctx.where === 'bench' && Number(ctx.params.supply) < 0.5) {
        out.push({ id: 'ohm-diode-low', level: 'info', title: 'Below about 0.5 V the diode hardly conducts' })
      }
    }
    return out
  },
}
