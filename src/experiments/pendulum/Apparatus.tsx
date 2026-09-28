import { useEffect, useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { pendulumStep, type PendulumState } from '@/physics/mechanics/pendulum'
import { gravityOf } from '@/physics/constants'
import { rad } from '@/physics/numerics'
import { clear, graphPaper, label, rgba } from '@/components/simulation/draw'

interface Sim extends PendulumState {
  t: number
  crossings: number
  lastCrossT: number
  lastPeriod: number
  trail: { x: number; y: number }[]
}

const H = 1 / 2000 // integration step (s)

export default function PendulumApparatus({ params, running, speed, resetKey }: ApparatusProps) {
  const L = Number(params.length)
  const theta0 = rad(Number(params.amplitude))
  const mass = Number(params.mass)
  const g = gravityOf(params.location)
  const colors = useThemeColors()

  const sim = useRef<Sim>(fresh(theta0))
  useEffect(() => {
    sim.current = fresh(theta0)
  }, [L, theta0, g, resetKey])

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      const s = sim.current
      // Advance the equation of motion in fixed steps (the same integrator the measurements use).
      let remaining = dt
      while (remaining > 1e-9) {
        const step = Math.min(H, remaining)
        const next = pendulumStep(s, L, g, step)
        if (s.theta > 0 && next.theta <= 0) {
          // Bob passes the mean position moving left: one complete oscillation between such events.
          const tc = s.t + (s.theta / (s.theta - next.theta)) * step
          if (s.crossings > 0) s.lastPeriod = tc - s.lastCrossT
          s.lastCrossT = tc
          s.crossings++
        }
        s.theta = next.theta
        s.omega = next.omega
        s.t += step
        remaining -= step
      }

      const c = colors.current
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)

      const top = 34
      const pxPerM = (h - top - 46) / 2.05
      const px = w / 2
      const py = top
      const bx = px + L * pxPerM * Math.sin(s.theta)
      const by = py + L * pxPerM * Math.cos(s.theta)

      // Support
      ctx.fillStyle = c.ink2
      ctx.fillRect(px - 70, top - 12, 140, 8)
      ctx.strokeStyle = c.ink3
      ctx.lineWidth = 1
      for (let i = -66; i < 70; i += 8) {
        ctx.beginPath()
        ctx.moveTo(px + i, top - 12)
        ctx.lineTo(px + i + 6, top - 20)
        ctx.stroke()
      }

      // Mean position and amplitude arc
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = c.ink3
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px, py + L * pxPerM + 24)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = rgba(c.prussian, 0.35)
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(px, py, L * pxPerM, Math.PI / 2 - theta0, Math.PI / 2 + theta0)
      ctx.stroke()

      // Trail
      s.trail.push({ x: bx, y: by })
      if (s.trail.length > 50) s.trail.shift()
      s.trail.forEach((p, i) => {
        ctx.fillStyle = rgba(c.sodium, (i / s.trail.length) * 0.35)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fill()
      })

      // String and bob
      ctx.strokeStyle = c.ink
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(bx, by)
      ctx.stroke()
      const r = 7 + 9 * Math.cbrt(mass / 500)
      const grad = ctx.createRadialGradient(bx - r / 3, by - r / 3, r / 5, bx, by, r)
      grad.addColorStop(0, c.dark ? '#c9d6e6' : '#8fa9c9')
      grad.addColorStop(1, c.prussian)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(bx, by, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = c.ink
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, Math.PI * 2)
      ctx.fill()

      // Scale bar (0.5 m) — the drawing is to scale.
      const sb = 0.5 * pxPerM
      ctx.strokeStyle = c.ink2
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(16, h - 20)
      ctx.lineTo(16 + sb, h - 20)
      ctx.moveTo(16, h - 25)
      ctx.lineTo(16, h - 15)
      ctx.moveTo(16 + sb, h - 25)
      ctx.lineTo(16 + sb, h - 15)
      ctx.stroke()
      label(ctx, '0.5 m', 16 + sb / 2, h - 28, c.ink2, { align: 'center', size: 11 })

      // Stopwatch HUD
      const deg = (s.theta * 180) / Math.PI
      label(ctx, `t   ${s.t.toFixed(2)} s`, w - 16, 26, c.ink, { align: 'right', size: 13 })
      label(ctx, `n   ${Math.max(0, s.crossings - 1)}`, w - 16, 44, c.ink2, { align: 'right', size: 12 })
      label(ctx, `θ   ${deg.toFixed(1)}°`, w - 16, 62, c.ink2, { align: 'right', size: 12 })
      if (s.lastPeriod > 0) label(ctx, `T   ${s.lastPeriod.toFixed(3)} s`, w - 16, 80, c.sodium, { align: 'right', size: 12, weight: 600 })
      label(ctx, `L = ${L.toFixed(2)} m`, bx + r + 6, by + 4, c.ink2, { size: 11 })
    },
    running,
    speed,
  )

  return (
    <canvas
      ref={canvasRef}
      className="block h-[360px] w-full sm:h-[440px]"
      role="img"
      aria-label={`Pendulum of length ${L} metres swinging with amplitude ${params.amplitude} degrees`}
    />
  )
}

function fresh(theta0: number): Sim {
  return { theta: theta0, omega: 0, t: 0, crossings: 0, lastCrossT: 0, lastPeriod: 0, trail: [] }
}
