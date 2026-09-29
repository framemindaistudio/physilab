import type { Advice, AssistantConfig } from '@/assistant/types'
import { fundamental, response } from '@/physics/waves/sonometer'
import { FORKS, muOf, Q, tensionOf } from './model'

export const assistant: AssistantConfig = {
  // The fork is chosen from a set, so the generic slider suggestion does not apply.
  sweep: { param: 'fork', row: 'f', label: 'f', unit: 'Hz' },
  throughOrigin: true,
  interceptCause: 'Measure L between the knife edges of the bridges, not to their bases.',
  errorCauses: ['Find resonance carefully — approach it from both sides.', 'Use forks spread across 256–512 Hz.'],
  rules: (ctx) => {
    const out: Advice[] = []
    const used = new Set(ctx.used.map((r) => Number(r.values.f)))
    const next = FORKS.find((f) => !used.has(Number(f)))
    if (ctx.rows.length && next && ctx.used.length < 8) {
      out.push({
        id: 'sono-next-fork',
        level: 'tip',
        title: `Next: the ${next} Hz fork`,
        detail: 'Each new fork gives a new point on the L–1/f graph.',
        action: ctx.where === 'bench' ? { kind: 'setParams', label: `Use ${next} Hz`, params: { fork: next } } : undefined,
      })
    }
    if (ctx.where === 'bench') {
      const f = Number(ctx.params.fork)
      const T = tensionOf(Number(ctx.params.mass))
      const mu = muOf(ctx.params.wire)
      const L = Number(ctx.params.length) / 100
      if (response(f, L, T, mu, Q) < 0.5) {
        const shorter = fundamental(L, T, mu) < f
        out.push({
          id: 'sono-direction',
          level: 'info',
          title: `Not at resonance yet — make the wire ${shorter ? 'shorter' : 'longer'}`,
          detail: `The wire’s own frequency is ${shorter ? 'below' : 'above'} ${f} Hz at this length. Move the bridge slowly until the rider jumps.`,
        })
      }
    }
    return out
  },
}
