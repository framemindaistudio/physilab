import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { fermiDirac, METALS, resistivity } from '@/physics/modern/fermi'
import { K_EV } from '@/physics/semiconductor/bandGap'
import { clear, graphPaper, label, rgba, roundRect } from '@/components/simulation/draw'
import { WIRE_AREA, WIRE_LENGTH } from './model'

export default function FermiApparatus({ params, running, speed }: ApparatusProps) {
  const m = METALS[String(params.metal)] ?? METALS.copper
  const Tc = Number(params.temperature)
  const colors = useThemeColors()
  void speed

  const canvasRef = useCanvasLoop(
    (ctx, w, h) => {
      const c = colors.current
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)
      const T = Tc + 273.15
      const R = (resistivity(T, m) * WIRE_LENGTH) / WIRE_AREA
      const wide = w > 600
      const half = wide ? w * 0.42 : w

      // ---- Heated coil ----
      const bx = 30
      const by = 36
      const bw = Math.min(half - 70, 230)
      const bh = (wide ? h : h * 0.48) - 100
      const heat = (Tc - 30) / 60
      ctx.fillStyle = `rgba(${120 + 100 * heat}, ${170 - 60 * heat}, 220, 0.25)`
      ctx.fillRect(bx, by + 24, bw, bh - 24)
      ctx.strokeStyle = c.ink2
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(bx, by)
      ctx.lineTo(bx, by + bh)
      ctx.lineTo(bx + bw, by + bh)
      ctx.lineTo(bx + bw, by)
      ctx.stroke()
      ctx.lineWidth = 1
      // Coil of copper-coloured wire
      ctx.strokeStyle = m.label.startsWith('Copper') ? '#b8732e' : m.label.startsWith('Silver') ? '#9aa4ad' : '#aab4bd'
      ctx.lineWidth = 2
      for (let i = 0; i < 9; i++) {
        ctx.beginPath()
        ctx.ellipse(bx + bw * 0.55, by + 60 + i * ((bh - 90) / 9), bw * 0.28, 7, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.lineWidth = 1
      ctx.strokeStyle = c.ink2
      ctx.beginPath()
      ctx.moveTo(bx + bw * 0.3, by + 60)
      ctx.lineTo(bx + bw * 0.3, by - 14)
      ctx.moveTo(bx + bw * 0.8, by + 60)
      ctx.lineTo(bx + bw * 0.8, by - 14)
      ctx.stroke()
      // Thermometer
      const tx = bx + 16
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.ink2
      roundRect(ctx, tx - 5, by - 10, 10, bh - 10, 5)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = c.bad
      const colH = (bh - 30) * (0.2 + 0.75 * heat)
      ctx.fillRect(tx - 2.5, by - 10 + (bh - 10) - colH - 6, 5, colH)
      label(ctx, `${Tc.toFixed(0)} °C`, tx + 12, by + 6, c.ink, { size: 13, weight: 700 })
      label(ctx, `R = ${R.toFixed(3)} Ω`, bx, by + bh + 26, c.sodium, { size: 15, weight: 700 })
      label(ctx, `${m.label} wire · 10 m · Ø 0.20 mm`, bx, by + bh + 44, c.ink2, { size: 11 })

      // ---- Fermi–Dirac occupation near E_F ----
      const gx = wide ? half + 10 : 20
      const gy = wide ? 24 : h * 0.52
      const gw = wide ? w - half - 30 : w - 40
      const gh = wide ? h - 48 : h * 0.44
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.line
      roundRect(ctx, gx, gy, gw, gh, 8)
      ctx.fill()
      ctx.stroke()
      const span = 0.6 // eV either side of E_F
      const PX = (e: number) => gx + 40 + ((e - (m.ef - span)) / (2 * span)) * (gw - 60)
      const PY = (f: number) => gy + gh - 34 - f * (gh - 70)
      ctx.strokeStyle = c.gridMajor
      ctx.beginPath()
      ctx.moveTo(PX(m.ef - span), PY(0))
      ctx.lineTo(PX(m.ef + span), PY(0))
      ctx.moveTo(PX(m.ef - span), PY(0))
      ctx.lineTo(PX(m.ef - span), PY(1))
      ctx.stroke()
      // Filled states
      ctx.fillStyle = rgba(c.prussian, 0.18)
      ctx.beginPath()
      ctx.moveTo(PX(m.ef - span), PY(0))
      for (let i = 0; i <= 200; i++) {
        const e = m.ef - span + (2 * span * i) / 200
        ctx.lineTo(PX(e), PY(fermiDirac(e, m.ef, running ? T : T)))
      }
      ctx.lineTo(PX(m.ef + span), PY(0))
      ctx.closePath()
      ctx.fill()
      // T = 0 step (dashed) and f(E) at T
      ctx.setLineDash([4, 3])
      ctx.strokeStyle = c.ink3
      ctx.beginPath()
      ctx.moveTo(PX(m.ef - span), PY(1))
      ctx.lineTo(PX(m.ef), PY(1))
      ctx.lineTo(PX(m.ef), PY(0))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = c.prussian
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 200; i++) {
        const e = m.ef - span + (2 * span * i) / 200
        const y = PY(fermiDirac(e, m.ef, T))
        if (i === 0) ctx.moveTo(PX(e), y)
        else ctx.lineTo(PX(e), y)
      }
      ctx.stroke()
      ctx.lineWidth = 1
      label(ctx, `E_F = ${m.ef} eV`, PX(m.ef), PY(1) - 8, c.sodium, { align: 'center', size: 12, weight: 700 })
      label(ctx, `kT = ${(K_EV * T * 1000).toFixed(1)} meV`, gx + gw - 12, gy + 18, c.ink2, { align: 'right', size: 11 })
      label(ctx, 'f(E)', gx + 10, gy + 18, c.ink3, { size: 10 })
      label(ctx, 'E (eV)', gx + gw - 12, PY(0) + 18, c.ink3, { align: 'right', size: 10 })
      label(ctx, `${(m.ef - span).toFixed(1)}`, PX(m.ef - span), PY(0) + 14, c.ink3, { align: 'center', size: 9 })
      label(ctx, `${(m.ef + span).toFixed(1)}`, PX(m.ef + span), PY(0) + 14, c.ink3, { align: 'center', size: 9 })
      label(ctx, 'Only electrons within ~kT of E_F can scatter and carry current', gx + 12, gy + gh - 10, c.ink3, { size: 10 })
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[380px] w-full sm:h-[400px]" role="img" aria-label={`${m.label} wire at ${Tc} degrees Celsius`} />
}
