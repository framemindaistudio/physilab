import { useMemo, useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { findDarkRingRadius, ringIntensity } from '@/physics/optics/newtonsRings'
import { wavelengthToRGB } from '@/physics/optics/doubleSlit'
import { arrow, clear, graphPaper, label, rgba } from '@/components/simulation/draw'

const FOV_MM = 4 // microscope field of view radius on the lens
const RES = 260 // pixels across the rendered ring pattern

export default function NewtonsRingsApparatus({ params, running, speed }: ApparatusProps) {
  const lambdaNm = Number(params.wavelength)
  const R = Number(params.radius)
  const n = Number(params.ring)
  const colors = useThemeColors()
  const [r, g, b] = wavelengthToRGB(lambdaNm)

  // The ring pattern only changes with λ and R: render it once into an offscreen canvas.
  const pattern = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = RES
    c.height = RES
    const ctx = c.getContext('2d')
    if (!ctx) return c
    const img = ctx.createImageData(RES, RES)
    const lam = lambdaNm * 1e-9
    for (let j = 0; j < RES; j++) {
      for (let i = 0; i < RES; i++) {
        // 2×2 supersampling keeps the fine outer rings from aliasing.
        let I = 0
        for (const [dx, dy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
          const x = ((i + dx) / RES - 0.5) * 2 * FOV_MM
          const y = ((j + dy) / RES - 0.5) * 2 * FOV_MM
          I += ringIntensity(Math.hypot(x, y) * 1e-3, lam, R)
        }
        I /= 4
        const o = (j * RES + i) * 4
        const inside = Math.hypot(i - RES / 2, j - RES / 2) <= RES / 2
        img.data[o] = inside ? r * I : 12
        img.data[o + 1] = inside ? g * I : 20
        img.data[o + 2] = inside ? b * I : 27
        img.data[o + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
    return c
  }, [lambdaNm, R, r, g, b])

  const ringRadiusMm = useMemo(() => findDarkRingRadius(n, lambdaNm * 1e-9, R) * 1000, [n, lambdaNm, R])
  const cross = useRef({ x: 0 })

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      const c = colors.current
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)

      // ---- Left: side view of the set-up ----
      const wide = w > 560
      const sideW = wide ? w * 0.42 : w
      const sideH = wide ? h : h * 0.38
      const cx = sideW / 2
      const plateY = sideH * 0.78
      // Glass plate
      ctx.fillStyle = rgba(c.prussian, 0.18)
      ctx.fillRect(cx - sideW * 0.36, plateY, sideW * 0.72, 10)
      ctx.strokeStyle = c.prussian
      ctx.strokeRect(cx - sideW * 0.36, plateY, sideW * 0.72, 10)
      // Plano-convex lens (flat face up)
      const lensW = sideW * 0.5
      ctx.beginPath()
      ctx.moveTo(cx - lensW / 2, plateY - 22)
      ctx.lineTo(cx + lensW / 2, plateY - 22)
      ctx.quadraticCurveTo(cx, plateY + 22, cx - lensW / 2, plateY - 22)
      ctx.closePath()
      ctx.fillStyle = rgba(c.prussian, 0.22)
      ctx.fill()
      ctx.strokeStyle = c.prussian
      ctx.stroke()
      // 45° glass plate and incoming light
      const gy = plateY - sideH * 0.38
      ctx.strokeStyle = c.ink2
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx - 26, gy + 26)
      ctx.lineTo(cx + 26, gy - 26)
      ctx.stroke()
      ctx.lineWidth = 1
      arrow(ctx, 12, gy, cx - 4, gy, `rgb(${r},${g},${b})`, 2.5, 9)
      arrow(ctx, cx, gy + 6, cx, plateY - 26, `rgb(${r},${g},${b})`, 2.5, 9)
      label(ctx, `${lambdaNm} nm`, 14, gy - 10, c.ink2, { size: 11 })
      // Microscope
      ctx.fillStyle = c.ink
      ctx.fillRect(cx - 9, gy - sideH * 0.3, 18, sideH * 0.3 - 34)
      label(ctx, 'microscope', cx + 16, gy - sideH * 0.2, c.ink3, { size: 10 })
      label(ctx, `R = ${R.toFixed(2)} m`, cx + lensW / 2 + 6, plateY - 6, c.ink2, { size: 11 })
      label(ctx, 'air film t = r²/2R', cx - sideW * 0.36, plateY + 28, c.ink3, { size: 10 })

      // ---- Right: view through the microscope ----
      const size = wide ? Math.min(w - sideW - 30, h - 40) : Math.min(w - 30, h - sideH - 30)
      const ox = wide ? sideW + (w - sideW - size) / 2 : (w - size) / 2
      const oy = wide ? (h - size) / 2 : sideH + (h - sideH - size) / 2
      ctx.save()
      ctx.beginPath()
      ctx.arc(ox + size / 2, oy + size / 2, size / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(pattern, ox, oy, size, size)
      ctx.restore()
      ctx.strokeStyle = c.ink2
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(ox + size / 2, oy + size / 2, size / 2, 0, Math.PI * 2)
      ctx.stroke()

      // Crosshair glides between the two edges of the chosen ring while running.
      const pxPerMm = size / (2 * FOV_MM)
      const target = Number.isFinite(ringRadiusMm) ? ringRadiusMm : 0
      cross.current.x += dt * 1.2 * speed
      const phase = running ? Math.sin(cross.current.x) : 1
      const cxh = ox + size / 2 + phase * target * pxPerMm
      ctx.strokeStyle = rgba(c.sodium, 0.95)
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cxh, oy + 6)
      ctx.lineTo(cxh, oy + size - 6)
      ctx.moveTo(ox + 6, oy + size / 2)
      ctx.lineTo(ox + size - 6, oy + size / 2)
      ctx.stroke()
      label(ctx, `ring n = ${n}   D ≈ ${(2 * target).toFixed(2)} mm`, ox + size / 2, oy + size + 16, c.sodium, { align: 'center', size: 11, weight: 600 })
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[400px] w-full sm:h-[440px]" role="img" aria-label={`Newton's rings at ${lambdaNm} nanometres`} />
}
