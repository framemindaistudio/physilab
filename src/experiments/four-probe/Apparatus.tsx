import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { CRYSTALS, probeVoltage, resistivity } from '@/physics/semiconductor/fourProbe'
import { arrow, clear, graphPaper, label, rgba, roundRect } from '@/components/simulation/draw'

export default function FourProbeApparatus({ params, running, speed }: ApparatusProps) {
  const cr = CRYSTALS[String(params.crystal)] ?? CRYSTALS.germanium
  const ImA = Number(params.current)
  const Tc = Number(params.temperature)
  const colors = useThemeColors()
  void speed

  const canvasRef = useCanvasLoop(
    (ctx, w, h) => {
      const c = colors.current
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)
      const T = Tc + 273.15
      const V = probeVoltage(ImA * 1e-3, T, cr) * 1000
      const wide = w > 600
      const half = wide ? w * 0.55 : w
      const heat = (Tc - 30) / 130

      // Oven
      const ox = 24
      const oy = 30
      const ow = half - 48
      const oh = (wide ? h : h * 0.58) - 70
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.ink2
      ctx.lineWidth = 2
      roundRect(ctx, ox, oy, ow, oh, 10)
      ctx.fill()
      ctx.stroke()
      ctx.lineWidth = 1
      ctx.fillStyle = `rgba(230, ${120 - 60 * heat}, 40, ${running ? 0.12 + 0.35 * heat : 0.06})`
      roundRect(ctx, ox + 8, oy + 8, ow - 16, oh - 16, 8)
      ctx.fill()
      label(ctx, `oven ${Tc.toFixed(0)} °C`, ox + 14, oy + 24, c.ink, { size: 12, weight: 700 })

      // Sample slab and four probes
      const sy = oy + oh * 0.66
      const sx = ox + ow * 0.15
      const sw = ow * 0.7
      ctx.fillStyle = rgba(c.ink3, 0.55)
      ctx.fillRect(sx, sy, sw, 14)
      label(ctx, cr.label, sx + sw / 2, sy + 30, c.ink2, { align: 'center', size: 11 })
      const probes = [0.2, 0.4, 0.6, 0.8].map((f) => sx + f * sw)
      probes.forEach((x, i) => {
        ctx.strokeStyle = i === 0 || i === 3 ? c.bad : c.prussian
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(x, sy)
        ctx.lineTo(x, oy + 44)
        ctx.stroke()
        ctx.lineWidth = 1
      })
      label(ctx, 's = 2 mm', (probes[1] + probes[2]) / 2, sy - 8, c.ink3, { align: 'center', size: 10 })
      if (running) {
        arrow(ctx, probes[0] + 6, sy + 7, probes[3] - 6, sy + 7, rgba(c.sodium, 0.9), 2, 8)
      }
      // Meters
      const my = oy + 58
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.line
      roundRect(ctx, probes[0] - 40, my, 80, 34, 6)
      ctx.fill()
      ctx.stroke()
      label(ctx, `${ImA.toFixed(1)} mA`, probes[0], my + 22, c.bad, { align: 'center', size: 13, weight: 700 })
      roundRect(ctx, probes[2] - 20, my, 110, 34, 6)
      ctx.fill()
      ctx.stroke()
      label(ctx, running ? `${V.toFixed(3)} mV` : '— mV', probes[2] + 35, my + 22, c.sodium, { align: 'center', size: 13, weight: 700 })
      label(ctx, 'current (outer)', probes[0], my - 6, c.ink3, { align: 'center', size: 9 })
      label(ctx, 'voltage (inner)', probes[2] + 35, my - 6, c.ink3, { align: 'center', size: 9 })

      // ln ρ against 1000/T (theory curve) with the current point
      const gx = wide ? half + 8 : 24
      const gy = wide ? 30 : h * 0.62
      const gw = wide ? w - half - 32 : w - 48
      const gh = wide ? h - 60 : h * 0.34
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.line
      roundRect(ctx, gx, gy, gw, gh, 8)
      ctx.fill()
      ctx.stroke()
      const xMin = 1000 / (160 + 273.15)
      const xMax = 1000 / (30 + 273.15)
      const yA = Math.log(resistivity(160 + 273.15, cr))
      const yB = Math.log(resistivity(30 + 273.15, cr))
      const PX = (x: number) => gx + 34 + ((x - xMin) / (xMax - xMin)) * (gw - 50)
      const PY = (y: number) => gy + gh - 26 - ((y - yA) / (yB - yA)) * (gh - 50)
      ctx.strokeStyle = c.prussian
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(PX(xMin), PY(yA))
      ctx.lineTo(PX(xMax), PY(yB))
      ctx.stroke()
      ctx.lineWidth = 1
      const x = 1000 / T
      ctx.fillStyle = c.sodium
      ctx.beginPath()
      ctx.arc(PX(x), PY(Math.log(resistivity(T, cr))), 5, 0, Math.PI * 2)
      ctx.fill()
      label(ctx, 'ln ρ', gx + 8, gy + 16, c.ink3, { size: 10 })
      label(ctx, '1000/T (K⁻¹)', gx + gw - 8, gy + gh - 8, c.ink3, { align: 'right', size: 10 })
      label(ctx, `slope = E_g / 2k`, gx + gw / 2, gy + 16, c.prussian, { align: 'center', size: 11, weight: 600 })
      label(ctx, `ρ = ${resistivity(T, cr).toPrecision(3)} Ω m`, gx + gw - 8, gy + 34, c.ink2, { align: 'right', size: 11 })
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[380px] w-full sm:h-[400px]" role="img" aria-label={`Four-probe measurement on ${cr.label} at ${Tc} degrees Celsius`} />
}
