export type Deriv = (t: number, y: number[]) => number[]

/** One classical fourth-order Runge–Kutta step. */
export function rk4(f: Deriv, t: number, y: number[], h: number): number[] {
  const k1 = f(t, y)
  const k2 = f(t + h / 2, y.map((v, i) => v + (h / 2) * k1[i]))
  const k3 = f(t + h / 2, y.map((v, i) => v + (h / 2) * k2[i]))
  const k4 = f(t + h, y.map((v, i) => v + h * k3[i]))
  return y.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]))
}

/** Arithmetic–geometric mean, used for the exact pendulum period. */
export function agm(a: number, b: number): number {
  for (let i = 0; i < 30 && Math.abs(a - b) > 1e-15 * a; i++) {
    const an = (a + b) / 2
    b = Math.sqrt(a * b)
    a = an
  }
  return a
}

/** Bisection root finder for a monotonic function on [lo, hi]. */
export function bisect(f: (x: number) => number, lo: number, hi: number, tol = 1e-12, maxIter = 200): number {
  let flo = f(lo)
  for (let i = 0; i < maxIter; i++) {
    const mid = (lo + hi) / 2
    const fm = f(mid)
    if (Math.abs(hi - lo) < tol) return mid
    if (Math.sign(fm) === Math.sign(flo)) {
      lo = mid
      flo = fm
    } else {
      hi = mid
    }
  }
  return (lo + hi) / 2
}

export const deg = (rad: number) => (rad * 180) / Math.PI
export const rad = (d: number) => (d * Math.PI) / 180
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
