import { rk4 } from '../numerics'

/**
 * Projectile under uniform gravity with optional quadratic air drag:
 *   dv/dt = −g ŷ − k·|v|·v      (k = drag per unit mass, 1/m)
 * With k = 0 this reproduces the ideal parabola exactly.
 */
export interface TrajectoryPoint {
  t: number
  x: number
  y: number
  vx: number
  vy: number
}

export interface Trajectory {
  points: TrajectoryPoint[]
  range: number
  maxHeight: number
  flightTime: number
  apex: TrajectoryPoint
}

export function simulateTrajectory(v0: number, angleDeg: number, h0: number, g: number, k = 0, dt = 0.001): Trajectory {
  const a = (angleDeg * Math.PI) / 180
  let y = [0, h0, v0 * Math.cos(a), v0 * Math.sin(a)]
  let t = 0
  const f = (_t: number, s: number[]) => {
    const speed = Math.hypot(s[2], s[3])
    return [s[2], s[3], -k * speed * s[2], -g - k * speed * s[3]]
  }
  const points: TrajectoryPoint[] = [{ t, x: y[0], y: y[1], vx: y[2], vy: y[3] }]
  let apex = points[0]
  const maxSteps = 2_000_000
  for (let i = 0; i < maxSteps; i++) {
    const next = rk4(f, t, y, dt)
    if (next[1] < 0 && next[3] < 0) {
      // Interpolate the landing instant (y = 0) inside the step.
      const frac = y[1] / (y[1] - next[1])
      const land: TrajectoryPoint = {
        t: t + frac * dt,
        x: y[0] + frac * (next[0] - y[0]),
        y: 0,
        vx: y[2] + frac * (next[2] - y[2]),
        vy: y[3] + frac * (next[3] - y[3]),
      }
      points.push(land)
      return { points, range: land.x, maxHeight: apex.y, flightTime: land.t, apex }
    }
    y = next
    t += dt
    const p = { t, x: y[0], y: y[1], vx: y[2], vy: y[3] }
    if (p.y > apex.y) apex = p
    if (i % 5 === 0) points.push(p)
  }
  const last = points[points.length - 1]
  return { points, range: last.x, maxHeight: apex.y, flightTime: last.t, apex }
}

/** Ideal (drag-free) closed forms, used only as the "theory" readouts. */
export function idealRange(v0: number, angleDeg: number, h0: number, g: number): number {
  const a = (angleDeg * Math.PI) / 180
  const vx = v0 * Math.cos(a)
  const vy = v0 * Math.sin(a)
  return (vx * (vy + Math.sqrt(vy * vy + 2 * g * h0))) / g
}

export function idealMaxHeight(v0: number, angleDeg: number, h0: number, g: number): number {
  const vy = v0 * Math.sin((angleDeg * Math.PI) / 180)
  return h0 + (vy * vy) / (2 * g)
}

export function idealFlightTime(v0: number, angleDeg: number, h0: number, g: number): number {
  const vy = v0 * Math.sin((angleDeg * Math.PI) / 180)
  return (vy + Math.sqrt(vy * vy + 2 * g * h0)) / g
}

/** Interpolated state at time t along a simulated trajectory. */
export function stateAt(tr: Trajectory, t: number): TrajectoryPoint {
  const pts = tr.points
  if (t <= 0) return pts[0]
  if (t >= tr.flightTime) return pts[pts.length - 1]
  let lo = 0
  let hi = pts.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (pts[mid].t <= t) lo = mid
    else hi = mid
  }
  const a = pts[lo]
  const b = pts[hi]
  const f = (t - a.t) / (b.t - a.t || 1)
  return {
    t,
    x: a.x + f * (b.x - a.x),
    y: a.y + f * (b.y - a.y),
    vx: a.vx + f * (b.vx - a.vx),
    vy: a.vy + f * (b.vy - a.vy),
  }
}
