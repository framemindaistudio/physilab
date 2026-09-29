import { useEffect, useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { hallVoltage, SAMPLES } from '@/physics/semiconductor/hall'
import { arrow, clear, graphPaper, label, rgba, roundRect } from '@/components/simulation/draw'

interface Carrier {
  x: number
  y: number
}

export default function HallApparatus({ params, running, speed, resetKey }: ApparatusProps) {
  const s = SAMPLES[String(params.sample)] ?? SAMPLES['n-ge']
  const ImA = Number(params.current)
  const B = Number(params.field)
  const colors = useThemeColors()
  const carriers = useRef<Carrier[]>([])
  useEffect(() => {
    carriers.current = Array.from({ length: 70 }, () => ({ x: Math.random(), y: 0.1 + Math.random() * 0.8 }))
  }, [resetKey, params.sample])

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      const c = colors.current
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)
      const VH = hallVoltage(ImA * 1e-3, B, s) * 1000 // mV
      const px = 70
      const py = h * 0.24
      const pw = w - 180
      const ph = h * 0.5

      // Magnetic field: dots (out of the page), density ∝ B
      const spacing = 44 - 22 * B
      ctx.fillStyle = rgba(c.prussian, 0.35)
      for (let y = py - 30; y < py + ph + 30; y += spacing)
        for (let x = px - 40; x < px + pw + 40; x += spacing) {
          ctx.beginPath()
          ctx.arc(x, y, 2.2, 0, Math.PI * 2)
          ctx.fill()
        }
      label(ctx, `B = ${B.toFixed(2)} T (out of page ⊙)`, px - 40, py - 40, c.prussian, { size: 11, weight: 600 })

      // Slab
      ctx.fillStyle = rgba(c.sodium, 0.12)
      ctx.strokeStyle = c.ink
      ctx.lineWidth = 2
      roundRect(ctx, px, py, pw, ph, 6)
      ctx.fill()
      ctx.stroke()
      ctx.lineWidth = 1
      label(ctx, s.label, px + pw / 2, py + ph + 22, c.ink2, { align: 'center', size: 12 })

      // Conventional current left → right
      arrow(ctx, px - 50, py + ph / 2, px - 6, py + ph / 2, c.ink, 2.5, 9)
      arrow(ctx, px + pw + 6, py + ph / 2, px + pw + 50, py + ph / 2, c.ink, 2.5, 9)
      label(ctx, `I = ${ImA.toFixed(1)} mA`, px - 50, py + ph / 2 - 10, c.ink2, { size: 11 })

      // Carriers: electrons drift right→left, holes left→right; F = qv×B pushes both to the same edge
      // for this geometry, and the sign of the accumulated charge gives the sign of V_H.
      const drift = (ImA / 10) * 0.35 * s.sign * (running ? 1 : 0)
      const push = running ? 0.5 * B * (ImA / 10) : 0
      for (const cr of carriers.current) {
        cr.x += drift * dt * speed
        if (cr.x > 1) cr.x -= 1
        if (cr.x < 0) cr.x += 1
        // Lorentz deflection towards the bottom edge, balanced near the edge by the Hall field.
        cr.y += push * dt * speed * (1 - cr.y) * 1.2
        if (!running) cr.y += (0.5 - cr.y) * dt * 0.5
        cr.y = Math.min(0.94, Math.max(0.06, cr.y))
      }
      for (const cr of carriers.current) {
        const x = px + cr.x * pw
        const y = py + cr.y * ph
        ctx.fillStyle = s.sign < 0 ? c.prussian : c.bad
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      label(ctx, s.sign < 0 ? '● electrons' : '● holes', px + pw - 4, py - 8, s.sign < 0 ? c.prussian : c.bad, { align: 'right', size: 11 })

      // Edge charges and Hall voltmeter
      const q = Math.min(10, Math.round(Math.abs(VH) * 1.5))
      for (let i = 0; i < q; i++) {
        const x = px + 20 + (i * (pw - 40)) / Math.max(1, q - 1)
        label(ctx, s.sign < 0 ? '−' : '+', x, py + ph - 4, s.sign < 0 ? c.prussian : c.bad, { align: 'center', size: 14, weight: 700 })
        label(ctx, s.sign < 0 ? '+' : '−', x, py + 14, s.sign < 0 ? c.bad : c.prussian, { align: 'center', size: 14, weight: 700 })
      }
      const mx = px + pw + 70
      ctx.strokeStyle = c.ink2
      ctx.beginPath()
      ctx.moveTo(px + pw / 2, py)
      ctx.lineTo(px + pw / 2, py - 14)
      ctx.lineTo(mx, py - 14)
      ctx.lineTo(mx, py + ph / 2 - 24)
      ctx.moveTo(px + pw / 2, py + ph)
      ctx.lineTo(px + pw / 2, py + ph + 36)
      ctx.lineTo(mx, py + ph + 36)
      ctx.lineTo(mx, py + ph / 2 + 24)
      ctx.stroke()
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.ink
      ctx.beginPath()
      ctx.arc(mx, py + ph / 2, 22, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      label(ctx, 'V_H', mx, py + ph / 2 + 4, c.ink, { align: 'center', size: 11, weight: 700 })
      label(ctx, `${VH >= 0 ? '+' : ''}${VH.toFixed(2)} mV`, mx, py + ph / 2 + 44, c.sodium, { align: 'center', size: 14, weight: 700 })
      label(ctx, 'F = q v × B', 14, h - 14, c.ink3, { size: 11 })
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[360px] w-full sm:h-[400px]" role="img" aria-label={`Hall effect in ${s.label}`} />
}
