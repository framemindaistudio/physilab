import { useEffect, useMemo, useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { emf, flux, maxFlux, maxFluxGradient, PASS_HALF_LENGTH, simulatePass } from '@/physics/electromagnetism/faraday'
import { arrow, clear, graphPaper, label, rgba, roundRect, tracePanel } from '@/components/simulation/draw'

const MAGNET_LEN = 0.07 // m (drawing only; the physics treats the magnet as a point dipole)
const PAUSE = 0.6 // s between passes

export default function FaradayApparatus({ params, running, speed, resetKey }: ApparatusProps) {
  const m = Number(params.moment)
  const N = Number(params.turns)
  const a = Number(params.radius) / 100
  const v = Number(params.velocity)
  const pol = params.pole === 'south' ? -1 : 1
  const colors = useThemeColors()

  const pass = useMemo(() => simulatePass(v, N, m, a, pol, 500), [v, N, m, a, pol])
  const peak = N * v * maxFluxGradient(m, a)
  const duration = (2 * PASS_HALF_LENGTH) / v

  const t = useRef(0)
  useEffect(() => {
    t.current = 0
  }, [pass, resetKey])

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      t.current += dt
      if (t.current > duration + PAUSE) t.current = 0
      const tc = Math.min(t.current, duration)
      const z = -PASS_HALF_LENGTH + v * tc
      const e = emf(z, v, N, m, a, pol)
      const phi = flux(z, m, a, pol)

      const c = colors.current
      clear(ctx, w, h, c)
      const sceneH = Math.round(h * 0.6)
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 0, w, sceneH)
      ctx.clip()
      graphPaper(ctx, w, sceneH, c)

      const cx = w / 2
      const cy = sceneH * 0.44
      const scale = (w - 60) / (2 * PASS_HALF_LENGTH + MAGNET_LEN)
      const Zx = (zz: number) => cx + zz * scale
      const mx = Zx(z)

      // Dipole field lines r = C sin²θ around the magnet centre (axis horizontal).
      ctx.lineWidth = 1.2
      for (const C of [26, 44, 70, 110, 170]) {
        for (const side of [1, -1]) {
          ctx.strokeStyle = rgba(c.prussian, 0.35)
          ctx.beginPath()
          for (let i = 0; i <= 80; i++) {
            const th = 0.12 + ((Math.PI - 0.24) * i) / 80
            const r = C * Math.sin(th) ** 2
            const px = mx + r * Math.cos(th) * pol
            const py = cy - side * r * Math.sin(th)
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.stroke()
          // Arrowhead at the top of each loop: field runs from N round to S.
          const apx = mx
          const apy = cy - side * C
          arrow(ctx, apx + 4 * pol, apy, apx - 4 * pol, apy, rgba(c.prussian, 0.6), 1.2, 6)
        }
      }

      // Coil: back half, magnet, front half (so the magnet passes "through").
      const rPx = Math.max(10, a * scale)
      const turnsDrawn = Math.min(9, Math.max(3, Math.round(N / 100)))
      const coilW = 6 * turnsDrawn
      const coilX0 = cx - coilW / 2
      const drawCoil = (front: boolean) => {
        for (let i = 0; i < turnsDrawn; i++) {
          const x = coilX0 + 6 * i + 3
          ctx.strokeStyle = front ? '#b8732e' : rgba('#b8732e', 0.45)
          ctx.lineWidth = 2.4
          ctx.beginPath()
          ctx.ellipse(x, cy, 7, rPx, 0, front ? -Math.PI / 2 : Math.PI / 2, front ? Math.PI / 2 : (3 * Math.PI) / 2)
          ctx.stroke()
        }
      }
      drawCoil(false)

      // Bar magnet (red N / blue S, N leading when pol = +1)
      const halfL = (MAGNET_LEN * scale) / 2
      const mh = 16
      const leadColor = '#c0392b'
      const trailColor = '#2e6db4'
      ctx.fillStyle = pol === 1 ? trailColor : leadColor
      ctx.fillRect(mx - halfL, cy - mh / 2, halfL, mh)
      ctx.fillStyle = pol === 1 ? leadColor : trailColor
      ctx.fillRect(mx, cy - mh / 2, halfL, mh)
      label(ctx, pol === 1 ? 'S' : 'N', mx - halfL / 2, cy + 4, '#fff', { align: 'center', size: 11, weight: 700 })
      label(ctx, pol === 1 ? 'N' : 'S', mx + halfL / 2, cy + 4, '#fff', { align: 'center', size: 11, weight: 700 })
      arrow(ctx, mx - 18, cy - mh / 2 - 12, mx + 18, cy - mh / 2 - 12, c.ink2, 1.5, 7)
      label(ctx, `v = ${v.toFixed(1)} m/s`, mx, cy - mh / 2 - 20, c.ink2, { align: 'center', size: 10 })

      drawCoil(true)

      // Induced current direction on the front of the coil (Lenz's law).
      const strength = Math.min(1, Math.abs(e) / (peak || 1))
      if (strength > 0.04) {
        const down = e < 0
        const ax = coilX0 + coilW + 16
        arrow(ctx, ax, down ? cy - rPx * 0.6 : cy + rPx * 0.6, ax, down ? cy + rPx * 0.6 : cy - rPx * 0.6, rgba(c.sodium, 0.35 + 0.65 * strength), 2.4, 9)
        label(ctx, 'I', ax + 8, cy + 4, c.sodium, { size: 12, weight: 700 })
        // Face of the coil that behaves as a north pole (field of the induced current exits here).
        const nx = e < 0 ? coilX0 - 14 : coilX0 + coilW + 34
        label(ctx, 'N', nx, cy - rPx - 6, rgba(c.bad, 0.4 + 0.6 * strength), { align: 'center', size: 12, weight: 700 })
      }

      // Leads to the galvanometer
      const gx = cx
      const gy = sceneH - 34
      ctx.strokeStyle = c.ink3
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(coilX0 + 3, cy + rPx)
      ctx.lineTo(coilX0 + 3, gy)
      ctx.lineTo(gx - 26, gy)
      ctx.moveTo(coilX0 + coilW - 3, cy + rPx)
      ctx.lineTo(coilX0 + coilW - 3, gy - 0)
      ctx.lineTo(gx + 26, gy)
      ctx.stroke()
      // Centre-zero galvanometer
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.ink
      ctx.lineWidth = 2
      roundRect(ctx, gx - 26, gy - 22, 52, 34, 6)
      ctx.fill()
      ctx.stroke()
      const ang = (Math.max(-1, Math.min(1, e / (peak || 1))) * Math.PI) / 3.2
      ctx.strokeStyle = c.bad
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(gx, gy + 8)
      ctx.lineTo(gx + 20 * Math.sin(ang), gy + 8 - 20 * Math.cos(ang))
      ctx.stroke()
      label(ctx, 'G', gx, gy + 8, c.ink3, { align: 'center', size: 9 })
      label(ctx, `${(e * 1000).toFixed(1)} mV`, gx + 36, gy + 2, c.sodium, { size: 13, weight: 600 })

      // HUD
      label(ctx, `z  ${(z * 100).toFixed(1)} cm`, 14, 22, c.ink2, { size: 11 })
      label(ctx, `N  ${N} turns   a  ${(a * 100).toFixed(1)} cm`, 14, 38, c.ink2, { size: 11 })
      ctx.restore()

      // Traces: flux and EMF over the whole pass, revealed up to the current time.
      const idx = Math.floor((tc / duration) * (pass.t.length - 1))
      const phiMax = maxFlux(m, a)
      const panelY = sceneH + 8
      const panelH = (h - sceneH - 16) / 2 - 4
      tracePanel(
        ctx, 10, panelY, w - 20, panelH, c,
        [{ values: pass.phi, upTo: idx, color: c.prussian, max: phiMax * 1.1 }],
        `Φ(t)   now ${(phi * 1e6).toFixed(1)} µWb`,
        tc / duration,
      )
      tracePanel(
        ctx, 10, panelY + panelH + 8, w - 20, panelH, c,
        [{ values: pass.emf, upTo: idx, color: c.sodium, max: peak * 1.15 }],
        `ε(t) = −N dΦ/dt   now ${(e * 1000).toFixed(1)} mV`,
        tc / duration,
      )
    },
    running,
    speed,
  )

  return (
    <canvas
      ref={canvasRef}
      className="block h-[440px] w-full sm:h-[500px]"
      role="img"
      aria-label={`Bar magnet passing through a coil of ${N} turns at ${v} metres per second`}
    />
  )
}
