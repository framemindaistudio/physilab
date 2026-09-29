import { useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { K_EV, MATERIALS, saturationCurrent } from '@/physics/semiconductor/bandGap'
import { clear, graphPaper, label, rgba, roundRect } from '@/components/simulation/draw'

interface Carrier {
  x: number
  y: number
  vy: number
  life: number
}

export default function BandGapApparatus({ params, running, speed }: ApparatusProps) {
  const m = MATERIALS[String(params.material)] ?? MATERIALS.silicon
  const Tc = Number(params.temperature)
  const colors = useThemeColors()
  const sim = useRef({ carriers: [] as Carrier[], acc: 0, bubbles: [] as { x: number; y: number }[] })

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      const c = colors.current
      const s = sim.current
      const T = Tc + 273.15
      const Is = saturationCurrent(T, m)
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)
      const wide = w > 600
      const half = wide ? w * 0.46 : w

      // ---- Oil bath with thermometer and diode ----
      const bx = 30
      const by = 40
      const bw = Math.min(half - 90, 220)
      const bh = (wide ? h : h * 0.5) - 90
      const oilTop = by + 30
      const heat = (Tc - 25) / 70
      ctx.fillStyle = `rgba(${200 + 40 * heat}, ${150 - 40 * heat}, 60, 0.35)`
      ctx.fillRect(bx, oilTop, bw, bh - 30)
      ctx.strokeStyle = c.ink2
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(bx, by)
      ctx.lineTo(bx, by + bh)
      ctx.lineTo(bx + bw, by + bh)
      ctx.lineTo(bx + bw, by)
      ctx.stroke()
      ctx.lineWidth = 1
      // Heater coil
      ctx.strokeStyle = heat > 0.05 ? c.bad : c.ink3
      ctx.beginPath()
      for (let i = 0; i <= 40; i++) {
        const x = bx + 16 + ((bw - 32) * i) / 40
        const y = by + bh - 12 + Math.sin(i * 1.2) * 5
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      // Bubbles when hot
      if (running && heat > 0.3 && Math.random() < dt * 8 * heat * speed) s.bubbles.push({ x: bx + 20 + Math.random() * (bw - 40), y: by + bh - 16 })
      s.bubbles.forEach((b) => (b.y -= dt * 40 * speed))
      s.bubbles = s.bubbles.filter((b) => b.y > oilTop)
      ctx.strokeStyle = rgba(c.ink3, 0.6)
      for (const b of s.bubbles) {
        ctx.beginPath()
        ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2)
        ctx.stroke()
      }
      // Diode
      const dx = bx + bw * 0.62
      const dy = oilTop + (bh - 30) * 0.45
      ctx.fillStyle = c.ink
      ctx.beginPath()
      ctx.moveTo(dx - 10, dy - 12)
      ctx.lineTo(dx + 10, dy - 12)
      ctx.lineTo(dx, dy + 4)
      ctx.closePath()
      ctx.fill()
      ctx.fillRect(dx - 10, dy + 5, 20, 3)
      ctx.strokeStyle = c.ink2
      ctx.beginPath()
      ctx.moveTo(dx, dy - 12)
      ctx.lineTo(dx, by - 20)
      ctx.moveTo(dx, dy + 8)
      ctx.lineTo(dx + 18, dy + 8)
      ctx.lineTo(dx + 18, by - 20)
      ctx.stroke()
      label(ctx, 'reverse-biased diode', dx - 10, dy + 26, c.ink3, { align: 'center', size: 10 })
      // Thermometer
      const tx = bx + bw * 0.22
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.ink2
      roundRect(ctx, tx - 5, by - 20, 10, bh - 20, 5)
      ctx.fill()
      ctx.stroke()
      const colH = (bh - 40) * (0.15 + 0.8 * heat)
      ctx.fillStyle = c.bad
      ctx.fillRect(tx - 2.5, by - 20 + (bh - 20) - colH - 6, 5, colH)
      ctx.beginPath()
      ctx.arc(tx, by + bh - 36, 7, 0, Math.PI * 2)
      ctx.fill()
      label(ctx, `${Tc.toFixed(0)} °C`, tx + 12, by - 6, c.ink, { size: 13, weight: 700 })
      label(ctx, `I_s = ${(Is * 1e9).toFixed(2)} nA`, bx, by + bh + 26, c.sodium, { size: 14, weight: 700 })
      label(ctx, `${m.label}`, bx, by + bh + 44, c.ink2, { size: 11 })

      // ---- Energy-band picture: thermal excitation across the gap ----
      const ex = wide ? half + 10 : 20
      const ey = wide ? 30 : h * 0.55
      const ew = wide ? w - half - 30 : w - 40
      const eh = wide ? h - 60 : h * 0.42
      ctx.fillStyle = c.panel
      ctx.strokeStyle = c.line
      roundRect(ctx, ex, ey, ew, eh, 8)
      ctx.fill()
      ctx.stroke()
      const gapPx = (m.eg / 1.3) * (eh * 0.55)
      const midY = ey + eh * 0.52
      const cbY = midY - gapPx / 2
      const vbY = midY + gapPx / 2
      ctx.fillStyle = rgba(c.prussian, 0.18)
      ctx.fillRect(ex + 20, ey + 26, ew - 40, cbY - (ey + 26))
      ctx.fillStyle = rgba(c.sodium, 0.22)
      ctx.fillRect(ex + 20, vbY, ew - 40, ey + eh - 16 - vbY)
      label(ctx, 'conduction band', ex + 26, ey + 42, c.prussian, { size: 10 })
      label(ctx, 'valence band', ex + 26, ey + eh - 24, c.sodium, { size: 10 })
      ctx.strokeStyle = c.ink3
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(ex + ew - 34, cbY)
      ctx.lineTo(ex + ew - 34, vbY)
      ctx.stroke()
      ctx.setLineDash([])
      label(ctx, `E_g = ${m.eg} eV`, ex + ew - 40, midY + 4, c.ink, { align: 'right', size: 11, weight: 600 })
      label(ctx, `kT = ${(K_EV * T * 1000).toFixed(1)} meV`, ex + ew / 2, ey + 16, c.ink3, { align: 'center', size: 10 })

      // Excitation rate ∝ e^(−E_g/kT), shown on a log-compressed visual scale.
      if (running) {
        const rel = Math.log10(Is / saturationCurrent(298, m)) // decades above room temperature
        s.acc += dt * speed * (1.5 + 3.5 * Math.max(0, rel))
        while (s.acc >= 1) {
          s.acc -= 1
          s.carriers.push({ x: ex + 30 + Math.random() * (ew - 90), y: vbY, vy: -(gapPx + 20) / 0.6, life: 1.6 })
        }
      }
      for (const cr of s.carriers) {
        cr.life -= dt * speed
        if (cr.y > cbY - 12) cr.y += cr.vy * dt * speed
      }
      s.carriers = s.carriers.filter((cr) => cr.life > 0)
      for (const cr of s.carriers) {
        ctx.fillStyle = c.prussian
        ctx.beginPath()
        ctx.arc(cr.x, cr.y, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = c.sodium
        ctx.beginPath()
        ctx.arc(cr.x, vbY + 8, 3, 0, Math.PI * 2)
        ctx.stroke()
      }
      label(ctx, '● electron   ○ hole left behind', ex + 26, ey + eh - 8, c.ink3, { size: 9 })
    },
    running,
    speed,
  )

  return <canvas ref={canvasRef} className="block h-[400px] w-full sm:h-[420px]" role="img" aria-label={`${m.label} diode heated to ${Tc} degrees Celsius`} />
}
