import type { Advice, AssistantConfig } from '@/assistant/types'

const tauOf = (p: Record<string, unknown>) => (Number(p.resistance) * 1e3 * Number(p.capacitance)) / 1e6

export const assistant: AssistantConfig = {
  sweep: { param: 'time', row: 't', label: 't', unit: 's', range: (p) => [0, Math.min(150, Math.round(3.5 * tauOf(p)))] },
  errorCauses: ['Late readings (small V) are the least accurate — keep within about 3τ.', 'Start timing exactly when the discharge begins.'],
  rules: (ctx) => {
    const out: Advice[] = []
    const tau = tauOf(ctx.params)
    if (ctx.where === 'bench' && Number(ctx.params.time) > 4 * tau) {
      out.push({
        id: 'rc-late',
        level: 'warn',
        title: `t = ${ctx.params.time} s is more than 4τ`,
        detail: `Almost no charge is left (τ = ${tau.toFixed(1)} s), so the voltage is tiny and its logarithm very uncertain.`,
      })
    }
    return out
  },
}
