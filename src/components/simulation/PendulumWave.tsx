import { useEffect, useRef, useState } from 'react'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { label, rgba } from './draw'

/**
 * Hero demonstration: a pendulum wave.
 * Pendulum k completes (N₀ + k) oscillations in Γ seconds, so its length is
 * L_k = g (Γ / 2π(N₀ + k))². The moving pattern is T = 2π√(L/g), nothing else.
 */
const COUNT = 15
const GAMMA = 60
const N0 = 20
const G = 9.81
const AMP = 0.16 // rad

const PENDULA = Array.from({ length: COUNT }, (_, k) => {
  const T = GAMMA / (N0 + k)
  return { T, L: G * (T / (2 * Math.PI)) ** 2 }
})

export function PendulumWave({ className }: { className?: string }) {
  const colors = useThemeColors()
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const tRef = useRef(7.3)
  const ref = useCanvasLoop(
    (ctx, w, h, dt) => {
      tRef.current += dt
      const t = tRef.current
      const c = colors.current
      ctx.clearRect(0, 0, w, h)
      const top = 28
      const Lmax = PENDULA[0].L
      const scale = (h - top - 44) / Lmax
      // Leave room for the widest swing so no bob leaves the frame.
      // The longest pendulum (left) swings widest; leave room for it and for the shortest (right).
      const left = Math.min(w * 0.2, Lmax * scale * Math.sin(AMP)) + 12
      const right = PENDULA[COUNT - 1].L * scale * Math.sin(AMP) + 12
      const spacing = (w - left - right) / (COUNT - 1)

      ctx.fillStyle = c.ink
      ctx.fillRect(12, top - 8, w - 24, 5)

      PENDULA.forEach((p, k) => {
        const theta = AMP * Math.cos((2 * Math.PI * t) / p.T)
        const px = left + k * spacing
        const len = p.L * scale
        const bx = px + len * Math.sin(theta)
        const by = top + len * Math.cos(theta)
        ctx.strokeStyle = rgba(c.ink2, 0.8)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(px, top - 3)
        ctx.lineTo(bx, by)
        ctx.stroke()
        const r = Math.max(4, Math.min(9, spacing * 0.28))
        ctx.fillStyle = k % 5 === 0 ? c.sodium : c.prussian
        ctx.beginPath()
        ctx.arc(bx, by, r, 0, Math.PI * 2)
        ctx.fill()
      })

      const cycle = t % GAMMA
      label(ctx, `t = ${cycle.toFixed(1).padStart(4, '0')} s`, w - 16, top + 22, c.ink2, { align: 'right', size: 12 })
      label(ctx, `T = 2π√(L/g)`, 14, h - 16, c.ink3, { size: 11 })
      label(ctx, `L = ${PENDULA[COUNT - 1].L.toFixed(2)}–${PENDULA[0].L.toFixed(2)} m`, w - 14, h - 16, c.ink3, { align: 'right', size: 11 })
    },
    !reduced,
    1,
  )

  return <canvas ref={ref} className={className} role="img" aria-label="Pendulum wave: fifteen pendulums of carefully chosen lengths swinging in and out of phase" />
}
