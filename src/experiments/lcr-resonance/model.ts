import type { Row } from '@/types/experiment'

/** RMS output of the signal generator (V). */
export const SOURCE_V = 5

/**
 * Resonance parameters read from measured points only (no formula for f₀ is used):
 * the peak is refined with a parabola through the highest reading and its neighbours,
 * and the half-power frequencies are interpolated on each side.
 */
export function readCurve(rows: Row[]): { f0: number; Imax: number; f1: number; f2: number } | null {
  const pts = rows.map((r) => ({ f: Number(r.f), I: Number(r.I) })).sort((a, b) => a.f - b.f)
  if (pts.length < 3) return null
  let k = 0
  pts.forEach((p, i) => {
    if (p.I > pts[k].I) k = i
  })
  let f0 = pts[k].f
  let Imax = pts[k].I
  if (k > 0 && k < pts.length - 1) {
    const [a, b, c] = [pts[k - 1], pts[k], pts[k + 1]]
    const denom = (a.f - b.f) * (a.f - c.f) * (b.f - c.f)
    const A = (c.f * (b.I - a.I) + b.f * (a.I - c.I) + a.f * (c.I - b.I)) / denom
    const B = (c.f * c.f * (a.I - b.I) + b.f * b.f * (c.I - a.I) + a.f * a.f * (b.I - c.I)) / denom
    const C = (b.f * c.f * (b.f - c.f) * a.I + c.f * a.f * (c.f - a.f) * b.I + a.f * b.f * (a.f - b.f) * c.I) / denom
    if (A < 0) {
      f0 = -B / (2 * A)
      Imax = C - (B * B) / (4 * A)
    }
  }
  const half = Imax / Math.SQRT2
  let f1 = NaN
  let f2 = NaN
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    if (a.I < half && b.I >= half && b.f <= f0) f1 = a.f + ((half - a.I) / (b.I - a.I)) * (b.f - a.f)
    if (a.I >= half && b.I < half && a.f >= f0) f2 = a.f + ((a.I - half) / (a.I - b.I)) * (b.f - a.f)
  }
  return { f0, Imax, f1, f2 }
}
