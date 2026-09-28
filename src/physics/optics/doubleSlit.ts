/**
 * Young's double slit, Fraunhofer (far-field) model with finite slit width.
 * For a point y on a screen a distance D from slits of separation d and width a:
 *   sin θ = y / √(y² + D²)
 *   I(y) = I₀ · cos²(π d sin θ / λ) · sinc²(π a sin θ / λ)
 * The cos² term is two-beam interference; the sinc² term is the single-slit envelope.
 * Fringe width in the small-angle limit: β = λD / d.
 */
export function intensity(y: number, lambda: number, d: number, D: number, a: number): number {
  const s = y / Math.sqrt(y * y + D * D)
  const phi = (Math.PI * d * s) / lambda
  const beta = (Math.PI * a * s) / lambda
  const env = beta === 0 ? 1 : (Math.sin(beta) / beta) ** 2
  return Math.cos(phi) ** 2 * env
}

export const fringeWidth = (lambda: number, d: number, D: number) => (lambda * D) / d

/**
 * Locate dark fringes by scanning I(y) for local minima (no formula for β is used).
 * Returns positions in metres, sorted.
 */
export function findDarkFringes(lambda: number, d: number, D: number, a: number, halfWidth: number, step: number): number[] {
  const minima: number[] = []
  const n = Math.ceil((2 * halfWidth) / step)
  let prev2 = intensity(-halfWidth, lambda, d, D, a)
  let prev1 = intensity(-halfWidth + step, lambda, d, D, a)
  for (let i = 2; i <= n; i++) {
    const y = -halfWidth + i * step
    const cur = intensity(y, lambda, d, D, a)
    if (prev1 <= prev2 && prev1 < cur) {
      // Parabolic refinement through the three samples.
      const denom = prev2 - 2 * prev1 + cur
      const offset = denom !== 0 ? (0.5 * (prev2 - cur)) / denom : 0
      minima.push(y - step + offset * step)
    }
    prev2 = prev1
    prev1 = cur
  }
  return minima
}

/** Approximate visible colour of a wavelength in nm, as [r, g, b] 0–255. */
export function wavelengthToRGB(nm: number): [number, number, number] {
  let r = 0
  let g = 0
  let b = 0
  if (nm < 380) {
    // Ultraviolet is invisible; drawn as a dim violet so it can be seen on screen.
    r = 0.45
    b = 0.75
  } else if (nm < 440) {
    r = -(nm - 440) / 60
    b = 1
  } else if (nm < 490) {
    g = (nm - 440) / 50
    b = 1
  } else if (nm < 510) {
    g = 1
    b = -(nm - 510) / 20
  } else if (nm < 580) {
    r = (nm - 510) / 70
    g = 1
  } else if (nm < 645) {
    r = 1
    g = -(nm - 645) / 65
  } else {
    r = 1
  }
  let f = 1
  if (nm < 420) f = 0.35 + (0.65 * Math.max(0, nm - 380)) / 40
  else if (nm > 700) f = 0.35 + (0.65 * (780 - Math.min(nm, 780))) / 80
  const gamma = 0.8
  const c = (v: number) => Math.round(255 * Math.pow(Math.max(0, v) * f, gamma))
  return [c(r), c(g), c(b)]
}
