import { useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { diffractionAngle, MERCURY_LINES } from '@/physics/optics/grating'
import { wavelengthToRGB } from '@/physics/optics/doubleSlit'
import { label, rgba, roundRect } from '@/components/simulation/draw'

export default function GratingApparatus({ params, running, speed }: ApparatusProps) {
  const N = Number(params.grating)
  const lineKey = String(params.line)
  const order = Number(params.order)
  const colors = useThemeColors()
  const sweep = useRef({ a: 0 })

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      const c = colors.current
      // Spectrometer bench is drawn as a darkroom: spectra are viewed in the dark.
      ctx.fillStyle = '#0c141b'
      ctx.fillRect(0, 0, w, h)
      const ink = '#c9d6de'
      const dim = '#7f96a1'

      const topH = Math.round(h * 0.62)
      const cx = w / 2
      const cy = topH * 0.62
      const armLen = Math.min(w * 0.42, topH * 0.55)

      // Prism table / circular scale
      ctx.strokeStyle = rgba('#7f96a1', 0.5)
      ctx.beginPath()
      ctx.arc(cx, cy, armLen * 0.35, 0, Math.PI * 2)
      ctx.stroke()
      for (let deg = -90; deg <= 90; deg += 10) {
        const a = ((deg - 90) * Math.PI) / 180
        const r1 = armLen * 0.35
        const r2 = r1 + (deg % 30 === 0 ? 8 : 4)
        ctx.beginPath()
        ctx.moveTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a))
        ctx.lineTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a))
        ctx.stroke()
      }

      // Collimator (from below) and white light
      ctx.fillStyle = '#2a3a45'
      ctx.fillRect(cx - 9, cy + 18, 18, topH - cy - 22)
      label(ctx, 'collimator', cx + 14, topH - 10, dim, { size: 10 })
      label(ctx, 'Hg lamp', cx + 14, topH - 24, dim, { size: 10 })

      // Grating
      ctx.fillStyle = '#9fb2bd'
      ctx.fillRect(cx - 34, cy - 2, 68, 4)
      label(ctx, `${N} lines/mm`, cx + 40, cy + 4, dim, { size: 10 })

      // Diffracted rays for every mercury line, orders ±1..±3
      for (const [key, ln] of Object.entries(MERCURY_LINES)) {
        const [r, g, b] = wavelengthToRGB(ln.nm)
        for (let m = -3; m <= 3; m++) {
          if (m === 0) continue
          const th = diffractionAngle(m, ln.nm, N)
          if (!Number.isFinite(th)) continue
          const a = ((th - 90) * Math.PI) / 180
          const strong = key === lineKey && Math.abs(m) === order
          ctx.strokeStyle = `rgba(${r},${g},${b},${strong ? 0.95 : 0.28 / Math.abs(m)})`
          ctx.lineWidth = strong ? 2 : 1
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(cx + armLen * 1.05 * Math.cos(a), cy + armLen * 1.05 * Math.sin(a))
          ctx.stroke()
        }
      }
      // Central white image (n = 0)
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx, cy - armLen * 1.05)
      ctx.stroke()

      // Telescope swings between the left and right positions of the chosen line while running.
      const th = diffractionAngle(order, MERCURY_LINES[lineKey]?.nm ?? 546, N)
      if (running) sweep.current.a += dt * 0.8 * speed
      const side = running ? Math.sign(Math.sin(sweep.current.a)) || 1 : 1
      if (Number.isFinite(th)) {
        const a = ((side * th - 90) * Math.PI) / 180
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(a + Math.PI / 2)
        ctx.fillStyle = '#56697a'
        roundRect(ctx, -8, -armLen * 1.02, 16, armLen * 0.5, 4)
        ctx.fill()
        ctx.restore()
        label(ctx, `θ = ${th.toFixed(2)}°`, cx + side * (armLen * 0.55), cy - armLen * 0.72, '#ffd27a', { align: 'center', size: 12, weight: 600 })
      } else {
        label(ctx, `order ${order} does not exist for this line (sin θ > 1)`, cx, 20, '#f07a6f', { align: 'center', size: 12, weight: 600 })
      }
      label(ctx, 'telescope', 12, 18, dim, { size: 10 })
      label(ctx, 'n = 0', cx + 4, cy - armLen * 1.05 - 4, ink, { size: 10 })

      // ---- Spectrum as seen by sweeping the telescope: −90° … +90° ----
      const sy = topH + 26
      const sh = h - sy - 26
      const x0 = 16
      const sw = w - 32
      ctx.fillStyle = '#05090c'
      ctx.fillRect(x0, sy, sw, sh)
      const X = (deg: number) => x0 + ((deg + 90) / 180) * sw
      for (const [key, ln] of Object.entries(MERCURY_LINES)) {
        const [r, g, b] = wavelengthToRGB(ln.nm)
        for (let m = -3; m <= 3; m++) {
          if (m === 0) continue
          const t2 = diffractionAngle(m, ln.nm, N)
          if (!Number.isFinite(t2)) continue
          const alpha = 1 / Math.abs(m)
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
          ctx.fillRect(X(t2) - 1.5, sy + 4, 3, sh - 8)
          if (key === lineKey && Math.abs(m) === order) {
            ctx.strokeStyle = '#ffd27a'
            ctx.strokeRect(X(t2) - 5, sy + 1, 10, sh - 2)
          }
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillRect(X(0) - 1.5, sy + 4, 3, sh - 8)
      for (let deg = -90; deg <= 90; deg += 30) label(ctx, `${deg}°`, X(deg), sy + sh + 16, dim, { align: 'center', size: 10 })
      label(ctx, 'Spectrum across the scale (orders fade with n)', x0, sy - 8, ink, { size: 11, mono: false })
      void c
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[420px] w-full sm:h-[460px]" role="img" aria-label="Spectrometer with a diffraction grating and mercury lamp" />
}
