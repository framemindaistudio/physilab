import { useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { fundamental, response } from '@/physics/waves/sonometer'
import { clear, graphPaper, label, rgba, roundRect } from '@/components/simulation/draw'
import { muOf, Q, tensionOf } from './model'

export default function SonometerApparatus({ params, running, speed, resetKey }: ApparatusProps) {
  const f = Number(params.fork)
  const massKg = Number(params.mass)
  const Lcm = Number(params.length)
  const colors = useThemeColors()
  const t = useRef(0)
  const rider = useRef({ y: 0, v: 0, key: -1 })
  if (rider.current.key !== resetKey) rider.current = { y: 0, v: 0, key: resetKey }

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      t.current += dt
      const c = colors.current
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)
      const T = tensionOf(massKg)
      const mu = muOf(params.wire)
      const amp = running ? response(f, Lcm / 100, T, mu, Q) : 0
      const f1 = fundamental(Lcm / 100, T, mu)

      const left = 40
      const right = w - 60
      const pxPerCm = (right - left - 20) / 105
      const wireY = h * 0.5
      const boxTop = wireY + 18
      const xA = left + 10
      const xB = xA + Lcm * pxPerCm

      // Sonometer box
      ctx.fillStyle = '#b8864b'
      roundRect(ctx, left - 10, boxTop, right - left + 20, 46, 6)
      ctx.fill()
      ctx.fillStyle = rgba('#5b3a1a', 0.5)
      ctx.fillRect(left + 40, boxTop + 18, right - left - 80, 10)
      // Ruler
      for (let cm = 0; cm <= 100; cm += 5) {
        const x = xA + cm * pxPerCm
        ctx.strokeStyle = c.ink2
        ctx.beginPath()
        ctx.moveTo(x, boxTop + 46)
        ctx.lineTo(x, boxTop + 46 + (cm % 10 === 0 ? 10 : 5))
        ctx.stroke()
        if (cm % 20 === 0) label(ctx, `${cm}`, x, boxTop + 70, c.ink3, { align: 'center', size: 10 })
      }
      label(ctx, 'cm', right, boxTop + 70, c.ink3, { align: 'right', size: 10 })

      // Wire: straight outside the bridges, standing wave between them.
      ctx.strokeStyle = c.ink
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(left - 6, wireY)
      ctx.lineTo(xA, wireY)
      const omega = 2 * Math.PI * 3 // visual rate, not the real 256+ Hz
      const A = Math.min(40, 42 * amp)
      for (let i = 0; i <= 80; i++) {
        const x = xA + ((xB - xA) * i) / 80
        const y = wireY - A * Math.sin((Math.PI * i) / 80) * Math.cos(omega * t.current * speed)
        ctx.lineTo(x, y)
      }
      ctx.lineTo(right + 14, wireY)
      ctx.stroke()
      // Envelope
      if (A > 2) {
        ctx.strokeStyle = rgba(c.sodium, 0.35)
        ctx.setLineDash([3, 4])
        for (const s of [1, -1]) {
          ctx.beginPath()
          for (let i = 0; i <= 60; i++) {
            const x = xA + ((xB - xA) * i) / 60
            const y = wireY - s * A * Math.sin((Math.PI * i) / 60)
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }
        ctx.setLineDash([])
      }

      // Bridges
      for (const x of [xA, xB]) {
        ctx.fillStyle = c.ink2
        ctx.beginPath()
        ctx.moveTo(x - 8, boxTop)
        ctx.lineTo(x + 8, boxTop)
        ctx.lineTo(x, wireY)
        ctx.closePath()
        ctx.fill()
      }
      label(ctx, `L = ${Lcm.toFixed(1)} cm`, (xA + xB) / 2, boxTop + 34, '#fff', { align: 'center', size: 12, weight: 700 })

      // Paper rider: flies off when the string resonates strongly.
      const r = rider.current
      if (amp > 0.8 && r.y === 0) r.v = -260
      if (r.v !== 0 || r.y < 0) {
        r.v += 600 * dt
        r.y = Math.min(0, r.y + r.v * dt)
        if (r.y === 0) r.v = 0
      }
      const rx = (xA + xB) / 2
      const ry = wireY - A * Math.abs(Math.cos(omega * t.current * speed)) + r.y
      ctx.strokeStyle = c.bad
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(rx - 6, ry - 1)
      ctx.lineTo(rx, ry - 9)
      ctx.lineTo(rx + 6, ry - 1)
      ctx.stroke()
      ctx.lineWidth = 1

      // Pulley and hanging weight
      ctx.strokeStyle = c.ink2
      ctx.beginPath()
      ctx.arc(right + 14, wireY + 8, 8, 0, Math.PI * 2)
      ctx.moveTo(right + 22, wireY + 8)
      ctx.lineTo(right + 22, h - 70)
      ctx.stroke()
      ctx.fillStyle = c.ink
      roundRect(ctx, right + 10, h - 70, 24, 34, 3)
      ctx.fill()
      label(ctx, `${massKg} kg`, right + 22, h - 24, c.ink2, { align: 'center', size: 11 })

      // Tuning fork
      const fx = left + 30
      const fy = 34
      const wob = running ? Math.sin(t.current * 60) * 1.5 : 0
      ctx.strokeStyle = c.prussian
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(fx - 6 - wob, fy)
      ctx.lineTo(fx - 6 - wob, fy + 34)
      ctx.lineTo(fx + 6 + wob, fy + 34)
      ctx.lineTo(fx + 6 + wob, fy)
      ctx.moveTo(fx, fy + 34)
      ctx.lineTo(fx, fy + 52)
      ctx.stroke()
      ctx.lineWidth = 1
      label(ctx, `${f} Hz fork`, fx + 16, fy + 20, c.ink, { size: 12, weight: 600 })

      // Status
      const status = !running ? 'Press Start to strike the fork' : amp > 0.8 ? 'Resonance! The rider jumps off' : amp > 0.35 ? 'Close — the wire is vibrating' : 'The rider is still'
      label(ctx, status, w - 16, 24, amp > 0.8 ? c.sodium : c.ink2, { align: 'right', size: 13, weight: 600 })
      label(ctx, `f₁ of wire = ${f1.toFixed(1)} Hz`, w - 16, 42, c.ink3, { align: 'right', size: 11 })
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[340px] w-full sm:h-[380px]" role="img" aria-label={`Sonometer wire with bridges ${Lcm} centimetres apart`} />
}
