import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { dischargeVoltage, timeConstant } from '@/physics/electromagnetism/rc'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'

export const rcCircuit: ExperimentModule = {
  id: 'rc-circuit',
  number: '11',
  title: 'RC Circuit — Capacitor Discharge',
  category: 'electromagnetism',
  tagline: 'Watch a capacitor’s voltage decay exponentially and measure its time constant.',
  summary: 'Record the voltage across a discharging capacitor at different times, plot ln V against t, and find the time constant τ = RC and the capacitance.',
  difficulty: 'Introductory',
  durationMin: 25,
  aim: 'To study the discharge of a capacitor through a resistor and determine the time constant and capacitance.',
  objectives: [
    'Charge a capacitor and let it discharge through a resistor.',
    'Record the voltage across the capacitor at regular time intervals.',
    'Show that the voltage decays exponentially: ln V against t is a straight line.',
    'Determine τ = RC from the slope and hence the capacitance.',
  ],
  apparatusList: ['DC supply', 'Electrolytic capacitor (100–1000 µF)', 'Resistor (10–100 kΩ)', 'Two-way switch', 'High-resistance digital voltmeter', 'Stopwatch'],
  theory: [
    {
      heading: 'Exponential decay',
      body: [
        'While discharging, the current I = V/R carries charge off the capacitor, and V = Q/C falls. The rate of loss is proportional to the charge still there, which is the signature of exponential decay.',
        'After one time constant τ = RC the voltage has fallen to 1/e ≈ 37% of its starting value; after 5τ it is below 1%.',
      ],
      formulas: [
        { tex: '\\frac{dQ}{dt} = -\\frac{Q}{RC}', caption: 'Discharge equation' },
        { tex: 'V = V_0\\,e^{-t/RC}', caption: 'Voltage across the capacitor' },
      ],
    },
    {
      heading: 'Straight-line graph and τ',
      body: [
        'Taking natural logarithms turns the curve into a straight line. The slope of ln V against t is −1/τ, and the intercept is ln V₀.',
        'The half-life of the discharge is τ ln 2 ≈ 0.69 τ.',
      ],
      formulas: [
        { tex: '\\ln V = \\ln V_0 - \\frac{t}{\\tau}', caption: 'Linear form' },
        { tex: '\\tau = RC = -\\frac{1}{\\text{slope}}, \\qquad C = \\frac{\\tau}{R}', caption: 'Time constant and capacitance' },
      ],
    },
  ],
  variables: [
    { symbol: 't', name: 'Time since discharge began', unit: 's', role: 'independent' },
    { symbol: 'V', name: 'Voltage across the capacitor', unit: 'V', role: 'dependent' },
    { symbol: 'R', name: 'Resistance', unit: 'kΩ', role: 'controlled' },
    { symbol: 'C', name: 'Capacitance', unit: 'µF', role: 'controlled' },
  ],
  procedure: [
    'Choose R, C and the charging voltage, and keep them fixed.',
    'Press Start to watch the discharge. Then choose a reading time t and press “Read voltmeter”.',
    'Take readings at regular intervals, e.g. every 5 s, over about three time constants.',
    'In Analysis, plot ln V against t. τ = −1/slope and C = τ/R.',
  ],
  precautions: ['Use a voltmeter with a resistance much larger than R.', 'Connect an electrolytic capacitor with the correct polarity.', 'Start the stopwatch exactly when the switch is thrown.'],
  model: {
    equations: [{ tex: 'V(t) = V_0 e^{-t/RC}', caption: 'Ideal capacitor and resistor' }],
    assumptions: ['Ideal voltmeter (no loading), no leakage.', 'Instrument error (when enabled): timing σ ≈ 0.2 s, voltmeter noise ±5 mV, least count 0.01 V.'],
    method: 'Each reading evaluates V(t) at the chosen time plus a small timing error, then applies the voltmeter noise and least count. The live trace and the reading use the same function.',
  },
  parameters: [
    { kind: 'range', key: 'time', label: 'Reading time t', unit: 's', min: 0, max: 150, step: 1, default: 10 },
    { kind: 'range', key: 'resistance', label: 'Resistance R', unit: 'kΩ', min: 10, max: 100, step: 1, default: 47 },
    { kind: 'range', key: 'capacitance', label: 'Capacitance C', unit: 'µF', min: 100, max: 1000, step: 10, default: 470 },
    { kind: 'range', key: 'v0', label: 'Charging voltage V₀', unit: 'V', min: 5, max: 12, step: 0.5, default: 9 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const R = p(prm, 'resistance') * 1e3
    const C = p(prm, 'capacitance') * 1e-6
    const tau = timeConstant(R, C)
    return [
      { label: 'Time constant τ = RC', value: fixed(tau, 2), unit: 's', tone: 'theory' },
      { label: 'Half-life τ ln 2', value: fixed(tau * Math.LN2, 2), unit: 's', tone: 'theory' },
      { label: 'Voltage at t', value: fixed(dischargeVoltage(p(prm, 'time'), p(prm, 'v0'), R, C), 3), unit: 'V', tone: 'live' },
      { label: 'Current at t', value: fixed((dischargeVoltage(p(prm, 'time'), p(prm, 'v0'), R, C) / R) * 1e6, 1), unit: 'µA', tone: 'theory' },
    ]
  },
  observation: {
    columns: [
      { key: 't', label: 't', unit: 's', decimals: 0 },
      { key: 'V', label: 'V', unit: 'V', decimals: 2 },
      { key: 'lnV', label: 'ln V', decimals: 4 },
    ],
    measureLabel: 'Read voltmeter',
    hint: 'Keep R, C and V₀ fixed; read at regular times over about three time constants.',
    minTrials: 6,
    controlKeys: ['resistance', 'capacitance', 'v0'],
    measure: (prm, ctx) => {
      const R = p(prm, 'resistance') * 1e3
      const C = p(prm, 'capacitance') * 1e-6
      const V0 = p(prm, 'v0')
      const t = p(prm, 'time')
      const tActual = ctx.noise ? Math.max(0, t + 0.2 * ctx.gauss()) : t
      const V = leastCount(withNoise(dischargeVoltage(tActual, V0, R, C), 0.005, ctx.noise, ctx.gauss), 0.01)
      if (V < 0.1) return { ok: false, error: `Only ${V.toFixed(2)} V is left — too small to read accurately. Choose an earlier time (less than about 4τ = ${(4 * R * C).toFixed(0)} s).` }
      return { ok: true, row: { t, V, lnV: Math.log(V), resistance: p(prm, 'resistance'), capacitance: p(prm, 'capacitance'), v0: V0 } }
    },
  },
  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 't'), y: num(r, 'lnV') }))
    const fit = linearFit(points)
    if (!fit || fit.slope >= 0) return null
    const last = rows[rows.length - 1]
    const R = num(last, 'resistance') * 1e3
    const Cset = num(last, 'capacitance')
    const tau = -1 / fit.slope
    const tauErr = (tau * fit.slopeSE) / Math.abs(fit.slope)
    const C = (tau / R) * 1e6
    const err = percentError(C, Cset)
    return {
      x: { label: 'Time t', unit: 's' },
      y: { label: 'ln V', unit: '' },
      points,
      fit,
      results: [
        { label: 'Time constant τ = −1/slope', symbol: '\\tau', value: tau, uncertainty: tauErr, unit: 's', accepted: (R * Cset) / 1e6, acceptedLabel: 'R × C', decimals: 2 },
        { label: 'Capacitance C = τ/R', symbol: 'C', value: C, unit: 'µF', accepted: Cset, acceptedLabel: 'Marked value', decimals: 1 },
        { label: 'Initial voltage from intercept', symbol: 'V_0', value: Math.exp(fit.intercept), unit: 'V', accepted: num(last, 'v0'), decimals: 2 },
      ],
      calculations: [
        { label: 'Slope of ln V vs t', tex: `\\text{slope} = -\\frac{1}{\\tau} = ${sig(fit.slope, 4)}\\ \\mathrm{s^{-1}}` },
        { label: 'Time constant', tex: `\\tau = -\\frac{1}{\\text{slope}} = ${fixed(tau, 2)}\\ \\mathrm s` },
        { label: 'Capacitance', tex: `C = \\frac{\\tau}{R} = \\frac{${fixed(tau, 2)}}{${R / 1e3}\\times10^{3}} = ${fixed(C, 1)}\\ \\mu\\mathrm F` },
        { label: 'Initial voltage', tex: `V_0 = e^{c} = e^{${fixed(fit.intercept, 3)}} = ${fixed(Math.exp(fit.intercept), 2)}\\ \\mathrm V` },
        { label: 'Percentage error in C', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings: [],
      conclusion: `ln V falls linearly with time (R² = ${fixed(fit.r2, 4)}), so the capacitor discharges exponentially, V = V₀e^(−t/RC). The time constant is τ = ${fixed(tau, 2)} ± ${sig(tauErr, 1)} s, giving C = ${fixed(C, 0)} µF (marked ${Cset} µF).`,
    }
  },
  viva,
  assistant,
}
