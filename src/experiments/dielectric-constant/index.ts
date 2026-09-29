import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { capacitance, DIELECTRICS, EPSILON_0, FILM_THICKNESS, PLATE_AREA } from '@/physics/electromagnetism/dielectric'
import { chargeVoltage, dischargeVoltage } from '@/physics/electromagnetism/rc'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'
import { V0 } from './model'

export const dielectricConstant: ExperimentModule = {
  id: 'dielectric-constant',
  number: '22',
  title: 'Dielectric Constant by Charging and Discharging',
  category: 'electromagnetism',
  tagline: 'Time a capacitor filling and emptying to find what its dielectric is made of.',
  summary: 'Record the voltage of a film capacitor while it charges or discharges through a large resistor, find the time constant, the capacitance and the dielectric constant of the film.',
  difficulty: 'Intermediate',
  durationMin: 30,
  aim: 'To determine the dielectric constant of the material in a capacitor by charging and discharging it through a resistor.',
  objectives: [
    'Record the voltage across a capacitor during charging and discharging through a known resistor.',
    'Show that the charge and discharge are exponential with time constant τ = RC.',
    'Find C from τ.',
    'Calculate the dielectric constant κ = C d / (ε₀ A).',
  ],
  apparatusList: ['Film capacitor (plate area 2.0 m², film thickness 20 µm)', 'High resistors (1–10 MΩ)', '10 V DC supply and two-way switch', 'High-impedance digital voltmeter', 'Stopwatch'],
  theory: [
    {
      heading: 'Dielectrics increase capacitance',
      body: [
        'Filling the space between capacitor plates with an insulator (a dielectric) increases the capacitance. The applied field lines up the molecules’ dipoles, and their bound charges partly cancel the field, so more charge can be stored at the same voltage.',
        'The factor by which the capacitance increases is the dielectric constant (relative permittivity) κ.',
      ],
      formulas: [
        { tex: 'C = \\frac{\\kappa\\,\\varepsilon_0 A}{d}', caption: 'Parallel-plate capacitor with a dielectric' },
        { tex: '\\kappa = \\frac{C\\,d}{\\varepsilon_0 A}', caption: 'Dielectric constant' },
      ],
    },
    {
      heading: 'Charging and discharging through a resistor',
      body: [
        'Through a resistor R the capacitor charges and discharges exponentially with time constant τ = RC. For discharge ln V falls linearly with t; for charging ln(V₀ − V) does.',
        'Either straight line has slope −1/τ, so C = τ/R.',
      ],
      formulas: [
        { tex: 'V = V_0\\left(1 - e^{-t/RC}\\right)\\ \\text{(charging)}, \\qquad V = V_0\\,e^{-t/RC}\\ \\text{(discharging)}', caption: 'Charge and discharge' },
        { tex: '\\ln V\\ \\text{or}\\ \\ln(V_0 - V) = \\text{const} - \\frac{t}{RC}', caption: 'Linear forms' },
      ],
    },
  ],
  variables: [
    { symbol: 't', name: 'Time', unit: 's', role: 'independent' },
    { symbol: 'V', name: 'Capacitor voltage', unit: 'V', role: 'dependent' },
    { symbol: 'R', name: 'Resistance', unit: 'MΩ', role: 'controlled' },
    { symbol: 'A,\\ d', name: 'Plate area, film thickness', unit: 'm², µm', role: 'constant' },
  ],
  procedure: [
    'Choose the capacitor’s dielectric (treat it as unknown), the resistor and the mode (charge or discharge).',
    'Press Start to watch the curve. Choose a reading time t and press “Read voltmeter”.',
    'Take readings at regular intervals over about three time constants.',
    'In Analysis, plot ln V (discharge) or ln(V₀ − V) (charge) against t; τ = −1/slope, C = τ/R, κ = Cd/(ε₀A).',
  ],
  precautions: ['Use a voltmeter whose resistance is much larger than R.', 'Start the stopwatch exactly when the switch is thrown.', 'Fully discharge the capacitor before a charging run.'],
  model: {
    equations: [{ tex: 'C = \\frac{\\kappa\\varepsilon_0 A}{d},\\ A = 2.0\\ \\mathrm{m^2},\\ d = 20\\ \\mu\\mathrm m', caption: 'Rolled film capacitor' }],
    assumptions: ['Ideal capacitor (no leakage); supply 10 V.', 'Instrument error (when enabled): timing σ ≈ 0.2 s, voltmeter noise ±5 mV, least count 0.01 V.'],
    method: 'The voltmeter reads the charge or discharge curve for C = κε₀A/d at the chosen time. The analysis linearises your readings, finds τ from the slope and works back to κ.',
  },
  parameters: [
    { kind: 'select', key: 'dielectric', label: 'Capacitor dielectric', default: 'polyester', options: Object.entries(DIELECTRICS).map(([value, d]) => ({ value, label: d.label })) },
    {
      kind: 'select',
      key: 'mode',
      label: 'Mode',
      default: 'discharge',
      options: [
        { value: 'discharge', label: 'Discharging' },
        { value: 'charge', label: 'Charging' },
      ],
    },
    { kind: 'range', key: 'resistance', label: 'Resistance R', unit: 'MΩ', min: 1, max: 10, step: 0.5, default: 5 },
    { kind: 'range', key: 'time', label: 'Reading time t', unit: 's', min: 0, max: 150, step: 1, default: 5 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const d = DIELECTRICS[String(prm.dielectric)] ?? DIELECTRICS.polyester
    const C = capacitance(d.k)
    const R = p(prm, 'resistance') * 1e6
    const t = p(prm, 'time')
    const V = prm.mode === 'charge' ? chargeVoltage(t, V0, R, C) : dischargeVoltage(t, V0, R, C)
    return [
      { label: 'Voltage at t', value: fixed(V, 3), unit: 'V', tone: 'live' },
      { label: 'Time constant RC', value: fixed(R * C, 2), unit: 's', tone: 'theory' },
      { label: 'Air-filled capacitance ε₀A/d', value: fixed(((EPSILON_0 * PLATE_AREA) / FILM_THICKNESS) * 1e6, 3), unit: 'µF', tone: 'theory' },
      { label: 'Supply V₀', value: fixed(V0, 1), unit: 'V', tone: 'theory' },
    ]
  },
  observation: {
    columns: [
      { key: 't', label: 't', unit: 's', decimals: 0 },
      { key: 'V', label: 'V', unit: 'V', decimals: 2 },
      { key: 'y', label: 'ln V or ln(V₀−V)', decimals: 4 },
    ],
    measureLabel: 'Read voltmeter',
    hint: 'Keep the capacitor, resistor and mode fixed; read at regular times over about 3τ.',
    minTrials: 6,
    controlKeys: ['dielectric', 'resistance', 'mode'],
    measure: (prm, ctx) => {
      const d = DIELECTRICS[String(prm.dielectric)] ?? DIELECTRICS.polyester
      const C = capacitance(d.k)
      const R = p(prm, 'resistance') * 1e6
      const t = p(prm, 'time')
      const charge = prm.mode === 'charge'
      const ta = ctx.noise ? Math.max(0, t + 0.2 * ctx.gauss()) : t
      const V = leastCount(withNoise(charge ? chargeVoltage(ta, V0, R, C) : dischargeVoltage(ta, V0, R, C), 0.005, ctx.noise, ctx.gauss), 0.01)
      const gap = charge ? V0 - V : V
      if (gap < 0.1) return { ok: false, error: `The capacitor is almost ${charge ? 'fully charged' : 'empty'} — choose an earlier time (less than about 4RC = ${(4 * R * C).toFixed(0)} s).` }
      return { ok: true, row: { t, V, y: Math.log(gap), dielectric: String(prm.dielectric), resistance: p(prm, 'resistance'), mode: String(prm.mode) } }
    },
  },
  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 't'), y: num(r, 'y') }))
    const fit = linearFit(points)
    if (!fit || fit.slope >= 0) return null
    const last = rows[rows.length - 1]
    const d = DIELECTRICS[String(last.dielectric)] ?? DIELECTRICS.polyester
    const R = num(last, 'resistance') * 1e6
    const tau = -1 / fit.slope
    const C = tau / R
    const k = (C * FILM_THICKNESS) / (EPSILON_0 * PLATE_AREA)
    const kErr = k * (fit.slopeSE / Math.abs(fit.slope))
    const charge = last.mode === 'charge'
    return {
      x: { label: 'Time t', unit: 's' },
      y: { label: charge ? 'ln(V₀ − V)' : 'ln V', unit: '' },
      points,
      fit,
      results: [
        { label: `Dielectric constant of the ${d.label.toLowerCase()} film`, symbol: '\\kappa', value: k, uncertainty: kErr, unit: '', accepted: d.k, acceptedLabel: 'Handbook', decimals: 2 },
        { label: 'Capacitance C = τ/R', symbol: 'C', value: C * 1e6, unit: 'µF', accepted: capacitance(d.k) * 1e6, decimals: 3 },
        { label: 'Time constant', symbol: '\\tau', value: tau, unit: 's', decimals: 2 },
      ],
      calculations: [
        { label: 'Slope', tex: `\\text{slope} = -\\frac{1}{\\tau} = ${sig(fit.slope, 4)}\\ \\mathrm{s^{-1}} \\Rightarrow \\tau = ${fixed(tau, 2)}\\ \\mathrm s` },
        { label: 'Capacitance', tex: `C = \\frac{\\tau}{R} = \\frac{${fixed(tau, 2)}}{${R / 1e6}\\times10^{6}} = ${fixed(C * 1e6, 3)}\\ \\mu\\mathrm F` },
        { label: 'Dielectric constant', tex: `\\kappa = \\frac{Cd}{\\varepsilon_0 A} = \\frac{(${fixed(C * 1e6, 3)}\\times10^{-6})(20\\times10^{-6})}{(8.854\\times10^{-12})(2.0)} = ${fixed(k, 2)}` },
        { label: 'Percentage error', tex: `${fixed(percentError(k, d.k), 2)}\\%` },
      ],
      warnings: [],
      conclusion: `The ${charge ? 'charging' : 'discharge'} is exponential (R² = ${fixed(fit.r2, 4)}) with τ = ${fixed(tau, 2)} s, giving C = ${fixed(C * 1e6, 2)} µF and a dielectric constant κ = ${fixed(k, 2)} for the ${d.label.toLowerCase()} film (handbook ${d.k}).`,
    }
  },
  viva,
  assistant,
}
