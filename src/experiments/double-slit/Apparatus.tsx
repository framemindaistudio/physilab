import { useEffect, useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { intensity, wavelengthToRGB } from '@/physics/optics/doubleSlit'
import { clear, label, rgba } from '@/components/simulation/draw'

const VIEW_HALF_MM = 15 // eyepiece field of view: ±15 mm on the screen
const CELL = 3 // wave-field resolution in CSS px

export default function DoubleSlitApparatus({ params, running, speed, resetKey }: ApparatusProps) {
  const lambdaNm = Number(params.wavelength)
  const dMm = Number(params.separation)
  const Dm = Number(params.distance)
  const aMm = Number(params.slitWidth)
  const lambda = lambdaNm * 1e-9
  const d = dMm * 1e-3
  const a = aMm * 1e-3
  const [r, g, b] = wavelengthToRGB(lambdaNm)
  const colors = useThemeColors()

  const phase = useRef(0)
  const off = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    phase.current = 0
  }, [resetKey])

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      phase.current += dt * 5
      const c = colors.current
      clear(ctx, w, h, c)

      const topH = Math.round(h * 0.56)
      const cy = topH / 2
      // The optics bench is drawn as a darkroom in both themes: interference is viewed in the dark.
      const room = '#0c141b'
      const roomInk = '#c9d6de'
      const roomDim = '#7f96a1'
      ctx.fillStyle = room
      ctx.fillRect(0, 0, w, topH)
      const laserX = 18
      const slitX = Math.round(w * 0.2)
      const screenX = Math.round(w * 0.8)

      // ---- Schematic top view: laser → double slit → wave field → screen ----
      // Visual wavelength and separation are exaggerated but follow the real trends
      // (longer λ → wider fringes, larger d → narrower fringes).
      const lamPx = 9 + ((lambdaNm - 380) / 370) * 9
      const dPx = 16 + ((dMm - 0.25) / 0.75) * 44
      const fieldW = screenX - slitX
      const cols = Math.max(1, Math.floor(fieldW / CELL))
      const rows = Math.max(1, Math.floor(topH / CELL))
      if (!off.current) off.current = document.createElement('canvas')
      const oc = off.current
      if (oc.width !== cols || oc.height !== rows) {
        oc.width = cols
        oc.height = rows
      }
      const octx = oc.getContext('2d')
      if (octx) {
        const img = octx.createImageData(cols, rows)
        const k = (2 * Math.PI) / lamPx
        const s1y = cy - dPx / 2
        const s2y = cy + dPx / 2
        const bg = [12, 20, 27]
        for (let j = 0; j < rows; j++) {
          const py = j * CELL + CELL / 2
          for (let i = 0; i < cols; i++) {
            const px = i * CELL + CELL / 2
            const r1 = Math.hypot(px, py - s1y) + 1
            const r2 = Math.hypot(px, py - s2y) + 1
            const amp = (Math.cos(k * r1 - phase.current) + Math.cos(k * r2 - phase.current)) / 2
            const fall = Math.min(1, 26 / Math.sqrt((r1 + r2) / 2))
            const v = Math.max(0, amp) * fall
            const o = (j * cols + i) * 4
            img.data[o] = bg[0] + (r - bg[0]) * v
            img.data[o + 1] = bg[1] + (g - bg[1]) * v
            img.data[o + 2] = bg[2] + (b - bg[2]) * v
            img.data[o + 3] = 255
          }
        }
        octx.putImageData(img, 0, 0)
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(oc, slitX, 0, cols * CELL, rows * CELL)
      }

      // Incident plane wave and laser
      ctx.fillStyle = '#2a3a45'
      ctx.fillRect(laserX, cy - 9, 40, 18)
      ctx.strokeStyle = roomDim
      ctx.strokeRect(laserX + 0.5, cy - 8.5, 39, 17)
      label(ctx, 'LASER', laserX + 20, cy + 4, roomInk, { align: 'center', size: 9, weight: 700 })
      for (let x = laserX + 48 + ((phase.current * lamPx) / (2 * Math.PI)) % lamPx; x < slitX; x += lamPx) {
        ctx.strokeStyle = `rgba(${r},${g},${b},0.8)`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, cy - dPx / 2 - 10)
        ctx.lineTo(x, cy + dPx / 2 + 10)
        ctx.stroke()
      }

      // Barrier with two slits
      ctx.fillStyle = '#56697a'
      const slitGap = 4
      ctx.fillRect(slitX - 3, 0, 6, cy - dPx / 2 - slitGap)
      ctx.fillRect(slitX - 3, cy - dPx / 2 + slitGap, 6, dPx - 2 * slitGap)
      ctx.fillRect(slitX - 3, cy + dPx / 2 + slitGap, 6, topH - (cy + dPx / 2 + slitGap))
      label(ctx, 'S₁', slitX - 8, cy - dPx / 2 + 4, roomDim, { align: 'right', size: 10 })
      label(ctx, 'S₂', slitX - 8, cy + dPx / 2 + 4, roomDim, { align: 'right', size: 10 })

      // Screen with the real intensity profile beside it (±VIEW_HALF_MM).
      ctx.fillStyle = '#9fb2bd'
      ctx.fillRect(screenX, 0, 4, topH)
      const profW = w - screenX - 14
      ctx.strokeStyle = `rgb(${r},${g},${b})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let j = 0; j <= topH; j++) {
        const yMm = ((j - cy) / (topH / 2)) * VIEW_HALF_MM
        const I = intensity(yMm * 1e-3, lambda, d, Dm, a)
        const x = screenX + 8 + I * profW
        if (j === 0) ctx.moveTo(x, j)
        else ctx.lineTo(x, j)
      }
      ctx.stroke()
      label(ctx, 'I(y)', w - 8, 14, roomDim, { align: 'right', size: 10 })
      label(ctx, `D = ${Dm.toFixed(2)} m`, (slitX + screenX) / 2, topH - 8, roomInk, { align: 'center', size: 11 })
      label(ctx, 'wave field: schematic, not to scale', slitX + 8, 14, roomDim, { size: 10 })

      // ---- Eyepiece view of the screen: fringes + travelling-microscope scale ----
      const stripY = topH + 34
      const stripH = h - stripY - 38
      const x0 = 14
      const sw = w - 28
      for (let i = 0; i < sw; i++) {
        let I = 0
        for (let s = 0; s < 3; s++) {
          const yMm = ((i + s / 3 - sw / 2) / (sw / 2)) * VIEW_HALF_MM
          I += intensity(yMm * 1e-3, lambda, d, Dm, a)
        }
        I /= 3
        ctx.fillStyle = `rgb(${Math.round(r * I)},${Math.round(g * I)},${Math.round(b * I)})`
        ctx.fillRect(x0 + i, stripY, 1, stripH)
      }
      ctx.strokeStyle = c.line
      ctx.strokeRect(x0 + 0.5, stripY + 0.5, sw - 1, stripH - 1)
      // Scale in mm
      for (let mm = -VIEW_HALF_MM; mm <= VIEW_HALF_MM; mm++) {
        const x = x0 + ((mm + VIEW_HALF_MM) / (2 * VIEW_HALF_MM)) * sw
        const major = mm % 5 === 0
        ctx.strokeStyle = c.ink2
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, stripY + stripH)
        ctx.lineTo(x, stripY + stripH + (major ? 9 : 5))
        ctx.stroke()
        if (major) label(ctx, `${mm}`, x, stripY + stripH + 21, c.ink3, { align: 'center', size: 10 })
      }
      // Crosshair at the centre
      ctx.strokeStyle = rgba(c.sodium, 0.9)
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(x0 + sw / 2, stripY - 6)
      ctx.lineTo(x0 + sw / 2, stripY + stripH + 4)
      ctx.stroke()
      ctx.setLineDash([])
      label(ctx, 'Screen through the eyepiece (scale in mm)', x0, stripY - 12, c.ink2, { size: 11, mono: false })
      const beta = (lambda * Dm) / d
      label(ctx, `β = λD/d = ${(beta * 1000).toFixed(3)} mm`, x0 + sw, stripY - 12, c.sodium, { align: 'right', size: 11, weight: 600 })
    },
    running,
    speed,
  )

  return (
    <canvas
      ref={canvasRef}
      className="block h-[440px] w-full sm:h-[500px]"
      role="img"
      aria-label={`Double-slit interference with wavelength ${lambdaNm} nanometres`}
    />
  )
}
