import { useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { acceptanceAngleDeg, FIBRES, spotDiameter } from '@/physics/optics/fiber'
import { clear, graphPaper, label, rgba } from '@/components/simulation/draw'

export default function FibreApparatus({ params, running, speed }: ApparatusProps) {
  const f = FIBRES[String(params.fiber)] ?? FIBRES['silica-mm']
  const Lmm = Number(params.distance)
  const colors = useThemeColors()
  const phase = useRef(0)

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      phase.current += dt * speed
      const c = colors.current
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)
      const th = (acceptanceAngleDeg(f) * Math.PI) / 180
      const W = spotDiameter(Lmm / 1000, f) * 1000
      const beam = 'rgba(220,40,40,'

      // ---- Fibre (side view) ----
      const cy = h * 0.32
      const x0 = 70
      const x1 = w * 0.62
      const coreH = 26
      ctx.fillStyle = rgba(c.prussian, 0.12)
      ctx.fillRect(x0, cy - coreH, x1 - x0, 2 * coreH)
      ctx.fillStyle = rgba(c.prussian, 0.26)
      ctx.fillRect(x0, cy - coreH / 2, x1 - x0, coreH)
      label(ctx, `core n₁ = ${f.n1}`, x0 + 8, cy + 4, c.prussian, { size: 10, weight: 600 })
      label(ctx, `cladding n₂ = ${f.n2}`, x0 + 8, cy - coreH + 11, c.ink2, { size: 10 })
      // Acceptance cone at the input
      const coneLen = 60
      ctx.fillStyle = `${beam}0.12)`
      ctx.beginPath()
      ctx.moveTo(x0, cy)
      ctx.lineTo(x0 - coneLen, cy - coneLen * Math.tan(th))
      ctx.lineTo(x0 - coneLen, cy + coneLen * Math.tan(th))
      ctx.closePath()
      ctx.fill()
      label(ctx, `θₐ = ${acceptanceAngleDeg(f).toFixed(1)}°`, x0 - coneLen + 2, cy - coneLen * Math.tan(th) - 6, c.bad, { size: 10, weight: 600 })
      // Zig-zag ray guided by total internal reflection
      if (running) {
        const inside = Math.asin(Math.sin(th * 0.85) / f.n1)
        const hop = (coreH / 2) / Math.tan(inside)
        ctx.strokeStyle = `${beam}0.9)`
        ctx.lineWidth = 1.8
        ctx.beginPath()
        ctx.moveTo(x0 - coneLen, cy - coneLen * Math.tan(th * 0.85))
        ctx.lineTo(x0, cy)
        // Bounce between the core boundaries every `hop` pixels.
        let x = x0 + hop / 2
        let up = true
        while (x < x1) {
          ctx.lineTo(x, up ? cy - coreH / 2 : cy + coreH / 2)
          x += hop
          up = !up
        }
        ctx.lineTo(x1, cy)
        ctx.stroke()
        ctx.lineWidth = 1
        // Pulse travelling along the fibre
        const px = x0 + ((phase.current * 120) % (x1 - x0))
        ctx.fillStyle = `${beam}0.9)`
        ctx.beginPath()
        ctx.arc(px, cy, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      label(ctx, 'total internal reflection', (x0 + x1) / 2, cy + coreH + 16, c.ink3, { align: 'center', size: 10 })

      // Output cone to the screen
      const sx = x1 + Math.min(w - x1 - 40, 30 + Lmm * 1.6)
      if (running) {
        ctx.fillStyle = `${beam}0.14)`
        ctx.beginPath()
        ctx.moveTo(x1, cy)
        ctx.lineTo(sx, cy - (sx - x1) * Math.tan(th))
        ctx.lineTo(sx, cy + (sx - x1) * Math.tan(th))
        ctx.closePath()
        ctx.fill()
      }
      ctx.fillStyle = c.ink2
      ctx.fillRect(sx, cy - 80, 4, 160)
      label(ctx, `L = ${Lmm} mm`, (x1 + sx) / 2, cy + 96, c.ink2, { align: 'center', size: 11 })
      label(ctx, 'screen', sx + 8, cy - 70, c.ink3, { size: 10 })

      // ---- Screen view: the spot on mm graph paper ----
      const vy = h * 0.62
      const vh = h - vy - 16
      const vx = w / 2 - vh / 2
      ctx.fillStyle = '#fbfcfb'
      ctx.fillRect(vx, vy, vh, vh)
      const mmPx = vh / 130
      ctx.strokeStyle = '#dce6e2'
      for (let i = 0; i <= 130; i += 5) {
        ctx.strokeStyle = i % 10 === 0 ? '#c3d5cf' : '#e4ece9'
        ctx.beginPath()
        ctx.moveTo(vx + i * mmPx, vy)
        ctx.lineTo(vx + i * mmPx, vy + vh)
        ctx.moveTo(vx, vy + i * mmPx)
        ctx.lineTo(vx + vh, vy + i * mmPx)
        ctx.stroke()
      }
      if (running) {
        const r = (W / 2) * mmPx
        const grad = ctx.createRadialGradient(vx + vh / 2, vy + vh / 2, 0, vx + vh / 2, vy + vh / 2, r)
        grad.addColorStop(0, `${beam}0.95)`)
        grad.addColorStop(0.85, `${beam}0.55)`)
        grad.addColorStop(1, `${beam}0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(vx + vh / 2, vy + vh / 2, Math.min(r, vh / 2), 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = c.sodium
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(vx + vh / 2 - r, vy + vh / 2)
        ctx.lineTo(vx + vh / 2 + r, vy + vh / 2)
        ctx.stroke()
        ctx.lineWidth = 1
      }
      label(ctx, running ? `W = ${W.toFixed(1)} mm` : 'Press Start to launch light into the fibre', vx + vh + 12, vy + vh / 2, running ? c.sodium : c.ink3, { size: 13, weight: 700 })
      label(ctx, 'spot on the screen (mm grid)', vx - 10, vy + 14, c.ink3, { align: 'right', size: 10 })
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[400px] w-full sm:h-[440px]" role="img" aria-label={`${f.label} with screen at ${Lmm} millimetres`} />
}
