import type { Advice, AssistantConfig } from '@/assistant/types'
import { fixed } from '@/utils/format'

export const assistant: AssistantConfig = {
  sweep: { param: 'length', row: 'length', label: 'L', unit: 'm' },
  throughOrigin: true,
  interceptCause: 'This usually means L was measured to the wrong point — measure to the centre of the bob.',
  errorCauses: [
    'Large amplitude: the period grows with θ₀, so g comes out low. Keep θ₀ ≤ 10°.',
    'Lengths over a narrow range make the slope uncertain.',
    'Reaction-time error in the stopwatch — it averages out with more readings.',
  ],
  rules: (ctx) => {
    const out: Advice[] = []
    const amp = Number(ctx.params.amplitude)
    if (ctx.where === 'bench' && amp > 10) {
      out.push({
        id: 'pendulum-amplitude',
        level: 'warn',
        title: `Amplitude ${amp}° is too large`,
        detail: 'T = 2π√(L/g) assumes sin θ ≈ θ, which only holds for small swings. Larger swings lengthen the period and make g come out low.',
        action: { kind: 'setParams', label: 'Set θ₀ = 8°', params: { amplitude: 8 } },
      })
    }

    // Mass-independence check: two different masses at the same length.
    const byLength = new Map<string, { mass: number; T: number }[]>()
    for (const r of ctx.used) {
      const key = Number(r.values.length).toFixed(2)
      const list = byLength.get(key) ?? []
      list.push({ mass: Number(r.values.mass), T: Number(r.values.T) })
      byLength.set(key, list)
    }
    let checked = false
    for (const [L, list] of byLength) {
      const masses = new Set(list.map((x) => x.mass))
      if (masses.size < 2) continue
      const Ts = list.map((x) => x.T)
      const spread = ((Math.max(...Ts) - Math.min(...Ts)) / Math.min(...Ts)) * 100
      out.push({
        id: 'pendulum-mass',
        level: spread < 1.5 ? 'good' : 'info',
        title: spread < 1.5 ? `Mass check passed at L = ${L} m` : `Periods at L = ${L} m differ by ${fixed(spread, 1)}%`,
        detail:
          spread < 1.5
            ? `Bobs of ${[...masses].join(' g and ')} g gave the same period within ${fixed(spread, 1)}% — T does not depend on mass.`
            : 'The period should not depend on mass; a difference this size comes from timing error. Try repeating those readings.',
      })
      checked = true
      break
    }
    if (!checked && ctx.where === 'bench' && ctx.used.length >= 3) {
      const last = ctx.used[ctx.used.length - 1].values
      const otherMass = Number(last.mass) >= 250 ? 100 : 400
      out.push({
        id: 'pendulum-mass-try',
        level: 'info',
        title: 'Optional check: does mass matter?',
        detail: `Repeat L = ${Number(last.length).toFixed(2)} m with a ${otherMass} g bob. The period should not change.`,
        action: { kind: 'setParams', label: `Try ${otherMass} g`, params: { mass: otherMass, length: Number(last.length) } },
      })
    }
    return out
  },
}
