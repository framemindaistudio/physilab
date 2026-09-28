import { agm, rk4 } from '../numerics'

/**
 * Simple pendulum, full non-linear model:
 *   d²θ/dt² = −(g/L)·sin θ − b·dθ/dt
 * No small-angle approximation is made in the simulation; the familiar
 * T = 2π√(L/g) is the limit that the analysis tests.
 */
export interface PendulumState {
  theta: number
  omega: number
}

export function pendulumStep(s: PendulumState, L: number, g: number, h: number, damping = 0): PendulumState {
  const [theta, omega] = rk4(
    (_t, y) => [y[1], -(g / L) * Math.sin(y[0]) - damping * y[1]],
    0,
    [s.theta, s.omega],
    h,
  )
  return { theta, omega }
}

/** Small-angle period T₀ = 2π√(L/g). */
export function smallAnglePeriod(L: number, g: number): number {
  return 2 * Math.PI * Math.sqrt(L / g)
}

/** Exact period for amplitude θ₀: T = T₀ / AGM(1, cos(θ₀/2)). */
export function exactPeriod(L: number, g: number, theta0: number): number {
  return smallAnglePeriod(L, g) / agm(1, Math.cos(theta0 / 2))
}

/**
 * Time n complete oscillations exactly as a student does with a stopwatch:
 * release from θ₀, start timing when the bob first passes the mean position,
 * stop after it has passed the mean position 2n more times (same direction as the start).
 * Integrates the same equation of motion the animation uses.
 */
export function timeOscillations(L: number, g: number, theta0: number, n: number): number {
  const T0 = smallAnglePeriod(L, g)
  const h = T0 / 4000
  let s: PendulumState = { theta: theta0, omega: 0 }
  let t = 0
  let crossings = 0
  let tStart = 0
  const target = 2 * n
  const maxT = T0 * (n + 2) * 2
  while (t < maxT) {
    const next = pendulumStep(s, L, g, h)
    if (Math.sign(next.theta) !== Math.sign(s.theta) && s.theta !== 0) {
      // Linear interpolation of the zero crossing inside this step.
      const frac = s.theta / (s.theta - next.theta)
      const tc = t + frac * h
      if (crossings === 0) tStart = tc
      crossings++
      if (crossings === target + 1) return tc - tStart
    }
    s = next
    t += h
  }
  return NaN
}
