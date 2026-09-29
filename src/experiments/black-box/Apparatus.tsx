import { useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { componentImpedance } from '@/physics/electromagnetism/lcr'
import { clear, graphPaper, label, roundRect } from '@/components/simulation/draw'
import { BOXES, SOURCE_V } from './model'

export default function BlackBoxApparatus({ params, running, speed }: ApparatusProps) {
  const boxKey = String(params.box)
  const comp = BOXES[boxKey] ?? BOXES.A
  const f = Number(params.frequency)
  const colors = useThemeColors()
  const t = useRef(0)

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      if (running) t.current += dt * speed
      const c = colors.current
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)
      const { Z, phase } = componentImpedance(comp, f)
      const I = SOURCE_V / Z

      // Circuit: generator — ammeter — box
      const cy = h * 0.3
      const gx = 60
      const bx = w * 0.42
      ctx.strokeStyle = c.ink2
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(gx + 24, cy - 40)
      ctx.lineTo(bx, cy - 40)
      ctx.moveTo(gx + 24, cy + 40)
      ctx.lineTo(bx, cy + 40)
      ctx.stroke()
      ctx.lineWidth = 1
      // Generator
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.ink
      ctx.beginPath()
      ctx.arc(gx, cy, 28, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      for (let i = 0; i <= 30; i++) {
        const x = gx - 16 + (32 * i) / 30
        const y = cy - 9 * Math.sin((2 * Math.PI * i) / 30)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      label(ctx, `${f} Hz · ${SOURCE_V} V`, gx, cy + 46, c.ink2, { align: 'center', size: 11 })
      // Black box
      ctx.fillStyle = '#1b2228'
      roundRect(ctx, bx, cy - 56, 110, 112, 10)
      ctx.fill()
      label(ctx, `BOX ${boxKey}`, bx + 55, cy - 8, '#e6edf0', { align: 'center', size: 14, weight: 700 })
      label(ctx, '?', bx + 55, cy + 24, '#f4a93c', { align: 'center', size: 26, weight: 700 })
      ctx.fillStyle = c.ink2
      ctx.beginPath()
      ctx.arc(bx, cy - 40, 5, 0, Math.PI * 2)
      ctx.arc(bx, cy + 40, 5, 0, Math.PI * 2)
      ctx.fill()
      // Meters
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.line
      roundRect(ctx, bx + 130, cy - 40, 150, 80, 8)
      ctx.fill()
      ctx.stroke()
      label(ctx, `V = ${SOURCE_V.toFixed(2)} V`, bx + 142, cy - 14, c.ink, { size: 13, weight: 600 })
      label(ctx, `I = ${(I * 1000).toFixed(2)} mA`, bx + 142, cy + 10, c.sodium, { size: 14, weight: 700 })
      label(ctx, `Z = V/I = ${Z.toFixed(1)} Ω`, bx + 142, cy + 30, c.ink2, { size: 11 })

      // Dual-trace oscilloscope: supply voltage and current (phase clue)
      const oy = h * 0.58
      const oh = h - oy - 20
      const ox = 20
      const ow = w - 40
      ctx.fillStyle = '#0c141b'
      roundRect(ctx, ox, oy, ow, oh, 10)
      ctx.fill()
      ctx.strokeStyle = 'rgba(127,150,161,0.3)'
      for (let i = 1; i < 10; i++) {
        ctx.beginPath()
        ctx.moveTo(ox + (ow * i) / 10, oy + 6)
        ctx.lineTo(ox + (ow * i) / 10, oy + oh - 6)
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.moveTo(ox + 6, oy + oh / 2)
      ctx.lineTo(ox + ow - 6, oy + oh / 2)
      ctx.stroke()
      const cycles = 2
      const trace = (amp: number, ph: number, color: string) => {
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= 300; i++) {
          const x = ox + 10 + ((ow - 20) * i) / 300
          const theta = (2 * Math.PI * cycles * i) / 300 - t.current * 4
          const y = oy + oh / 2 - amp * Math.sin(theta + ph)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.lineWidth = 1
      }
      trace(oh * 0.36, 0, '#f4a93c')
      trace(oh * 0.24, phase, '#7fb3ef')
      label(ctx, 'CH1: supply voltage', ox + 12, oy + 16, '#f4a93c', { size: 10 })
      label(ctx, 'CH2: current', ox + 150, oy + 16, '#7fb3ef', { size: 10 })
      const deg = (phase * 180) / Math.PI
      label(ctx, `phase of current: ${deg >= 0 ? '+' : ''}${deg.toFixed(0)}° ${Math.abs(deg) < 3 ? '(in phase)' : deg > 0 ? '(current leads)' : '(current lags)'}`, ox + ow - 12, oy + 16, '#c9d6de', { align: 'right', size: 10 })
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[380px] w-full sm:h-[400px]" role="img" aria-label={`Black box ${boxKey} connected to an AC supply at ${f} hertz`} />
}
