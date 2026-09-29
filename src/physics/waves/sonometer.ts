/**
 * Sonometer: a wire of linear mass density μ under tension T, vibrating between two bridges
 * a distance L apart. Transverse wave speed v = √(T/μ); fundamental frequency
 *   f₁ = v / (2L) = (1/2L)√(T/μ)
 * Resonance with a tuning fork of frequency f happens when f₁ = f, i.e. L = v / (2f).
 */
export const waveSpeed = (tensionN: number, mu: number) => Math.sqrt(tensionN / mu)

export const fundamental = (L: number, tensionN: number, mu: number) => waveSpeed(tensionN, mu) / (2 * L)

export const resonantLength = (f: number, tensionN: number, mu: number) => waveSpeed(tensionN, mu) / (2 * f)

/**
 * Steady-state response of the string's fundamental mode to the fork (damped oscillator),
 * normalised to 1 at resonance. Q sets the sharpness.
 */
export function response(f: number, L: number, tensionN: number, mu: number, Q = 60): number {
  const f1 = fundamental(L, tensionN, mu)
  const x = f / f1
  const amp = 1 / Math.sqrt((1 - x * x) ** 2 + (x / Q) ** 2)
  return amp / Q
}

/** Find the bridge separation giving maximum response (what the paper rider shows). */
export function findResonance(f: number, tensionN: number, mu: number, lo = 0.05, hi = 1.2): number {
  const target = resonantLength(f, tensionN, mu)
  if (!(target > lo && target < hi)) return NaN
  // Golden-section search for the response maximum around the target.
  let a = target * 0.9
  let b = target * 1.1
  const g = (Math.sqrt(5) - 1) / 2
  let c = b - g * (b - a)
  let d = a + g * (b - a)
  for (let i = 0; i < 80; i++) {
    if (response(f, c, tensionN, mu) > response(f, d, tensionN, mu)) b = d
    else a = c
    c = b - g * (b - a)
    d = a + g * (b - a)
  }
  return (a + b) / 2
}
