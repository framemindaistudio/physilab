import { useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { reactanceC, reactanceL, resonantFrequency, seriesCurrent, seriesPhase } from '@/physics/electromagnetism/lcr'
import { arrow, clear, graphPaper, label, roundRect } from '@/components/simulation/draw'
import { SOURCE_V } from './model'

export default function LcrApparatus({ params, running, speed }: ApparatusProps) {
  const f = Number(params.frequency)
  const R = Number(params.resistance)
  const L = Number(params.inductance) / 1000
  const C = Number(params.capacitance) * 1e-6
  const colors = useThemeColors()
  const phase = useRef(0)

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      phase.current += dt * speed * 1.2
      const c = colors.current
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)
      const I = seriesCurrent(SOURCE_V, f, R, L, C)
      const phi = seriesPhase(f, R, L, C)
      const f0 = resonantFrequency(L, C)
      const wide = w > 600

      // ---- Phasor diagram ----
      const px = wide ? w * 0.22 : w * 0.3
      const py = h * 0.32
      const scale = Math.min(w, h) * 0.1 / SOURCE_V
      const rot = running ? phase.current : 0
      const VR = I * R
      const VL = I * reactanceL(f, L)
      const VC = I * reactanceC(f, C)
      const toXY = (mag: number, ang: number) => [px + mag * scale * Math.cos(ang + rot), py - mag * scale * Math.sin(ang + rot)] as const
      ctx.strokeStyle = c.gridMajor
      ctx.beginPath()
      ctx.arc(px, py, SOURCE_V * scale, 0, Math.PI * 2)
      ctx.stroke()
      const [rx, ry] = toXY(VR, 0)
      arrow(ctx, px, py, rx, ry, c.prussian, 2.4, 9)
      const [lx, ly] = toXY(Math.min(VL, SOURCE_V * 3), Math.PI / 2)
      arrow(ctx, px, py, lx, ly, c.ok, 2, 8)
      const [cx2, cy2] = toXY(Math.min(VC, SOURCE_V * 3), -Math.PI / 2)
      arrow(ctx, px, py, cx2, cy2, c.bad, 2, 8)
      const [vx, vy] = toXY(SOURCE_V, -phi)
      arrow(ctx, px, py, vx, vy, c.sodium, 2.6, 10)
      label(ctx, 'V_R (in phase with I)', 14, h * 0.62, c.prussian, { size: 10 })
      label(ctx, 'V_L', 14, h * 0.62 + 14, c.ok, { size: 10 })
      label(ctx, 'V_C', 50, h * 0.62 + 14, c.bad, { size: 10 })
      label(ctx, 'V (supply)', 86, h * 0.62 + 14, c.sodium, { size: 10 })
      label(ctx, `φ = ${((-phi * 180) / Math.PI).toFixed(1)}°  ${Math.abs(phi) < 0.02 ? '(resonance)' : phi < 0 ? '(current lags)' : '(current leads)'}`, 14, 20, c.ink2, { size: 11 })

      // Meters
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.line
      roundRect(ctx, 14, h * 0.7, 170, 56, 8)
      ctx.fill()
      ctx.stroke()
      label(ctx, `${f.toFixed(0)} Hz · ${SOURCE_V} V rms`, 26, h * 0.7 + 22, c.ink, { size: 12, weight: 600 })
      label(ctx, `I = ${(I * 1000).toFixed(2)} mA`, 26, h * 0.7 + 42, c.sodium, { size: 14, weight: 700 })

      // ---- Resonance curve ----
      const gx = wide ? w * 0.44 : 20
      const gy = wide ? 20 : h * 0.02
      const gw = wide ? w - gx - 20 : w - 40
      const gh = wide ? h - 40 : h * 0.5
      if (!wide) return
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.line
      roundRect(ctx, gx, gy, gw, gh, 8)
      ctx.fill()
      ctx.stroke()
      const fMax = 3000
      const Imax = SOURCE_V / R
      const PX = (ff: number) => gx + 40 + (ff / fMax) * (gw - 56)
      const PY = (ii: number) => gy + gh - 30 - (ii / Imax) * (gh - 60)
      ctx.strokeStyle = c.gridMajor
      ctx.beginPath()
      ctx.moveTo(PX(0), PY(0))
      ctx.lineTo(PX(fMax), PY(0))
      ctx.moveTo(PX(0), PY(0))
      ctx.lineTo(PX(0), PY(Imax))
      ctx.stroke()
      ctx.strokeStyle = c.prussian
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 1; i <= 300; i++) {
        const ff = (fMax * i) / 300
        const y = PY(seriesCurrent(SOURCE_V, ff, R, L, C))
        if (i === 1) ctx.moveTo(PX(ff), y)
        else ctx.lineTo(PX(ff), y)
      }
      ctx.stroke()
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.strokeStyle = c.ink3
      ctx.beginPath()
      ctx.moveTo(PX(0), PY(Imax / Math.SQRT2))
      ctx.lineTo(PX(fMax), PY(Imax / Math.SQRT2))
      ctx.stroke()
      ctx.setLineDash([])
      label(ctx, 'I_max/√2', PX(fMax) - 4, PY(Imax / Math.SQRT2) - 4, c.ink3, { align: 'right', size: 10 })
      ctx.fillStyle = c.sodium
      ctx.beginPath()
      ctx.arc(PX(f), PY(I), 5, 0, Math.PI * 2)
      ctx.fill()
      label(ctx, `f₀ ≈ ${f0.toFixed(0)} Hz`, PX(f0), PY(Imax) - 6, c.ink2, { align: 'center', size: 10 })
      for (let ff = 0; ff <= fMax; ff += 500) label(ctx, `${ff}`, PX(ff), PY(0) + 14, c.ink3, { align: 'center', size: 9 })
      label(ctx, 'I (A)', gx + 8, gy + 14, c.ink3, { size: 10 })
      label(ctx, 'f (Hz)', gx + gw - 8, PY(0) + 26, c.ink3, { align: 'right', size: 10 })
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[360px] w-full sm:h-[380px]" role="img" aria-label={`Series LCR circuit driven at ${f} hertz`} />
}
