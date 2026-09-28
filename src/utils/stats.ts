import type { LinearFit } from '@/types/experiment'

/** Ordinary least-squares straight line y = slope·x + intercept, with standard errors. */
export function linearFit(points: { x: number; y: number }[]): LinearFit | undefined {
  const n = points.length
  if (n < 2) return undefined
  const mx = mean(points.map((p) => p.x))
  const my = mean(points.map((p) => p.y))
  let sxx = 0
  let sxy = 0
  let syy = 0
  for (const p of points) {
    sxx += (p.x - mx) ** 2
    sxy += (p.x - mx) * (p.y - my)
    syy += (p.y - my) ** 2
  }
  if (sxx === 0) return undefined
  const slope = sxy / sxx
  const intercept = my - slope * mx
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0)
  const r2 = syy === 0 ? 1 : 1 - ssRes / syy
  const dof = n - 2
  const s2 = dof > 0 ? ssRes / dof : 0
  const slopeSE = Math.sqrt(s2 / sxx)
  const interceptSE = Math.sqrt(s2 * (1 / n + (mx * mx) / sxx))
  return { slope, intercept, r2, slopeSE, interceptSE, n }
}

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN
}

export function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1))
}

export function percentError(measured: number, accepted: number): number {
  return (Math.abs(measured - accepted) / Math.abs(accepted)) * 100
}

export function distinctCount(xs: number[], tol = 1e-9): number {
  const sorted = [...xs].sort((a, b) => a - b)
  let count = 0
  let last = -Infinity
  for (const x of sorted) {
    if (x - last > tol) {
      count++
      last = x
    }
  }
  return count
}
