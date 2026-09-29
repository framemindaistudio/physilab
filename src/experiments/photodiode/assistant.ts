import type { Advice, AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: { param: 'power', row: 'P', label: 'P', unit: 'µW' },
  errorCauses: ['Keep the bias negative (reverse) for every responsivity reading.', 'Shield the diode from room light.'],
  rules: (ctx) => {
    const out: Advice[] = []
    if (ctx.where === 'bench' && Number(ctx.params.bias) > -0.5) {
      out.push({
        id: 'pd-bias',
        level: 'warn',
        title: 'The photodiode is not reverse-biased',
        detail: 'Near zero or forward bias the current also depends on the voltage, so these readings are left out of the responsivity.',
        action: { kind: 'setParams', label: 'Set bias = −5 V', params: { bias: -5 } },
      })
    }
    return out
  },
}
