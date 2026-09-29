/**
 * Newton's rings (reflected light).
 * A plano-convex lens of radius R rests on a flat glass plate. At distance r from the
 * point of contact the air film has thickness t = r²/(2R). The two reflected rays differ
 * in path by 2t plus a half-wave phase change, so the reflected intensity is
 *   I(r) = sin²(2π t / λ)
 * Dark rings occur where 2t = nλ  →  r_n² = nλR  →  D_n² = 4nλR.
 */
export const filmThickness = (r: number, R: number) => (r * r) / (2 * R)

export function ringIntensity(r: number, lambda: number, R: number): number {
  return Math.sin((2 * Math.PI * filmThickness(r, R)) / lambda) ** 2
}

/** Diameter of the n-th dark ring from theory: D = 2√(nλR). */
export const darkRingDiameter = (n: number, lambda: number, R: number) => 2 * Math.sqrt(n * lambda * R)

/**
 * Locate the n-th dark ring by scanning I(r) outward from the centre (the central spot is
 * ring 0). Minima are refined with a parabola through three samples. No formula for r_n is used.
 */
export function findDarkRingRadius(n: number, lambda: number, R: number): number {
  const rMax = 1.3 * Math.sqrt((n + 1) * lambda * R) + 1e-4
  const steps = 20000 + n * 800
  const dr = rMax / steps
  let count = 0
  let prev2 = ringIntensity(0, lambda, R)
  let prev1 = ringIntensity(dr, lambda, R)
  for (let i = 2; i <= steps; i++) {
    const r = i * dr
    const cur = ringIntensity(r, lambda, R)
    if (prev1 <= prev2 && prev1 < cur) {
      count++
      if (count === n) {
        const denom = prev2 - 2 * prev1 + cur
        const off = denom !== 0 ? (0.5 * (prev2 - cur)) / denom : 0
        return r - dr + off * dr
      }
    }
    prev2 = prev1
    prev1 = cur
  }
  return NaN
}
