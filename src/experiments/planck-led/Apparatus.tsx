import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { ledCurrent, LEDS, LED_SERIES_R, thresholdVoltage } from '@/physics/modern/led'
import { wavelengthToRGB } from '@/physics/optics/doubleSlit'
import { clear, graphPaper, label, roundRect } from '@/components/simulation/draw'

const V_MAX = 4

export default function PlanckLedApparatus({ params, running, speed }: ApparatusProps) {
  const led = LEDS[String(params.led)] ?? LEDS.red
  const V = Number(params.voltage)
  const colors = useThemeColors()
  void speed

  const canvasRef = useCanvasLoop(
    (ctx, w, h) => {
      const c = colors.current
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)
      const I = ledCurrent(V, led.nm)
      const [r, g, b] = led.nm > 780 ? [150, 40, 40] : wavelengthToRGB(led.nm)
      const glow = Math.min(1, (I * 1000) / 20)

      // ---- LED and meters ----
      const wide = w > 600
      const lw = wide ? w * 0.4 : w
      const lh = wide ? h : h * 0.45
      const cx = lw / 2
      const cy = lh * 0.42
      // Glow
      if (running && glow > 0.01 && led.nm <= 780) {
        const grad = ctx.createRadialGradient(cx, cy - 14, 4, cx, cy - 14, 110)
        grad.addColorStop(0, `rgba(${r},${g},${b},${0.75 * glow})`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = grad
        ctx.fillRect(cx - 120, cy - 130, 240, 240)
      }
      // LED body (dome + rim + legs)
      ctx.fillStyle = `rgba(${r},${g},${b},${0.35 + (running ? 0.6 * glow : 0)})`
      ctx.strokeStyle = c.ink2
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx - 18, cy + 10)
      ctx.lineTo(cx - 18, cy - 16)
      ctx.arc(cx, cy - 16, 18, Math.PI, 0)
      ctx.lineTo(cx + 18, cy + 10)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = c.ink2
      ctx.fillRect(cx - 22, cy + 10, 44, 5)
      ctx.fillRect(cx - 10, cy + 15, 3, 40)
      ctx.fillRect(cx + 7, cy + 15, 3, 34)
      label(ctx, `${led.label} LED · ${led.nm} nm`, cx, cy + 76, c.ink, { align: 'center', size: 12, weight: 600 })
      if (led.nm > 780) label(ctx, '(infrared: invisible to the eye)', cx, cy + 92, c.ink3, { align: 'center', size: 10 })
      // Meter readouts
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.line
      roundRect(ctx, cx - 110, lh - 64, 220, 48, 8)
      ctx.fill()
      ctx.stroke()
      label(ctx, `${V.toFixed(2)} V`, cx - 55, lh - 34, c.ink, { align: 'center', size: 15, weight: 700 })
      label(ctx, `${(I * 1000).toFixed(2)} mA`, cx + 55, lh - 34, c.sodium, { align: 'center', size: 15, weight: 700 })
      label(ctx, 'voltmeter', cx - 55, lh - 20, c.ink3, { align: 'center', size: 9 })
      label(ctx, 'milliammeter', cx + 55, lh - 20, c.ink3, { align: 'center', size: 9 })

      // ---- I–V characteristic with the extrapolated threshold ----
      const gx = wide ? lw + 10 : 20
      const gy = wide ? 20 : lh + 8
      const gw = wide ? w - lw - 30 : w - 40
      const gh = wide ? h - 40 : h - lh - 20
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.line
      roundRect(ctx, gx, gy, gw, gh, 8)
      ctx.fill()
      ctx.stroke()
      const Imax = 0.03
      const PX = (v: number) => gx + 36 + (v / V_MAX) * (gw - 48)
      const PY = (i: number) => gy + gh - 26 - (Math.min(i, Imax) / Imax) * (gh - 46)
      ctx.strokeStyle = c.gridMajor
      ctx.beginPath()
      ctx.moveTo(PX(0), PY(0))
      ctx.lineTo(PX(V_MAX), PY(0))
      ctx.moveTo(PX(0), PY(0))
      ctx.lineTo(PX(0), PY(Imax))
      ctx.stroke()
      for (let v = 0; v <= V_MAX; v++) label(ctx, `${v}`, PX(v), PY(0) + 14, c.ink3, { align: 'center', size: 9 })
      // Every LED faintly, the selected one strongly
      for (const L of Object.values(LEDS)) {
        const [rr, gg, bb] = L.nm > 780 ? [150, 40, 40] : wavelengthToRGB(L.nm)
        const sel = L.nm === led.nm
        ctx.strokeStyle = `rgba(${rr},${gg},${bb},${sel ? 1 : 0.3})`
        ctx.lineWidth = sel ? 2.2 : 1
        ctx.beginPath()
        let started = false
        for (let i = 0; i <= 200; i++) {
          const v = (V_MAX * i) / 200
          const cur = ledCurrent(v, L.nm)
          if (cur > Imax) break
          if (!started) {
            ctx.moveTo(PX(v), PY(cur))
            started = true
          } else ctx.lineTo(PX(v), PY(cur))
        }
        ctx.stroke()
      }
      ctx.lineWidth = 1
      // Extrapolation of the straight part to I = 0
      const Vth = thresholdVoltage(led.nm)
      ctx.setLineDash([4, 3])
      ctx.strokeStyle = c.ink2
      ctx.beginPath()
      ctx.moveTo(PX(Vth), PY(0))
      ctx.lineTo(PX(Vth + Imax * LED_SERIES_R * 0.9), PY(Imax * 0.9))
      ctx.stroke()
      ctx.setLineDash([])
      label(ctx, `V_th ≈ ${Vth.toFixed(2)} V`, PX(Vth) + 6, PY(0) - 6, c.ink, { size: 11, weight: 600 })
      // Operating point
      ctx.fillStyle = c.sodium
      ctx.beginPath()
      ctx.arc(PX(V), PY(I), 5, 0, Math.PI * 2)
      ctx.fill()
      label(ctx, 'I (mA)', gx + 8, gy + 14, c.ink3, { size: 10 })
      label(ctx, 'V (V)', gx + gw - 8, PY(0) + 14, c.ink3, { align: 'right', size: 10 })
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[380px] w-full sm:h-[400px]" role="img" aria-label={`${led.label} LED at ${V} volts`} />
}
