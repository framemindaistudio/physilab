import { useEffect, useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { useCanvasLoop } from '@/hooks/useCanvasLoop'
import { useThemeColors } from '@/hooks/useThemeColors'
import { maxKineticEnergy, METALS, photocurrent, photonEnergy, saturationCurrent } from '@/physics/modern/photoelectric'
import { wavelengthToRGB } from '@/physics/optics/doubleSlit'
import { arrow, clear, graphPaper, label, rgba, roundRect } from '@/components/simulation/draw'

interface Electron {
  x: number // 0 = cathode, 1 = anode (fraction of the gap)
  y: number // lateral offset, −1 … 1
  ke0: number // emission kinetic energy (eV)
  dir: 1 | -1
  stray: boolean
  vy: number
}

interface Photon {
  s: number // 0 … 1 along the beam
}

const V_MIN = -3
const V_MAX = 5

export default function PhotoelectricApparatus({ params, running, speed, resetKey }: ApparatusProps) {
  const lambda = Number(params.wavelength)
  const intensityPct = Number(params.intensity)
  const metal = METALS[String(params.metal)] ?? METALS.sodium
  const V = Number(params.voltage)
  const colors = useThemeColors()

  const sim = useRef({ electrons: [] as Electron[], photons: [] as Photon[], emitAcc: 0, photonAcc: 0, seeded: false })
  useEffect(() => {
    sim.current = { electrons: [], photons: [], emitAcc: 0, photonAcc: 0, seeded: false }
  }, [resetKey, params.metal])

  const canvasRef = useCanvasLoop(
    (ctx, w, h, dt) => {
      const c = colors.current
      const s = sim.current
      const E = photonEnergy(lambda)
      const KEmax = maxKineticEnergy(lambda, metal.phi)
      const Isat = saturationCurrent(lambda, intensityPct, metal.phi)
      const I = photocurrent(V, lambda, intensityPct, metal.phi)

      // Probability that an electron is emitted towards the anode, matching the
      // collection factor in photocurrent(): 0.7 at V ≤ 0, rising towards 1 for V > 0.
      const pAxial = V >= 0 ? 1 - 0.3 * Math.exp(-V / 0.4) : 0.7

      // ---- Still frame: while paused with an empty tube, show a representative snapshot ----
      // drawn from the same energy distribution, so a paused (or reduced-motion) view is not blank.
      if (dt === 0 && !s.seeded && s.electrons.length === 0 && Isat > 0) {
        s.seeded = true
        const n = Math.min(60, Math.round(6 * Isat))
        for (let i = 0; i < n; i++) {
          const stray = Math.random() > pAxial
          const ke0 = Math.random() * KEmax
          // Electrons that cannot reach the anode are only found short of their turning point.
          const reach = V < 0 ? Math.min(1, ke0 / -V) : 1
          const x = stray ? Math.random() * 0.25 : Math.random() * reach * 0.98
          s.electrons.push({
            x,
            y: (Math.random() * 2 - 1) * 0.55,
            ke0,
            dir: !stray && reach < 1 && Math.random() < 0.5 ? -1 : 1,
            stray,
            vy: stray ? (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.6) : 0,
          })
        }
        const photons = Math.round(intensityPct * 0.18)
        for (let i = 0; i < photons; i++) s.photons.push({ s: (i + Math.random()) / Math.max(1, photons) })
      }

      // ---- Particle update (same model the ammeter uses) ----
      if (dt > 0) {
        s.photonAcc += dt * intensityPct * 0.25
        while (s.photonAcc >= 1) {
          s.photonAcc -= 1
          s.photons.push({ s: 0 })
        }
        s.photons.forEach((ph) => (ph.s += dt * 1.4))
        s.photons = s.photons.filter((ph) => ph.s < 1)

        s.emitAcc += dt * 7 * Isat
        while (s.emitAcc >= 1) {
          s.emitAcc -= 1
          const stray = Math.random() > pAxial
          s.electrons.push({
            x: 0,
            y: (Math.random() * 2 - 1) * 0.55,
            ke0: Math.random() * KEmax,
            dir: 1,
            stray,
            vy: stray ? (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.6) : 0,
          })
        }
        for (const el of s.electrons) {
          // Energy conservation in the uniform field: KE(x) = KE₀ + V·x (eV).
          const ke = Math.max(0.03, el.ke0 + V * el.x)
          const u = 0.9 * Math.sqrt(ke)
          if (el.stray) {
            el.x += 0.35 * u * dt * el.dir
            el.y += el.vy * dt
            if (el.x > 0.25) el.dir = -1
          } else {
            if (el.dir === 1 && el.ke0 + V * el.x <= 0) el.dir = -1
            el.x += u * dt * el.dir
          }
        }
        s.electrons = s.electrons.filter((el) => el.x > -0.01 && el.x < 1 && Math.abs(el.y) < 1.2)
        if (s.electrons.length > 400) s.electrons.splice(0, s.electrons.length - 400)
      }

      // ---- Drawing ----
      clear(ctx, w, h, c)
      graphPaper(ctx, w, h, c)
      // Side-by-side tube and I–V graph when there is room for the readouts beside the graph;
      // otherwise stack tube, readouts and graph.
      const wide = w > 460
      const tubeX = 20
      const tubeW = wide ? w * 0.56 : w - 40
      const tubeY = 70
      const tubeH = wide ? h * 0.5 : h * 0.3
      const catX = tubeX + 44
      const anX = tubeX + tubeW - 40
      const midY = tubeY + tubeH / 2
      const gapPx = anX - catX

      // Glass envelope
      ctx.fillStyle = rgba(c.prussian, 0.05)
      ctx.strokeStyle = rgba(c.ink3, 0.8)
      ctx.lineWidth = 1.5
      roundRect(ctx, tubeX, tubeY, tubeW, tubeH, tubeH / 2.4)
      ctx.fill()
      ctx.stroke()
      label(ctx, 'evacuated tube', tubeX + tubeW / 2, tubeY + tubeH - 10, c.ink3, { align: 'center', size: 10 })

      // Light source and beam
      const [r, g, b] = wavelengthToRGB(lambda)
      const lampX = tubeX + tubeW * 0.52
      const lampY = 26
      ctx.fillStyle = c.ink
      roundRect(ctx, lampX - 26, lampY - 14, 52, 22, 5)
      ctx.fill()
      label(ctx, lambda < 380 ? `UV ${lambda} nm` : `${lambda} nm`, lampX, lampY + 1, c.canvas, { align: 'center', size: 9, weight: 700 })
      const bx0 = lampX - 10
      const by0 = lampY + 8
      const bx1 = catX + 6
      const by1 = midY - 10
      if (intensityPct > 0) {
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.12 + 0.3 * (intensityPct / 100)})`
        ctx.lineWidth = 16
        ctx.beginPath()
        ctx.moveTo(bx0, by0)
        ctx.lineTo(bx1, by1)
        ctx.stroke()
        for (const ph of s.photons) {
          const px = bx0 + (bx1 - bx0) * ph.s
          const py = by0 + (by1 - by0) * ph.s
          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.beginPath()
          ctx.arc(px, py, 2.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Cathode (emitter) and anode (collector)
      ctx.strokeStyle = c.ink
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.arc(catX - 64, midY, 64, -0.85, 0.85)
      ctx.stroke()
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(anX, midY - tubeH * 0.3)
      ctx.lineTo(anX, midY + tubeH * 0.3)
      ctx.stroke()
      label(ctx, 'C', catX - 4, midY - tubeH * 0.33, c.ink2, { align: 'center', size: 11, weight: 700 })
      label(ctx, 'A', anX, midY - tubeH * 0.33, c.ink2, { align: 'center', size: 11, weight: 700 })
      label(ctx, metal.label, catX - 10, midY + tubeH * 0.38, c.ink3, { size: 10 })

      // Field direction
      if (Math.abs(V) > 0.05) {
        const y = tubeY + 16
        if (V > 0) arrow(ctx, anX - 30, y, catX + 30, y, rgba(c.ink3, 0.8), 1.2, 7)
        else arrow(ctx, catX + 30, y, anX - 30, y, rgba(c.ink3, 0.8), 1.2, 7)
        label(ctx, 'E', (catX + anX) / 2, y - 5, c.ink3, { align: 'center', size: 10 })
      }

      // Electrons
      for (const el of s.electrons) {
        const px = catX + 3 + el.x * (gapPx - 3)
        const py = midY + el.y * tubeH * 0.3
        ctx.fillStyle = el.dir === 1 ? c.prussian : rgba(c.bad, 0.85)
        ctx.beginPath()
        ctx.arc(px, py, 2.4, 0, Math.PI * 2)
        ctx.fill()
      }

      // External circuit readouts
      const infoY = tubeY + tubeH + 30
      label(ctx, `Anode potential   ${V >= 0 ? '+' : ''}${V.toFixed(2)} V`, tubeX, infoY, c.ink, { size: 12 })
      label(ctx, `Photocurrent      ${I.toFixed(3)} µA`, tubeX, infoY + 20, c.sodium, { size: 13, weight: 600 })
      label(ctx, `Photon energy hν  ${E.toFixed(3)} eV`, tubeX, infoY + 40, c.ink2, { size: 11 })
      label(ctx, `Work function φ   ${metal.phi.toFixed(2)} eV`, tubeX, infoY + 56, c.ink2, { size: 11 })
      label(
        ctx,
        E > metal.phi ? `KEmax = hν − φ    ${KEmax.toFixed(3)} eV` : 'hν < φ: no electrons are emitted',
        tubeX,
        infoY + 72,
        E > metal.phi ? c.ink2 : c.bad,
        { size: 11, weight: E > metal.phi ? 500 : 600 },
      )
      label(ctx, '● reaching anode', tubeX, infoY + 94, c.prussian, { size: 10 })
      label(ctx, '● turned back', tubeX + 120, infoY + 94, c.bad, { size: 10 })

      // I–V characteristic (right, or below on narrow screens)
      const gx = wide ? tubeX + tubeW + 30 : tubeX
      const gy = wide ? tubeY : infoY + 104
      const gw = wide ? w - gx - 18 : w - 2 * tubeX
      const gh = wide ? tubeH + 60 : h - gy - 12
      if (gw > 80 && gh > 60) {
        ctx.fillStyle = c.panel
        ctx.strokeStyle = c.line
        ctx.lineWidth = 1
        roundRect(ctx, gx, gy, gw, gh, 8)
        ctx.fill()
        ctx.stroke()
        const Imax = Math.max(0.5, saturationCurrent(lambda, 100, metal.phi)) * 1.05
        const PX = (v: number) => gx + 10 + ((v - V_MIN) / (V_MAX - V_MIN)) * (gw - 20)
        const PY = (i: number) => gy + gh - 18 - (i / Imax) * (gh - 36)
        ctx.strokeStyle = c.gridMajor
        ctx.beginPath()
        ctx.moveTo(PX(0), gy + 8)
        ctx.lineTo(PX(0), gy + gh - 12)
        ctx.moveTo(gx + 8, PY(0))
        ctx.lineTo(gx + gw - 8, PY(0))
        ctx.stroke()
        ctx.strokeStyle = c.prussian
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= 200; i++) {
          const v = V_MIN + ((V_MAX - V_MIN) * i) / 200
          const y = PY(photocurrent(v, lambda, intensityPct, metal.phi))
          if (i === 0) ctx.moveTo(PX(v), y)
          else ctx.lineTo(PX(v), y)
        }
        ctx.stroke()
        if (KEmax > 0 && -KEmax >= V_MIN) {
          ctx.setLineDash([3, 3])
          ctx.strokeStyle = c.ink3
          ctx.beginPath()
          ctx.moveTo(PX(-KEmax), PY(0))
          ctx.lineTo(PX(-KEmax), gy + 20)
          ctx.stroke()
          ctx.setLineDash([])
          label(ctx, `−V₀`, PX(-KEmax), gy + 16, c.ink2, { align: 'center', size: 10 })
        }
        ctx.fillStyle = c.sodium
        ctx.beginPath()
        ctx.arc(PX(V), PY(I), 5, 0, Math.PI * 2)
        ctx.fill()
        label(ctx, 'I (µA)', gx + 10, gy + 14, c.ink3, { size: 10 })
        label(ctx, 'V (V)', gx + gw - 8, PY(0) + 14, c.ink3, { align: 'right', size: 10 })
        label(ctx, `${V_MIN}`, PX(V_MIN), PY(0) + 14, c.ink3, { align: 'center', size: 9 })
        label(ctx, `+${V_MAX}`, PX(V_MAX) - 8, PY(0) - 6, c.ink3, { align: 'center', size: 9 })
      }
    },
    running,
    speed,
  )

  return (
    <canvas
      ref={canvasRef}
      className="block h-[440px] w-full sm:h-[460px]"
      role="img"
      aria-label={`Photoelectric tube with ${metal.label} cathode lit at ${lambda} nanometres`}
    />
  )
}
