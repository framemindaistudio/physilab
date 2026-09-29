import type { Advice, AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: { param: 'v0', row: 'v0', label: 'v₀', unit: 'm/s' },
  throughOrigin: true,
  interceptCause: 'Check that the launch height is 0 m and air resistance is off.',
  errorCauses: [
    'Air resistance shortens the range, so g comes out too large.',
    'A raised launch point lengthens the range beyond v₀² sin 2θ / g.',
  ],
  rules: (ctx) => {
    const out: Advice[] = []
    const h = Number(ctx.params.height)
    const k = Number(ctx.params.drag)
    if (ctx.where === 'bench' && (h > 0 || k > 0)) {
      out.push({
        id: 'projectile-ideal',
        level: 'info',
        title: 'Not ideal conditions',
        detail: `R = v₀² sin 2θ / g only holds for level ground with no air resistance. Readings with ${h > 0 ? 'a raised launch point' : 'air resistance'} go on a separate graph.`,
        action: { kind: 'setParams', label: 'Set h = 0, no drag', params: { height: 0, drag: 0 } },
      })
    }
    // Complementary angles: same speed, θ and 90° − θ should give equal ranges.
    const rows = ctx.used.map((r) => r.values)
    // Two different angles (not a repeated 45° shot) at the same speed that add up to 90°.
    const complementary = (a: typeof rows[number], b: typeof rows[number]) =>
      b !== a && Number(b.v0) === Number(a.v0) && Math.abs(Number(a.angle) - Number(b.angle)) > 0.5 && Math.abs(Number(a.angle) + Number(b.angle) - 90) < 0.5
    const pair = rows.find((a) => rows.some((b) => complementary(a, b)))
    if (pair) {
      const other = rows.find((b) => complementary(pair, b))!
      const diff = (Math.abs(Number(pair.R) - Number(other.R)) / Number(pair.R)) * 100
      out.push({
        id: 'projectile-complementary',
        level: diff < 2 ? 'good' : 'info',
        title: `θ = ${pair.angle}° and ${other.angle}° gave ${diff < 2 ? 'equal' : 'different'} ranges`,
        detail: diff < 2 ? 'Complementary angles give the same range, because sin 2θ = sin(180° − 2θ).' : 'They should match on level ground without drag.',
      })
    } else if (ctx.where === 'bench' && rows.length >= 2) {
      const a = Number(ctx.params.angle)
      if (a !== 45 && a > 5 && a < 85) {
        out.push({
          id: 'projectile-try-complement',
          level: 'info',
          title: `Try θ = ${90 - a}° at the same speed`,
          detail: `It should land at the same range as θ = ${a}°.`,
          action: { kind: 'setParams', label: `Set θ = ${90 - a}°`, params: { angle: 90 - a } },
        })
      }
    }
    return out
  },
}
