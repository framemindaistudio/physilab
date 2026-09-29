import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { photodiodeCurrent, SOURCES } from '@/physics/semiconductor/photodiode'
import { wavelengthToRGB } from '@/physics/optics/doubleSlit'
import { clear, graphPaper, label, roundRect } from '@/components/simulation/draw'

const V_MIN = -10
const V_MAX = 0.6
const P_MAX = 500e-6

export default function PhotodiodeApparatus({ params, running, speed }: ApparatusProps) {
  const s = SOURCES[String(params.source)] ?? SOURCES.nir
  const P = Number(params.power) * 1e-6
  const V = Number(params.bias)
  const colors = useThemeColors()
  void speed

  const canvasRef = useCanvasLoop(
    (ctx, w, h) => {
      const c = colors.current
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)
      const I = photodiodeCurrent(V, running ? P : 0, s)
      const [r, g, b] = s.nm > 780 ? [180, 40, 60] : wavelengthToRGB(s.nm)
      const wide = w > 600
      const lw = wide ? w * 0.36 : w
      const lh = wide ? h : h * 0.42

      // Light source → photodiode
      const cy = lh * 0.4
      ctx.fillStyle = c.ink
      roundRect(ctx, 20, cy - 16, 44, 32, 6)
      ctx.fill()
      label(ctx, `${s.nm} nm`, 42, cy + 32, c.ink2, { align: 'center', size: 10 })
      if (running && P > 0) {
        ctx.fillStyle = `rgba(${r},${g},${b},${0.15 + 0.6 * (P / P_MAX)})`
        ctx.beginPath()
        ctx.moveTo(64, cy - 8)
        ctx.lineTo(lw - 80, cy - 22)
        ctx.lineTo(lw - 80, cy + 22)
        ctx.lineTo(64, cy + 8)
        ctx.closePath()
        ctx.fill()
      }
      // Photodiode package
      const dx = lw - 60
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.ink
      ctx.lineWidth = 2
      roundRect(ctx, dx - 22, cy - 26, 44, 52, 8)
      ctx.fill()
      ctx.stroke()
      ctx.lineWidth = 1
      ctx.fillStyle = '#2a3a45'
      ctx.fillRect(dx - 14, cy - 12, 28, 24)
      label(ctx, 'photodiode', dx, cy + 44, c.ink3, { align: 'center', size: 10 })
      // Meter
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.line
      roundRect(ctx, 20, lh - 74, lw - 40, 56, 8)
      ctx.fill()
      ctx.stroke()
      label(ctx, `bias ${V >= 0 ? '+' : ''}${V.toFixed(2)} V · P = ${(P * 1e6).toFixed(0)} µW`, 32, lh - 50, c.ink, { size: 12, weight: 600 })
      label(ctx, `I = ${(I * 1e6).toFixed(3)} µA`, 32, lh - 28, c.sodium, { size: 15, weight: 700 })

      // I–V family for several powers
      const gx = wide ? lw + 10 : 20
      const gy = wide ? 20 : lh + 10
      const gw = wide ? w - lw - 30 : w - 40
      const gh = wide ? h - 40 : h - lh - 30
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.line
      roundRect(ctx, gx, gy, gw, gh, 8)
      ctx.fill()
      ctx.stroke()
      const Imin = -(s.eta * s.nm) / 1239.84 * P_MAX * 1.1
      const Imax = -Imin * 0.35
      const PX = (v: number) => gx + 40 + ((v - V_MIN) / (V_MAX - V_MIN)) * (gw - 56)
      const PY = (i: number) => gy + 18 + ((Imax - Math.max(Imin, Math.min(Imax, i))) / (Imax - Imin)) * (gh - 44)
      ctx.strokeStyle = c.gridMajor
      ctx.beginPath()
      ctx.moveTo(PX(V_MIN), PY(0))
      ctx.lineTo(PX(V_MAX), PY(0))
      ctx.moveTo(PX(0), gy + 12)
      ctx.lineTo(PX(0), gy + gh - 22)
      ctx.stroke()
      for (const pw of [0, 100e-6, 200e-6, 300e-6, 400e-6, 500e-6]) {
        const sel = Math.abs(pw - P) < 5e-6
        ctx.strokeStyle = sel ? c.sodium : c.prussian
        ctx.globalAlpha = sel ? 1 : 0.55
        ctx.lineWidth = sel ? 2.2 : 1.2
        ctx.beginPath()
        for (let i = 0; i <= 200; i++) {
          const v = V_MIN + ((V_MAX - V_MIN) * i) / 200
          const y = PY(photodiodeCurrent(v, pw, s))
          if (i === 0) ctx.moveTo(PX(v), y)
          else ctx.lineTo(PX(v), y)
        }
        ctx.stroke()
        label(ctx, `${(pw * 1e6).toFixed(0)} µW`, PX(V_MIN) + 4, PY(photodiodeCurrent(V_MIN, pw, s)) - 4, c.ink3, { size: 9 })
      }
      ctx.globalAlpha = 1
      ctx.lineWidth = 1
      ctx.fillStyle = c.sodium
      ctx.beginPath()
      ctx.arc(PX(V), PY(I), 5, 0, Math.PI * 2)
      ctx.fill()
      label(ctx, 'I', gx + 10, gy + 14, c.ink3, { size: 10 })
      label(ctx, 'V (V)', gx + gw - 8, PY(0) - 6, c.ink3, { align: 'right', size: 10 })
      label(ctx, 'reverse bias: current ∝ light power', gx + 40, gy + gh - 8, c.ink3, { size: 10 })
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[380px] w-full sm:h-[400px]" role="img" aria-label={`Photodiode illuminated at ${s.nm} nanometres`} />
}
