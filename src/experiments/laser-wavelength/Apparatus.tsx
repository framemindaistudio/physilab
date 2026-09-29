import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { wavelengthToRGB } from '@/physics/optics/doubleSlit'
import { label } from '@/components/simulation/draw'
import { LASERS, SCREEN_HALF, spotPosition } from './model'

export default function LaserApparatus({ params, running, speed }: ApparatusProps) {
  const laser = LASERS[String(params.laser)] ?? LASERS.hene
  const N = Number(params.grating)
  const D = Number(params.distance)
  const order = Number(params.order)
  const colors = useThemeColors()
  void speed

  const canvasRef = useCanvasLoop(
    (ctx, w, h) => {
      const c = colors.current
      ctx.fillStyle = '#0c141b'
      ctx.fillRect(0, 0, w, h)
      const ink = '#c9d6de'
      const dim = '#7f96a1'
      const [r, g, b] = wavelengthToRGB(laser.nm)
      const topH = h * 0.58
      const cy = topH / 2
      const gx = w * 0.2
      const pxPerM = (w * 0.72) / 1.6
      const sx = gx + D * pxPerM
      const vScale = (topH / 2 - 14) / SCREEN_HALF

      // Laser and grating
      ctx.fillStyle = '#2a3a45'
      ctx.fillRect(16, cy - 10, gx - 40, 20)
      label(ctx, 'LASER', (gx - 24) / 2 + 8, cy + 4, ink, { align: 'center', size: 10, weight: 700 })
      ctx.fillStyle = '#9fb2bd'
      ctx.fillRect(gx - 3, cy - 40, 6, 80)
      label(ctx, `${N} lines/mm`, gx, cy + 56, dim, { align: 'center', size: 10 })
      if (running) {
        ctx.strokeStyle = `rgba(${r},${g},${b},0.9)`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(16 + gx - 40, cy)
        ctx.lineTo(gx, cy)
        ctx.stroke()
      }
      // Screen
      ctx.fillStyle = '#9fb2bd'
      ctx.fillRect(sx, 8, 4, topH - 16)
      label(ctx, `D = ${D.toFixed(2)} m`, (gx + sx) / 2, topH - 6, ink, { align: 'center', size: 11 })
      // Diffracted beams
      for (let n = -5; n <= 5; n++) {
        const x = n === 0 ? 0 : Math.sign(n) * spotPosition(Math.abs(n), laser.nm, N, D)
        if (!Number.isFinite(x) || Math.abs(x) > SCREEN_HALF) continue
        const y = cy - x * vScale
        if (running) {
          ctx.strokeStyle = `rgba(${r},${g},${b},${Math.abs(n) === order ? 0.85 : 0.3})`
          ctx.lineWidth = Math.abs(n) === order ? 1.6 : 1
          ctx.beginPath()
          ctx.moveTo(gx, cy)
          ctx.lineTo(sx, y)
          ctx.stroke()
          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.beginPath()
          ctx.arc(sx, y, n === 0 ? 5 : 4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      label(ctx, 'top view (schematic)', 16, 18, dim, { size: 10 })

      // Screen view with a metre scale
      const sy = topH + 30
      const sh = h - sy - 34
      const x0 = 20
      const sw = w - 40
      ctx.fillStyle = '#f2f2ee'
      ctx.fillRect(x0, sy, sw, sh)
      const X = (m: number) => x0 + sw / 2 + (m / SCREEN_HALF) * (sw / 2)
      for (let cm = -60; cm <= 60; cm += 2) {
        ctx.strokeStyle = '#5b6770'
        ctx.beginPath()
        ctx.moveTo(X(cm / 100), sy + sh)
        ctx.lineTo(X(cm / 100), sy + sh - (cm % 10 === 0 ? 10 : 5))
        ctx.stroke()
        if (cm % 20 === 0) label(ctx, `${cm}`, X(cm / 100), sy + sh + 14, ink, { align: 'center', size: 10 })
      }
      label(ctx, 'cm', x0 + sw, sy + sh + 14, dim, { align: 'right', size: 10 })
      if (running) {
        for (let n = -5; n <= 5; n++) {
          const x = n === 0 ? 0 : Math.sign(n) * spotPosition(Math.abs(n), laser.nm, N, D)
          if (!Number.isFinite(x) || Math.abs(x) > SCREEN_HALF) continue
          const grad = ctx.createRadialGradient(X(x), sy + sh / 2, 1, X(x), sy + sh / 2, 14)
          grad.addColorStop(0, `rgba(${r},${g},${b},1)`)
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
          ctx.fillStyle = grad
          ctx.fillRect(X(x) - 14, sy + sh / 2 - 14, 28, 28)
          label(ctx, `${n}`, X(x), sy + 12, '#16202b', { align: 'center', size: 10, weight: 600 })
        }
        const xs = spotPosition(order, laser.nm, N, D)
        if (Number.isFinite(xs) && xs <= SCREEN_HALF) {
          ctx.strokeStyle = c.sodium
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(X(-xs), sy + sh / 2 + 18)
          ctx.lineTo(X(xs), sy + sh / 2 + 18)
          ctx.stroke()
          label(ctx, `2x = ${(2 * xs * 100).toFixed(1)} cm`, X(0), sy + sh / 2 + 32, c.sodium, { align: 'center', size: 11, weight: 700 })
        } else {
          label(ctx, `order ${order} is off the screen — reduce D or n`, X(0), sy + sh / 2 + 30, '#b3342b', { align: 'center', size: 11, weight: 700 })
        }
      } else {
        label(ctx, 'Press Start to switch on the laser', X(0), sy + sh / 2, '#5b6770', { align: 'center', size: 12 })
      }
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[380px] w-full sm:h-[420px]" role="img" aria-label={`${laser.label} diffracted by a ${N} lines per millimetre grating`} />
}
