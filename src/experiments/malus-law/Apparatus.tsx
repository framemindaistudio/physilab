import { useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { transmitted } from '@/physics/optics/malus'
import { arrow, clear, graphPaper, label, rgba, roundRect } from '@/components/simulation/draw'
import { MALUS_BACKGROUND, sourceIntensity } from './model'

function polariser(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angleDeg: number, stroke: string, fill: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = fill
  ctx.strokeStyle = stroke
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(0, 0, r * 0.38, r, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  // Transmission axis lines, seen in perspective (vertical = 0°), clipped to the disc.
  ctx.clip()
  const a = (angleDeg * Math.PI) / 180
  const dir = { x: Math.sin(a) * 0.38, y: -Math.cos(a) }
  const perp = { x: Math.cos(a) * 0.38, y: Math.sin(a) }
  ctx.lineWidth = 1.2
  for (let k = -5; k <= 5; k++) {
    const ox = (perp.x * k * r) / 5
    const oy = (perp.y * k * r) / 5
    ctx.beginPath()
    ctx.moveTo(ox - dir.x * r * 1.3, oy - dir.y * r * 1.3)
    ctx.lineTo(ox + dir.x * r * 1.3, oy + dir.y * r * 1.3)
    ctx.stroke()
  }
  ctx.restore()
}

export default function MalusApparatus({ params, running, speed }: ApparatusProps) {
  const theta = Number(params.angle)
  const lamp = Number(params.lamp)
  const colors = useThemeColors()
  const phase = useRef(0)

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      phase.current += dt * 6 * speed
      const c = colors.current
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)
      const I0 = sourceIntensity(lamp)
      const I = transmitted(I0, theta, MALUS_BACKGROUND)
      const frac = I0 > 0 ? transmitted(1, theta) : 0

      const wide = w > 560
      const benchW = wide ? w * 0.66 : w
      const cy = wide ? h * 0.46 : h * 0.3
      const r = Math.min(56, h * 0.16)
      const xs = [benchW * 0.08, benchW * 0.34, benchW * 0.62, benchW * 0.9]

      // Beam: unpolarised → polarised (half intensity) → after analyser (cos²θ)
      const seg = (x1: number, x2: number, alpha: number) => {
        ctx.fillStyle = rgba(c.sodium, Math.max(0.04, alpha))
        ctx.fillRect(x1, cy - 10, x2 - x1, 20)
      }
      const on = lamp > 0
      seg(xs[0] + 18, xs[1], on ? 0.55 : 0)
      seg(xs[1], xs[2], on ? 0.38 : 0)
      seg(xs[2], xs[3] - 18, on ? 0.38 * frac + 0.02 : 0)

      // Lamp
      ctx.fillStyle = c.ink
      roundRect(ctx, xs[0] - 20, cy - 22, 40, 44, 8)
      ctx.fill()
      label(ctx, 'lamp', xs[0], cy + 40, c.ink3, { align: 'center', size: 10 })

      polariser(ctx, xs[1], cy, r, 0, c.prussian, rgba(c.prussian, 0.12))
      polariser(ctx, xs[2], cy, r, theta, c.prussian, rgba(c.prussian, 0.12))
      label(ctx, 'polariser (0°)', xs[1], cy + r + 18, c.ink2, { align: 'center', size: 11 })
      label(ctx, `analyser θ = ${theta}°`, xs[2], cy + r + 18, c.sodium, { align: 'center', size: 11, weight: 600 })

      // E-field vectors oscillating along the transmission axes
      if (on && running) {
        const e1 = Math.sin(phase.current) * r * 0.55
        arrow(ctx, (xs[1] + xs[2]) / 2, cy, (xs[1] + xs[2]) / 2, cy - e1, c.ink, 2, 7)
        const a = (theta * Math.PI) / 180
        const amp = Math.cos(a) * Math.sin(phase.current) * r * 0.55
        const mx = (xs[2] + xs[3]) / 2
        arrow(ctx, mx, cy, mx + Math.sin(a) * amp * 0.5, cy - Math.cos(a) * amp, c.ink, 2, 7)
      }
      label(ctx, 'E', (xs[1] + xs[2]) / 2 + 8, cy - r * 0.6, c.ink3, { size: 10 })

      // Detector and meter
      ctx.fillStyle = c.ink2
      roundRect(ctx, xs[3] - 16, cy - 26, 32, 52, 6)
      ctx.fill()
      label(ctx, 'detector', xs[3], cy + 44, c.ink3, { align: 'center', size: 10 })
      label(ctx, `${I.toFixed(2)} µA`, xs[3], cy - 36, c.sodium, { align: 'center', size: 14, weight: 700 })

      // Polar plot of I(θ) = I₀cos²θ
      const px = wide ? benchW + (w - benchW) / 2 : w / 2
      const py = wide ? h * 0.46 : h * 0.72
      const pr = wide ? Math.min((w - benchW) / 2 - 16, h * 0.34) : Math.min(w / 2 - 20, h * 0.22)
      ctx.strokeStyle = c.gridMajor
      ctx.beginPath()
      ctx.arc(px, py, pr, 0, Math.PI * 2)
      ctx.moveTo(px - pr, py)
      ctx.lineTo(px + pr, py)
      ctx.moveTo(px, py - pr)
      ctx.lineTo(px, py + pr)
      ctx.stroke()
      ctx.strokeStyle = c.prussian
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let d = 0; d <= 360; d += 2) {
        const rr = pr * transmitted(1, d)
        const a = (d * Math.PI) / 180
        const x = px + rr * Math.sin(a)
        const y = py - rr * Math.cos(a)
        if (d === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      const a = (theta * Math.PI) / 180
      ctx.fillStyle = c.sodium
      ctx.beginPath()
      ctx.arc(px + pr * frac * Math.sin(a), py - pr * frac * Math.cos(a), 5, 0, Math.PI * 2)
      ctx.fill()
      label(ctx, 'I(θ) ∝ cos²θ', px, py + pr + 16, c.ink3, { align: 'center', size: 10 })
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[380px] w-full sm:h-[400px]" role="img" aria-label={`Polariser and analyser at ${theta} degrees`} />
}
