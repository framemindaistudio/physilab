import { useEffect, useRef } from 'react'
import type { ApparatusProps } from '@/types/experiment'
import { solveCircuit, type Device } from '@/physics/electromagnetism/ohm'
import { fixed } from '@/utils/format'

/*
  Circuit layout (viewBox 640 × 360). Conventional current flows clockwise:
  supply (+) → ammeter → device (top to bottom) → [series R for diode] → supply (−).
  The voltmeter is connected in parallel with the device.
*/
const LOOP = 'M 90 180 L 90 70 L 400 70 L 400 290 L 90 290 Z'

export default function OhmApparatus({ params, running, speed }: ApparatusProps) {
  const Vs = Number(params.supply)
  const device = String(params.device) as Device
  const R = Number(params.resistance)
  const sol = solveCircuit(Vs, device, R)
  const mA = sol.I * 1000

  const flowRef = useRef<SVGPathElement>(null)
  const state = useRef({ offset: 0, I: sol.I, running, speed })
  state.current.I = sol.I
  state.current.running = running
  state.current.speed = speed

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = state.current
      if (s.running && s.I > 0) {
        // Dot speed grows with current (square-root scale so small currents stay visible).
        const v = 25 + 190 * Math.sqrt(Math.min(1, s.I / 1.2))
        s.offset -= v * dt * s.speed
        flowRef.current?.setAttribute('stroke-dashoffset', String(s.offset))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const glow = device === 'lamp' ? Math.min(1, sol.P / 2.2) : 0
  const needle = (frac: number) => -60 + 120 * Math.max(0, Math.min(1, frac))
  const ammeterRange = device === 'diode' ? 150 : device === 'lamp' ? 1500 : 1500
  const vRange = 15

  return (
    <svg viewBox="0 0 640 360" className="block h-auto w-full" role="img" aria-label={`Circuit: supply ${Vs} volts, ${device}, current ${fixed(mA, 1)} milliamps`}>
      <defs>
        <radialGradient id="lampGlow">
          <stop offset="0%" stopColor="#ffd27a" stopOpacity={0.95 * glow} />
          <stop offset="60%" stopColor="#ffb13b" stopOpacity={0.35 * glow} />
          <stop offset="100%" stopColor="#ffb13b" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Main loop wire */}
      <path d={LOOP} fill="none" stroke="var(--ink-2)" strokeWidth={2.5} strokeLinejoin="round" />
      {/* Moving charge carriers (conventional current) */}
      <path
        ref={flowRef}
        d={LOOP}
        fill="none"
        stroke="var(--sodium)"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray="0.1 22"
        opacity={sol.I > 0 && running ? 0.95 : 0.35}
      />

      {/* Supply */}
      <rect x={60} y={150} width={60} height={60} fill="var(--canvas-bg)" />
      <line x1={66} y1={166} x2={114} y2={166} stroke="var(--ink)" strokeWidth={3} />
      <line x1={78} y1={178} x2={102} y2={178} stroke="var(--ink)" strokeWidth={5} />
      <line x1={66} y1={190} x2={114} y2={190} stroke="var(--ink)" strokeWidth={3} />
      <line x1={78} y1={202} x2={102} y2={202} stroke="var(--ink)" strokeWidth={5} />
      <text x={126} y={170} className="fill-[var(--ink-3)] font-mono text-[12px]">+</text>
      <text x={20} y={140} className="fill-[var(--ink-2)] font-mono text-[12px]">Supply</text>
      <text x={20} y={236} className="fill-[var(--ink)] font-mono text-[14px] font-semibold">{fixed(Vs, 1)} V</text>
      {/* Rheostat arrow across supply */}
      <line x1={56} y1={214} x2={124} y2={146} stroke="var(--prussian)" strokeWidth={1.5} />
      <polygon points="124,146 114,149 121,156" fill="var(--prussian)" />

      {/* Ammeter */}
      <Meter cx={245} cy={70} letter="A" angle={needle(mA / ammeterRange)} />
      <text x={245} y={122} textAnchor="middle" className="fill-[var(--sodium)] font-mono text-[15px] font-semibold">
        {fixed(mA, 1)} mA
      </text>

      {/* Device */}
      <rect x={370} y={125} width={60} height={110} fill="var(--canvas-bg)" />
      {device === 'resistor' && (
        <>
          <polyline
            points="400,125 400,138 388,146 412,158 388,170 412,182 388,194 412,206 388,218 400,224 400,235"
            fill="none"
            stroke="var(--ink)"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <text x={432} y={184} className="fill-[var(--ink-2)] font-mono text-[12px]">R = {R} Ω</text>
        </>
      )}
      {device === 'lamp' && (
        <>
          <line x1={400} y1={125} x2={400} y2={152} stroke="var(--ink)" strokeWidth={2.5} />
          <line x1={400} y1={208} x2={400} y2={235} stroke="var(--ink)" strokeWidth={2.5} />
          <circle cx={400} cy={180} r={60} fill="url(#lampGlow)" />
          <circle cx={400} cy={180} r={28} fill="none" stroke="var(--ink)" strokeWidth={2.5} />
          <line x1={380} y1={160} x2={420} y2={200} stroke="var(--ink)" strokeWidth={2} />
          <line x1={420} y1={160} x2={380} y2={200} stroke="var(--ink)" strokeWidth={2} />
          <text x={436} y={150} className="fill-[var(--ink-2)] font-mono text-[12px]">Filament lamp</text>
          <text x={436} y={166} className="fill-[var(--ink-3)] font-mono text-[11px]">R = {fixed(sol.R, 1)} Ω</text>
        </>
      )}
      {device === 'diode' && (
        <>
          <line x1={400} y1={125} x2={400} y2={165} stroke="var(--ink)" strokeWidth={2.5} />
          <polygon points="382,165 418,165 400,195" fill="var(--ink)" />
          <line x1={380} y1={196} x2={420} y2={196} stroke="var(--ink)" strokeWidth={3} />
          <line x1={400} y1={196} x2={400} y2={235} stroke="var(--ink)" strokeWidth={2.5} />
          <text x={436} y={150} className="fill-[var(--ink-2)] font-mono text-[12px]">Si diode</text>
          <text x={436} y={166} className="fill-[var(--ink-3)] font-mono text-[11px]">forward bias</text>
          {/* Current-limiting resistor on the return wire */}
          <rect x={205} y={275} width={80} height={30} fill="var(--canvas-bg)" />
          <polyline points="205,290 215,290 222,280 234,300 246,280 258,300 270,280 277,290 285,290" fill="none" stroke="var(--ink)" strokeWidth={2.5} strokeLinejoin="round" />
          <text x={245} y={326} textAnchor="middle" className="fill-[var(--ink-3)] font-mono text-[11px]">100 Ω limiting</text>
        </>
      )}

      {/* Voltmeter in parallel */}
      <path d="M 400 100 L 540 100 L 540 150 M 540 210 L 540 260 L 400 260" fill="none" stroke="var(--ink-2)" strokeWidth={2} />
      <circle cx={400} cy={100} r={4} fill="var(--ink-2)" />
      <circle cx={400} cy={260} r={4} fill="var(--ink-2)" />
      <Meter cx={540} cy={180} letter="V" angle={needle(sol.V / vRange)} />
      <text x={574} y={186} className="fill-[var(--sodium)] font-mono text-[15px] font-semibold">
        {fixed(sol.V, 2)} V
      </text>

      <text x={320} y={350} textAnchor="middle" className="fill-[var(--ink-3)] font-mono text-[11px]">
        P = {fixed(sol.P * 1000, 0)} mW · V/I = {Number.isFinite(sol.R) ? `${fixed(sol.R, 1)} Ω` : '∞'}
      </text>
    </svg>
  )
}

function Meter({ cx, cy, letter, angle }: { cx: number; cy: number; letter: string; angle: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={26} fill="var(--panel)" stroke="var(--ink)" strokeWidth={2.5} />
      <path d={`M ${cx - 17} ${cy + 4} A 18 18 0 0 1 ${cx + 17} ${cy + 4}`} fill="none" stroke="var(--line)" strokeWidth={1.5} />
      <line
        x1={cx}
        y1={cy + 8}
        x2={cx}
        y2={cy - 14}
        stroke="var(--bad)"
        strokeWidth={1.6}
        style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${cx}px ${cy + 8}px`, transition: 'transform 300ms ease-out' }}
      />
      <text x={cx} y={cy + 20} textAnchor="middle" className="fill-[var(--ink)] font-mono text-[12px] font-bold">
        {letter}
      </text>
    </g>
  )
}
