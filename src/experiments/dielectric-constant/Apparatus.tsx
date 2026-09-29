import { useEffect, useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { capacitance, DIELECTRICS } from '@/physics/electromagnetism/dielectric'
import { chargeVoltage, dischargeVoltage } from '@/physics/electromagnetism/rc'
import { clear, graphPaper, label, rgba, roundRect } from '@/components/simulation/draw'
import { V0 } from './model'

export default function DielectricApparatus({ params, running, speed, resetKey }: ApparatusProps) {
  const d = DIELECTRICS[String(params.dielectric)] ?? DIELECTRICS.polyester
  const R = Number(params.resistance) * 1e6
  const mode = String(params.mode)
  const tMark = Number(params.time)
  const colors = useThemeColors()
  const t = useRef(0)
  useEffect(() => {
    t.current = 0
  }, [d, R, mode, resetKey])

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      const C = capacitance(d.k)
      const tau = R * C
      const tMax = Math.max(5 * tau, tMark * 1.1)
      t.current = Math.min(tMax, t.current + dt * 4 * (speed > 0 ? 1 : 0))
      const V = mode === 'charge' ? chargeVoltage(t.current, V0, R, C) : dischargeVoltage(t.current, V0, R, C)
      const Vat = (tt: number) => (mode === 'charge' ? chargeVoltage(tt, V0, R, C) : dischargeVoltage(tt, V0, R, C))
      const c = colors.current
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)
      const wide = w > 600
      const lw = wide ? w * 0.4 : w
      const lh = wide ? h : h * 0.5

      // Capacitor with dielectric and aligned dipoles
      const cx = lw / 2
      const cy = lh * 0.42
      const plateH = Math.min(150, lh * 0.55)
      ctx.fillStyle = c.ink
      ctx.fillRect(cx - 50, cy - plateH / 2, 8, plateH)
      ctx.fillRect(cx + 42, cy - plateH / 2, 8, plateH)
      ctx.fillStyle = rgba(c.sodium, 0.22)
      ctx.fillRect(cx - 42, cy - plateH / 2, 84, plateH)
      const align = V / V0
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 7; j++) {
          const x = cx - 30 + i * 20
          const y = cy - plateH / 2 + 12 + (j * (plateH - 24)) / 6
          const a = (1 - align) * Math.sin(i * 7 + j * 3.1) * 1.4
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(a)
          ctx.fillStyle = c.bad
          ctx.fillRect(-7, -2, 7, 4)
          ctx.fillStyle = c.prussian
          ctx.fillRect(0, -2, 7, 4)
          ctx.restore()
        }
      const q = Math.round(align * 7)
      for (let k = 0; k < q; k++) {
        label(ctx, '+', cx - 58, cy - plateH / 2 + 14 + k * (plateH / 7), c.bad, { align: 'center', size: 12, weight: 700 })
        label(ctx, '−', cx + 58, cy - plateH / 2 + 14 + k * (plateH / 7), c.prussian, { align: 'center', size: 12, weight: 700 })
      }
      label(ctx, `${d.label} (κ = ?)`, cx, cy + plateH / 2 + 20, c.ink2, { align: 'center', size: 11 })
      label(ctx, `${mode === 'charge' ? 'Charging' : 'Discharging'} through ${R / 1e6} MΩ`, cx, 24, c.ink, { align: 'center', size: 12, weight: 600 })
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.line
      roundRect(ctx, cx - 80, lh - 60, 160, 44, 8)
      ctx.fill()
      ctx.stroke()
      label(ctx, `${V.toFixed(2)} V`, cx, lh - 32, c.sodium, { align: 'center', size: 16, weight: 700 })

      // V(t) curve
      const gx = wide ? lw + 10 : 20
      const gy = wide ? 20 : lh + 6
      const gw = wide ? w - lw - 30 : w - 40
      const gh = wide ? h - 40 : h - lh - 20
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.line
      roundRect(ctx, gx, gy, gw, gh, 8)
      ctx.fill()
      ctx.stroke()
      const PX = (tt: number) => gx + 36 + (tt / tMax) * (gw - 50)
      const PY = (v: number) => gy + gh - 24 - (v / V0) * (gh - 44)
      ctx.strokeStyle = c.gridMajor
      ctx.beginPath()
      ctx.moveTo(PX(0), PY(0))
      ctx.lineTo(PX(tMax), PY(0))
      ctx.moveTo(PX(0), PY(0))
      ctx.lineTo(PX(0), PY(V0))
      ctx.stroke()
      ctx.strokeStyle = rgba(c.prussian, 0.25)
      ctx.beginPath()
      for (let i = 0; i <= 100; i++) {
        const tt = (tMax * i) / 100
        if (i === 0) ctx.moveTo(PX(tt), PY(Vat(tt)))
        else ctx.lineTo(PX(tt), PY(Vat(tt)))
      }
      ctx.stroke()
      if (running) {
        ctx.strokeStyle = c.prussian
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= 100; i++) {
          const tt = (t.current * i) / 100
          if (i === 0) ctx.moveTo(PX(tt), PY(Vat(tt)))
          else ctx.lineTo(PX(tt), PY(Vat(tt)))
        }
        ctx.stroke()
        ctx.lineWidth = 1
      }
      ctx.fillStyle = c.sodium
      ctx.beginPath()
      ctx.arc(PX(tMark), PY(Vat(tMark)), 5, 0, Math.PI * 2)
      ctx.fill()
      label(ctx, `read at t = ${tMark} s`, PX(tMark) + 8, PY(Vat(tMark)) - 8, c.sodium, { size: 11, weight: 600 })
      label(ctx, 'V (V)', gx + 8, gy + 14, c.ink3, { size: 10 })
      label(ctx, `t (s) → ${tMax.toFixed(0)}`, gx + gw - 8, PY(0) + 16, c.ink3, { align: 'right', size: 10 })
      label(ctx, `stopwatch ${t.current.toFixed(1)} s`, gx + gw - 8, gy + 14, c.ink3, { align: 'right', size: 10 })
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[380px] w-full sm:h-[400px]" role="img" aria-label={`${d.label} capacitor ${mode === 'charge' ? 'charging' : 'discharging'}`} />
}
