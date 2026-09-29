import { useEffect, useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { dischargeVoltage, timeConstant } from '@/physics/electromagnetism/rc'
import { clear, graphPaper, label, rgba, roundRect } from '@/components/simulation/draw'

export default function RcApparatus({ params, running, speed, resetKey }: ApparatusProps) {
  const R = Number(params.resistance) * 1e3
  const C = Number(params.capacitance) * 1e-6
  const V0 = Number(params.v0)
  const tMark = Number(params.time)
  const colors = useThemeColors()
  const t = useRef(0)
  useEffect(() => {
    t.current = 0
  }, [R, C, V0, resetKey])

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      const tau = timeConstant(R, C)
      const tMax = Math.max(5 * tau, tMark * 1.1)
      // Simulated stopwatch: runs at 5× real time so a discharge fits on screen.
      t.current = Math.min(tMax, t.current + dt * 5)
      const V = dischargeVoltage(t.current, V0, R, C)
      const c = colors.current
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)

      // ---- Circuit ----
      const wide = w > 600
      const cw = wide ? w * 0.42 : w
      const chH = wide ? h : h * 0.46
      const x1 = 40
      const x2 = cw - 40
      const y1 = chH * 0.22
      const y2 = chH * 0.78
      ctx.strokeStyle = c.ink2
      ctx.lineWidth = 2
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
      // Capacitor on the left side
      const cy = (y1 + y2) / 2
      ctx.fillStyle = c.canvas
      ctx.fillRect(x1 - 20, cy - 14, 40, 28)
      ctx.strokeStyle = c.ink
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x1 - 16, cy - 6)
      ctx.lineTo(x1 + 16, cy - 6)
      ctx.moveTo(x1 - 16, cy + 6)
      ctx.lineTo(x1 + 16, cy + 6)
      ctx.stroke()
      // Charge on the plates ∝ V
      const q = Math.round((V / V0) * 6)
      for (let i = 0; i < q; i++) {
        label(ctx, '+', x1 - 12 + i * 5, cy - 10, c.bad, { size: 9, weight: 700 })
        label(ctx, '−', x1 - 12 + i * 5, cy + 17, c.prussian, { size: 9, weight: 700 })
      }
      label(ctx, `C = ${(C * 1e6).toFixed(0)} µF`, x1 + 22, cy + 4, c.ink2, { size: 11 })
      // Resistor on the right side
      ctx.fillStyle = c.canvas
      ctx.fillRect(x2 - 14, cy - 30, 28, 60)
      ctx.strokeStyle = c.ink
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x2, cy - 30)
      for (let i = 0; i < 6; i++) ctx.lineTo(x2 + (i % 2 ? -9 : 9), cy - 25 + i * 10)
      ctx.lineTo(x2, cy + 30)
      ctx.stroke()
      label(ctx, `R = ${(R / 1e3).toFixed(0)} kΩ`, x2 - 18, cy + 4, c.ink2, { align: 'right', size: 11 })
      // Voltmeter across the capacitor
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.ink
      ctx.beginPath()
      ctx.arc((x1 + x2) / 2, y1, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      label(ctx, 'V', (x1 + x2) / 2, y1 + 4, c.ink, { align: 'center', size: 12, weight: 700 })
      label(ctx, `${V.toFixed(2)} V`, (x1 + x2) / 2, y1 - 26, c.sodium, { align: 'center', size: 15, weight: 700 })
      // Discharge current: dots moving along the loop, speed ∝ I
      if (running && V > 0.02) {
        const per = 2 * (x2 - x1 + y2 - y1)
        const n = 14
        for (let i = 0; i < n; i++) {
          let s = ((i / n) * per + t.current * 40 * (V / V0) * 5) % per
          let px: number
          let py: number
          if (s < x2 - x1) {
            px = x1 + s
            py = y2
          } else if ((s -= x2 - x1) < y2 - y1) {
            px = x2
            py = y2 - s
          } else if ((s -= y2 - y1) < x2 - x1) {
            px = x2 - s
            py = y1
          } else {
            s -= x2 - x1
            px = x1
            py = y1 + s
          }
          ctx.fillStyle = rgba(c.sodium, 0.9)
          ctx.beginPath()
          ctx.arc(px, py, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      label(ctx, `τ = RC = ${tau.toFixed(1)} s`, x1, y2 + 26, c.ink2, { size: 11 })
      label(ctx, `stopwatch ${t.current.toFixed(1)} s`, x1, y2 + 42, c.ink3, { size: 11 })

      // ---- V(t) graph ----
      const gx = wide ? cw + 20 : 20
      const gy = wide ? 24 : chH + 10
      const gw = wide ? w - cw - 40 : w - 40
      const gh = wide ? h - 60 : h - chH - 40
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.line
      roundRect(ctx, gx, gy, gw, gh, 8)
      ctx.fill()
      ctx.stroke()
      const PX = (tt: number) => gx + 34 + (tt / tMax) * (gw - 46)
      const PY = (v: number) => gy + gh - 24 - (v / V0) * (gh - 44)
      ctx.strokeStyle = c.gridMajor
      ctx.beginPath()
      ctx.moveTo(PX(0), PY(0))
      ctx.lineTo(PX(tMax), PY(0))
      ctx.moveTo(PX(0), PY(0))
      ctx.lineTo(PX(0), PY(V0))
      ctx.stroke()
      // τ marker: V falls to 1/e ≈ 37%
      ctx.setLineDash([3, 3])
      ctx.strokeStyle = c.ink3
      ctx.beginPath()
      ctx.moveTo(PX(tau), PY(0))
      ctx.lineTo(PX(tau), PY(V0 / Math.E))
      ctx.lineTo(PX(0), PY(V0 / Math.E))
      ctx.stroke()
      ctx.setLineDash([])
      label(ctx, 'τ', PX(tau), PY(0) + 14, c.ink3, { align: 'center', size: 10 })
      label(ctx, '0.37 V₀', PX(0) - 4, PY(V0 / Math.E) + 3, c.ink3, { align: 'right', size: 9 })
      // Theory curve (faint) and live trace
      ctx.strokeStyle = rgba(c.prussian, 0.25)
      ctx.beginPath()
      for (let i = 0; i <= 100; i++) {
        const tt = (tMax * i) / 100
        if (i === 0) ctx.moveTo(PX(tt), PY(dischargeVoltage(tt, V0, R, C)))
        else ctx.lineTo(PX(tt), PY(dischargeVoltage(tt, V0, R, C)))
      }
      ctx.stroke()
      ctx.strokeStyle = c.prussian
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 100; i++) {
        const tt = (t.current * i) / 100
        if (i === 0) ctx.moveTo(PX(tt), PY(dischargeVoltage(tt, V0, R, C)))
        else ctx.lineTo(PX(tt), PY(dischargeVoltage(tt, V0, R, C)))
      }
      ctx.stroke()
      ctx.lineWidth = 1
      // The reading time chosen by the student
      ctx.fillStyle = c.sodium
      ctx.beginPath()
      ctx.arc(PX(tMark), PY(dischargeVoltage(tMark, V0, R, C)), 5, 0, Math.PI * 2)
      ctx.fill()
      label(ctx, `read at t = ${tMark} s`, PX(tMark) + 8, PY(dischargeVoltage(tMark, V0, R, C)) - 8, c.sodium, { size: 11, weight: 600 })
      label(ctx, 'V (V)', gx + 8, gy + 14, c.ink3, { size: 10 })
      label(ctx, 't (s)', gx + gw - 8, PY(0) + 16, c.ink3, { align: 'right', size: 10 })
      label(ctx, `${tMax.toFixed(0)}`, PX(tMax), PY(0) + 14, c.ink3, { align: 'center', size: 9 })
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[380px] w-full sm:h-[400px]" role="img" aria-label={`Capacitor discharging through ${R / 1000} kilo-ohms`} />
}
