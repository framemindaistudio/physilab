import { useEffect, useMemo, useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { simulateTrajectory, stateAt } from '@/physics/mechanics/projectile'
import { gravityOf } from '@/physics/constants'
import { arrow, clear, label, rgba } from '@/components/simulation/draw'

function niceStep(range: number): number {
  const raw = range / 6
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const n = raw / mag
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * mag
}

export default function ProjectileApparatus({ params, running, speed, resetKey, onStop }: ApparatusProps) {
  const v0 = Number(params.v0)
  const angle = Number(params.angle)
  const h0 = Number(params.height)
  const k = Number(params.drag)
  const g = gravityOf(params.location)
  const colors = useThemeColors()

  const traj = useMemo(() => simulateTrajectory(v0, angle, h0, g, k, 0.002), [v0, angle, h0, g, k])
  const ideal = useMemo(() => (k > 0 ? simulateTrajectory(v0, angle, h0, g, 0, 0.004) : null), [v0, angle, h0, g, k])

  const t = useRef(0)
  const stopped = useRef(false)
  useEffect(() => {
    t.current = 0
    stopped.current = false
  }, [traj, resetKey])

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      t.current = Math.min(traj.flightTime, t.current + dt)
      if (t.current >= traj.flightTime && dt > 0 && !stopped.current) {
        stopped.current = true
        onStop?.()
      }
      const c = colors.current
      clear(ctx, w, h, c)

      const padL = 44
      const padB = 34
      const padT = 30
      const padR = 20
      const xMax = Math.max(traj.range, ideal?.range ?? 0, 4) * 1.08
      const yMax = Math.max(traj.maxHeight, ideal?.maxHeight ?? 0, h0, 2) * 1.18
      const scale = Math.min((w - padL - padR) / xMax, (h - padB - padT) / yMax)
      const X = (x: number) => padL + x * scale
      const Y = (y: number) => h - padB - y * scale

      // Metre grid
      const step = niceStep(Math.max(xMax, yMax))
      ctx.lineWidth = 1
      for (let x = 0; X(x) <= w - padR + 1; x += step / 5) {
        const major = Math.abs(x / step - Math.round(x / step)) < 1e-6
        ctx.strokeStyle = major ? c.gridMajor : c.grid
        ctx.beginPath()
        ctx.moveTo(X(x) + 0.5, padT - 10)
        ctx.lineTo(X(x) + 0.5, h - padB)
        ctx.stroke()
        if (major) label(ctx, `${+x.toFixed(2)}`, X(x), h - padB + 16, c.ink3, { align: 'center', size: 10 })
      }
      for (let y = 0; Y(y) >= padT - 10; y += step / 5) {
        const major = Math.abs(y / step - Math.round(y / step)) < 1e-6
        ctx.strokeStyle = major ? c.gridMajor : c.grid
        ctx.beginPath()
        ctx.moveTo(padL, Y(y) + 0.5)
        ctx.lineTo(w - padR, Y(y) + 0.5)
        ctx.stroke()
        if (major && y > 0) label(ctx, `${+y.toFixed(2)}`, padL - 6, Y(y) + 4, c.ink3, { align: 'right', size: 10 })
      }
      label(ctx, 'x (m)', w - padR, h - 6, c.ink3, { align: 'right', size: 10 })
      label(ctx, 'y (m)', 6, padT - 14, c.ink3, { size: 10 })

      // Ground
      ctx.strokeStyle = c.ink2
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(padL - 10, Y(0))
      ctx.lineTo(w - padR, Y(0))
      ctx.stroke()

      // Launch platform
      if (h0 > 0) {
        ctx.fillStyle = rgba(c.ink3, 0.25)
        ctx.fillRect(X(0) - 18, Y(h0), 18, Y(0) - Y(h0))
        ctx.strokeStyle = c.ink3
        ctx.strokeRect(X(0) - 18, Y(h0), 18, Y(0) - Y(h0))
      }

      // Drag-free reference path
      if (ideal) {
        ctx.setLineDash([5, 5])
        ctx.strokeStyle = rgba(c.prussian, 0.4)
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ideal.points.forEach((pt, i) => (i ? ctx.lineTo(X(pt.x), Y(pt.y)) : ctx.moveTo(X(pt.x), Y(pt.y))))
        ctx.stroke()
        ctx.setLineDash([])
        label(ctx, 'no drag', X(ideal.range) - 4, Y(0) - 8, rgba(c.prussian, 0.7), { align: 'right', size: 10 })
      }

      // Launcher barrel
      const a = (angle * Math.PI) / 180
      ctx.strokeStyle = c.ink
      ctx.lineWidth = 7
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(X(0), Y(h0))
      ctx.lineTo(X(0) + 26 * Math.cos(a), Y(h0) - 26 * Math.sin(a))
      ctx.stroke()
      ctx.lineCap = 'butt'

      // Travelled path
      ctx.strokeStyle = c.prussian
      ctx.lineWidth = 2
      ctx.beginPath()
      let started = false
      for (const pt of traj.points) {
        if (pt.t > t.current) break
        if (!started) {
          ctx.moveTo(X(pt.x), Y(pt.y))
          started = true
        } else ctx.lineTo(X(pt.x), Y(pt.y))
      }
      const s = stateAt(traj, t.current)
      ctx.lineTo(X(s.x), Y(s.y))
      ctx.stroke()

      // Apex marker once passed
      if (t.current >= traj.apex.t) {
        ctx.setLineDash([3, 3])
        ctx.strokeStyle = c.sodium
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(X(traj.apex.x), Y(traj.apex.y))
        ctx.lineTo(X(traj.apex.x), Y(0))
        ctx.stroke()
        ctx.setLineDash([])
        label(ctx, `H = ${traj.maxHeight.toFixed(2)} m`, X(traj.apex.x) + 6, Y(traj.apex.y) - 8, c.sodium, { size: 11, weight: 600 })
      }
      if (t.current >= traj.flightTime) {
        label(ctx, `R = ${traj.range.toFixed(2)} m`, X(traj.range), Y(0) - 10, c.sodium, { align: 'center', size: 11, weight: 600 })
      }

      // Velocity components
      const vs = 1.6
      arrow(ctx, X(s.x), Y(s.y), X(s.x) + s.vx * vs, Y(s.y), rgba(c.prussian, 0.8), 1.6, 7)
      arrow(ctx, X(s.x), Y(s.y), X(s.x), Y(s.y) - s.vy * vs, rgba(c.sodium, 0.9), 1.6, 7)
      arrow(ctx, X(s.x), Y(s.y), X(s.x) + s.vx * vs, Y(s.y) - s.vy * vs, c.ink2, 1.2, 7)

      // Projectile
      ctx.fillStyle = c.ink
      ctx.beginPath()
      ctx.arc(X(s.x), Y(s.y), 6, 0, Math.PI * 2)
      ctx.fill()

      // HUD
      const v = Math.hypot(s.vx, s.vy)
      label(ctx, `t  ${s.t.toFixed(2)} s`, w - padR, 22, c.ink, { align: 'right', size: 12 })
      label(ctx, `x  ${s.x.toFixed(2)} m   y  ${s.y.toFixed(2)} m`, w - padR, 40, c.ink2, { align: 'right', size: 11 })
      label(ctx, `|v|  ${v.toFixed(2)} m/s`, w - padR, 56, c.ink2, { align: 'right', size: 11 })
      label(ctx, 'vₓ', w - padR - 92, 74, c.prussian, { size: 11 })
      label(ctx, 'v_y', w - padR - 62, 74, c.sodium, { size: 11 })
      label(ctx, 'v', w - padR - 24, 74, c.ink2, { size: 11 })
    },
    running,
    speed,
  )

  return (
    <canvas
      ref={canvasRef}
      className="block h-[340px] w-full sm:h-[420px]"
      role="img"
      aria-label={`Projectile launched at ${v0} m/s and ${angle} degrees`}
    />
  )
}
