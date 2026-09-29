import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { qualityFactor, resonantFrequency, seriesCurrent, seriesImpedance } from '@/physics/electromagnetism/lcr'
import { leastCount } from '@/utils/random'
import { percentError } from '@/utils/stats'
import { fixed } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'
import { readCurve, SOURCE_V } from './model'

export const lcrResonance: ExperimentModule = {
  id: 'lcr-resonance',
  number: '19',
  title: 'Series LCR Frequency Response',
  category: 'electromagnetism',
  tagline: 'Sweep the frequency and watch the current peak at resonance.',
  summary: 'Measure the current in a series LCR circuit over a range of frequencies, plot the resonance curve, and find the resonant frequency, bandwidth and quality factor.',
  difficulty: 'Intermediate',
  durationMin: 30,
  aim: 'To study the frequency response of a series LCR circuit and determine its resonant frequency, bandwidth and quality factor.',
  objectives: [
    'Measure the current in a series LCR circuit as the frequency is varied.',
    'Plot the resonance curve and find the frequency of maximum current.',
    'Find the half-power frequencies and the bandwidth.',
    'Calculate the quality factor and compare with theory.',
  ],
  apparatusList: ['Signal generator (5 V rms, 100–3000 Hz)', 'Resistor (10–200 Ω)', 'Inductor (10–100 mH)', 'Capacitor (0.5–5 µF)', 'AC milliammeter'],
  theory: [
    {
      heading: 'Impedance of a series LCR circuit',
      body: [
        'In a series LCR circuit the inductor’s reactance X_L grows with frequency while the capacitor’s reactance X_C falls. Their effects oppose each other: the voltage across L leads the current by 90° and the voltage across C lags it by 90°.',
        'The total opposition to current, the impedance Z, is smallest when the two reactances are equal. Then only the resistance limits the current, which reaches its maximum V/R, and the current is in phase with the supply.',
      ],
      formulas: [
        { tex: 'X_L = 2\\pi f L, \\qquad X_C = \\frac{1}{2\\pi f C}', caption: 'Reactances' },
        { tex: 'Z = \\sqrt{R^2 + (X_L - X_C)^2}, \\qquad I = \\frac{V}{Z}', caption: 'Impedance and current' },
        { tex: 'f_0 = \\frac{1}{2\\pi\\sqrt{LC}}', caption: 'Resonant frequency (X_L = X_C)' },
      ],
    },
    {
      heading: 'Bandwidth and quality factor',
      body: [
        'The sharpness of the resonance is described by the bandwidth Δf = f₂ − f₁, the gap between the two half-power frequencies where the current falls to I_max/√2 (power falls to half).',
        'The quality factor Q = f₀/Δf is large when the resistance is small: a high-Q circuit selects a narrow band of frequencies, which is how a radio tunes to one station.',
      ],
      formulas: [
        { tex: 'I(f_1) = I(f_2) = \\frac{I_{\\max}}{\\sqrt2}, \\qquad \\Delta f = f_2 - f_1', caption: 'Half-power points' },
        { tex: 'Q = \\frac{f_0}{\\Delta f} = \\frac{1}{R}\\sqrt{\\frac{L}{C}}', caption: 'Quality factor' },
      ],
    },
  ],
  variables: [
    { symbol: 'f', name: 'Frequency', unit: 'Hz', role: 'independent' },
    { symbol: 'I', name: 'rms current', unit: 'mA', role: 'dependent' },
    { symbol: 'R,\\ L,\\ C', name: 'Circuit components', unit: 'Ω, mH, µF', role: 'controlled' },
  ],
  procedure: [
    'Choose R, L and C and keep them fixed.',
    'Set the frequency and press “Read current”. Start at a low frequency.',
    'Increase the frequency in steps (smaller steps near the peak) up to about 3000 Hz. Take at least ten readings, with several on each side of the peak.',
    'In Analysis, the resonance curve gives f₀, the half-power frequencies, Δf and Q.',
  ],
  precautions: ['Keep the supply voltage constant at every frequency.', 'Take closely spaced readings near resonance.', 'Use an AC meter that responds correctly over the frequency range.'],
  model: {
    equations: [{ tex: 'I(f) = \\frac{V}{\\sqrt{R^2 + \\left(2\\pi fL - \\frac{1}{2\\pi fC}\\right)^2}}', caption: 'Ideal components, 5 V rms supply' }],
    assumptions: ['Ideal L and C (the coil’s own resistance is included in R).', 'Instrument error (when enabled): 0.3% meter noise, least count 0.01 mA.'],
    method: 'The milliammeter reads I(f) from the impedance formula. The analysis finds the peak and half-power points from your readings only (parabolic peak fit and linear interpolation), then compares them with 1/(2π√LC) and (1/R)√(L/C).',
  },
  parameters: [
    { kind: 'range', key: 'frequency', label: 'Frequency f', unit: 'Hz', min: 100, max: 3000, step: 10, default: 500 },
    { kind: 'range', key: 'resistance', label: 'Resistance R', unit: 'Ω', min: 10, max: 200, step: 5, default: 50 },
    { kind: 'range', key: 'inductance', label: 'Inductance L', unit: 'mH', min: 10, max: 100, step: 5, default: 50 },
    { kind: 'range', key: 'capacitance', label: 'Capacitance C', unit: 'µF', min: 0.5, max: 5, step: 0.1, default: 1 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const R = p(prm, 'resistance')
    const L = p(prm, 'inductance') / 1000
    const C = p(prm, 'capacitance') * 1e-6
    const f = p(prm, 'frequency')
    return [
      { label: 'Current', value: fixed(seriesCurrent(SOURCE_V, f, R, L, C) * 1000, 2), unit: 'mA', tone: 'live' },
      { label: 'Impedance Z', value: fixed(seriesImpedance(f, R, L, C), 1), unit: 'Ω', tone: 'theory' },
      { label: 'Resonant frequency f₀', value: fixed(resonantFrequency(L, C), 1), unit: 'Hz', tone: 'theory' },
      { label: 'Quality factor Q', value: fixed(qualityFactor(R, L, C), 2), tone: 'theory' },
    ]
  },
  observation: {
    columns: [
      { key: 'f', label: 'f', unit: 'Hz', decimals: 0 },
      { key: 'I', label: 'I', unit: 'mA', decimals: 2 },
      { key: 'Z', label: 'Z = V/I', unit: 'Ω', decimals: 1 },
    ],
    measureLabel: 'Read current',
    hint: 'Keep R, L, C fixed; sweep the frequency with extra readings near the peak.',
    minTrials: 10,
    controlKeys: ['resistance', 'inductance', 'capacitance'],
    measure: (prm, ctx) => {
      const R = p(prm, 'resistance')
      const L = p(prm, 'inductance') / 1000
      const C = p(prm, 'capacitance') * 1e-6
      const f = p(prm, 'frequency')
      const mA = leastCount(withNoise(seriesCurrent(SOURCE_V, f, R, L, C) * 1000 * (1 + (ctx.noise ? 0.003 * ctx.gauss() : 0)), 0.005, ctx.noise, ctx.gauss), 0.01)
      return { ok: true, row: { f, I: mA, Z: (SOURCE_V / mA) * 1000, resistance: R, inductance: p(prm, 'inductance'), capacitance: p(prm, 'capacitance') } }
    },
  },
  analyze: (rows) => {
    if (rows.length < 3) return null
    const last = rows[rows.length - 1]
    const R = num(last, 'resistance')
    const L = num(last, 'inductance') / 1000
    const C = num(last, 'capacitance') * 1e-6
    const curve = readCurve(rows)
    if (!curve) return null
    const f0th = resonantFrequency(L, C)
    const Qth = qualityFactor(R, L, C)
    const bw = curve.f2 - curve.f1
    const Q = curve.f0 / bw
    const warnings: string[] = []
    if (!Number.isFinite(bw)) warnings.push('Take readings on both sides of the peak, down to below I_max/√2, to find the bandwidth.')
    return {
      x: { label: 'Frequency f', unit: 'Hz' },
      y: { label: 'Current I', unit: 'mA' },
      points: rows.map((r) => ({ x: num(r, 'f'), y: num(r, 'I') })),
      connectPoints: true,
      results: [
        { label: 'Resonant frequency (peak of your curve)', symbol: 'f_0', value: curve.f0, unit: 'Hz', accepted: f0th, acceptedLabel: '1/(2π√LC)', decimals: 1 },
        { label: 'Bandwidth f₂ − f₁', symbol: '\\Delta f', value: bw, unit: 'Hz', accepted: f0th / Qth, decimals: 1 },
        { label: 'Quality factor f₀/Δf', symbol: 'Q', value: Q, unit: '', accepted: Qth, acceptedLabel: '(1/R)√(L/C)', decimals: 2 },
        { label: 'Peak current', symbol: 'I_{\\max}', value: curve.Imax, unit: 'mA', accepted: (SOURCE_V / R) * 1000, acceptedLabel: 'V/R', decimals: 2 },
      ],
      calculations: [
        { label: 'Peak of the curve', tex: `f_0 = ${fixed(curve.f0, 1)}\\ \\mathrm{Hz},\\quad I_{\\max} = ${fixed(curve.Imax, 2)}\\ \\mathrm{mA}` },
        { label: 'Half-power current', tex: `\\frac{I_{\\max}}{\\sqrt2} = ${fixed(curve.Imax / Math.SQRT2, 2)}\\ \\mathrm{mA}` },
        { label: 'Half-power frequencies', tex: `f_1 = ${fixed(curve.f1, 1)}\\ \\mathrm{Hz},\\quad f_2 = ${fixed(curve.f2, 1)}\\ \\mathrm{Hz}` },
        { label: 'Quality factor', tex: `Q = \\frac{f_0}{f_2 - f_1} = \\frac{${fixed(curve.f0, 1)}}{${fixed(bw, 1)}} = ${fixed(Q, 2)}` },
        { label: 'Theory', tex: `f_0 = \\frac{1}{2\\pi\\sqrt{LC}} = ${fixed(f0th, 1)}\\ \\mathrm{Hz},\\quad Q = \\frac1R\\sqrt{\\frac LC} = ${fixed(Qth, 2)}` },
        { label: 'Percentage error in f₀', tex: `${fixed(percentError(curve.f0, f0th), 2)}\\%` },
      ],
      warnings,
      conclusion: `The current rises to a sharp maximum of ${fixed(curve.Imax, 1)} mA at f₀ = ${fixed(curve.f0, 0)} Hz (theory ${fixed(f0th, 0)} Hz), where X_L = X_C. ${Number.isFinite(bw) ? `The bandwidth is ${fixed(bw, 0)} Hz, giving Q = ${fixed(Q, 2)} (theory ${fixed(Qth, 2)}).` : 'Take readings further from the peak to find the bandwidth.'}`,
    }
  },
  viva,
  assistant,
}
