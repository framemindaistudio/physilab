import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { solveCircuit, type Device } from '@/physics/electromagnetism/ohm'
import { leastCount } from '@/utils/random'
import { linearFit, mean, percentError, stdDev } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'

const DEVICE_LABEL: Record<Device, string> = {
  resistor: 'Carbon resistor',
  lamp: 'Filament lamp',
  diode: 'Silicon diode',
}

export const ohmsLaw: ExperimentModule = {
  id: 'ohms-law',
  number: '03',
  title: "Ohm's Law",
  category: 'electromagnetism',
  tagline: 'Is V/I really constant? Test a resistor, a lamp and a diode.',
  summary:
    'Vary the supply, record voltmeter and ammeter readings, plot the I–V characteristic and determine the resistance — then see why a lamp and a diode are non-ohmic.',
  difficulty: 'Introductory',
  durationMin: 20,

  aim: 'To verify Ohm’s law for a metallic resistor, determine its resistance from the I–V graph, and compare it with non-ohmic devices.',
  objectives: [
    'Measure the current through a resistor for different potential differences across it.',
    'Plot the I–V characteristic and verify that it is a straight line through the origin.',
    'Determine the resistance from the slope of the graph.',
    'Show that a filament lamp and a diode do not obey Ohm’s law.',
  ],
  apparatusList: [
    'Regulated DC supply 0–12 V with rheostat',
    'Unknown resistor / filament lamp / silicon diode',
    'DC voltmeter 0–15 V (least count 0.01 V)',
    'DC milliammeter (least count 0.1 mA)',
    'Connecting wires and plug key',
  ],
  theory: [
    {
      heading: 'Ohm’s law',
      body: [
        'At constant temperature and other physical conditions, the current I through a metallic conductor is directly proportional to the potential difference V across its ends. The constant of proportionality is the resistance R, measured in ohms (Ω).',
        'An I–V graph for an ohmic conductor is therefore a straight line through the origin with slope 1/R.',
      ],
      formulas: [
        { tex: 'V = IR', caption: 'Ohm’s law' },
        { tex: 'I = \\frac{1}{R}\\,V \\quad\\Rightarrow\\quad R = \\frac{1}{\\text{slope of } I\\text{–}V}', caption: 'Resistance from the I–V graph' },
      ],
    },
    {
      heading: 'Why it works: the Drude picture',
      body: [
        'In a metal, free electrons drift under the applied field with a small drift velocity proportional to the field, repeatedly scattering off vibrating ions. The current density J = σE, where the conductivity σ depends on the material and its temperature, not on V.',
      ],
      formulas: [
        { tex: 'R = \\frac{\\rho L}{A}', caption: 'Resistance from resistivity, length and cross-section' },
        { tex: 'P = VI = I^2R = \\frac{V^2}{R}', caption: 'Power dissipated' },
      ],
    },
    {
      heading: 'Non-ohmic devices',
      body: [
        'A tungsten filament gets hotter as more power is dissipated. Its resistivity rises with temperature, so V/I increases along the curve: the I–V graph bends towards the V-axis.',
        'A p–n junction diode conducts almost nothing until the forward voltage reaches about 0.6–0.7 V (the knee), after which the current rises exponentially — described by the Shockley equation.',
      ],
      formulas: [
        { tex: 'R_{\\text{lamp}} = R_0\\,(1 + \\kappa P)', caption: 'Filament heating model' },
        { tex: 'I = I_s\\left(e^{V/nV_T} - 1\\right), \\quad V_T = \\frac{k_BT}{e}', caption: 'Shockley diode equation' },
      ],
    },
  ],
  variables: [
    { symbol: 'V', name: 'Potential difference across device', unit: 'V', role: 'independent' },
    { symbol: 'I', name: 'Current through device', unit: 'mA', role: 'dependent' },
    { symbol: 'R', name: 'Resistance', unit: 'Ω', role: 'controlled' },
    { symbol: 'T', name: 'Temperature (resistor)', unit: 'K', role: 'constant' },
  ],
  procedure: [
    'Choose “Carbon resistor” and set its resistance. The voltmeter is in parallel with the device, the ammeter in series.',
    'Press Start to close the circuit. Set the supply to about 1 V and press “Record reading”.',
    'Increase the supply in steps of 1–2 V up to 12 V, recording V and I each time. Take at least six readings.',
    'In Analysis, plot I against V and find R = 1/slope.',
    'Repeat with the filament lamp and the diode (clear the table or keep going — only rows matching the latest device are graphed).',
  ],
  precautions: [
    'Connect the ammeter in series and the voltmeter in parallel, observing polarity.',
    'Pass current only while taking readings so the resistor does not heat up.',
    'Start with the rheostat at its minimum output.',
    'Never connect a diode across the supply without a current-limiting resistor.',
  ],
  model: {
    equations: [
      { tex: 'V_s = V + I\\,(r + R_{\\text{series}})', caption: 'Kirchhoff’s voltage law for the loop (r = 0.5 Ω internal)' },
      { tex: 'I = f(V)\\ \\text{for the chosen device}', caption: 'Resistor, lamp or Shockley diode' },
    ],
    assumptions: [
      'Ideal voltmeter (infinite resistance) and ammeter (zero resistance).',
      'The resistor stays at room temperature; the lamp heats according to R = R₀(1 + κP) with R₀ = 2 Ω, κ = 5 W⁻¹.',
      'Diode: I_s = 4 nA, n = 1.9, T = 300 K, with a 100 Ω series resistor.',
      'Instrument error (when enabled): ±1 digit flicker and 0.2% gain error on both meters.',
    ],
    method:
      'For each supply setting the loop equation is solved numerically (bisection) for the operating point of the device. The meters display that solution, the animation speed follows the same current, and a reading records exactly what the meters show.',
  },

  parameters: [
    {
      kind: 'select',
      key: 'device',
      label: 'Device under test',
      default: 'resistor',
      options: [
        { value: 'resistor', label: DEVICE_LABEL.resistor },
        { value: 'lamp', label: DEVICE_LABEL.lamp },
        { value: 'diode', label: DEVICE_LABEL.diode },
      ],
    },
    { kind: 'range', key: 'supply', label: 'Supply voltage Vs', unit: 'V', min: 0, max: 12, step: 0.1, default: 3 },
    {
      kind: 'range',
      key: 'resistance',
      label: 'Resistance R',
      unit: 'Ω',
      min: 10,
      max: 200,
      step: 5,
      default: 47,
      visible: (prm) => prm.device === 'resistor',
    },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const s = solveCircuit(p(prm, 'supply'), String(prm.device) as Device, p(prm, 'resistance'))
    return [
      { label: 'Voltmeter', value: fixed(s.V, 3), unit: 'V', tone: 'live' },
      { label: 'Ammeter', value: fixed(s.I * 1000, 2), unit: 'mA', tone: 'live' },
      { label: 'V / I', value: Number.isFinite(s.R) ? fixed(s.R, 2) : '∞', unit: 'Ω', tone: 'theory' },
      { label: 'Power in device', value: fixed(s.P * 1000, 1), unit: 'mW', tone: 'theory' },
    ]
  },

  observation: {
    columns: [
      { key: 'Vs', label: 'Supply', unit: 'V', decimals: 1 },
      { key: 'V', label: 'V', unit: 'V', decimals: 2 },
      { key: 'I', label: 'I', unit: 'mA', decimals: 1 },
      { key: 'ratio', label: 'V/I', unit: 'Ω', decimals: 1 },
    ],
    measureLabel: 'Record reading',
    hint: 'Change the supply voltage between readings. Six or more readings from ~1 V to 12 V.',
    minTrials: 6,
    controlKeys: ['device', 'resistance'],
    measure: (prm, ctx) => {
      const Vs = p(prm, 'supply')
      const device = String(prm.device) as Device
      const R = p(prm, 'resistance')
      const s = solveCircuit(Vs, device, R)
      const V = Math.max(0, leastCount(withNoise(s.V * (1 + (ctx.noise ? 0.002 * ctx.gauss() : 0)), 0.005, ctx.noise, ctx.gauss), 0.01))
      const ImA = Math.max(0, leastCount(withNoise(s.I * 1000 * (1 + (ctx.noise ? 0.002 * ctx.gauss() : 0)), 0.05, ctx.noise, ctx.gauss), 0.1))
      if (Vs === 0) return { ok: false, error: 'The supply is at 0 V — there is nothing to measure. Raise the supply voltage.' }
      return {
        ok: true,
        row: {
          device,
          resistance: device === 'resistor' ? R : 0,
          Vs,
          V,
          I: ImA,
          ratio: ImA > 0 ? (V / ImA) * 1000 : NaN,
        },
      }
    },
  },

  analyze: (rows) => {
    const device = String(rows[rows.length - 1].device) as Device
    const pts = rows.map((r) => ({ x: num(r, 'V'), y: num(r, 'I') })).sort((a, b) => a.x - b.x)
    const conducting = rows.filter((r) => num(r, 'I') > 0)
    const ratios = conducting.map((r) => num(r, 'ratio'))

    if (device === 'resistor') {
      const fit = linearFit(pts)
      if (!fit) return null
      const Rg = 1000 / fit.slope
      const Rerr = (Rg * fit.slopeSE) / Math.abs(fit.slope)
      const nominal = num(rows[rows.length - 1], 'resistance')
      const Rmean = mean(ratios)
      const err = percentError(Rg, nominal)
      return {
        x: { label: 'Potential difference V', unit: 'V' },
        y: { label: 'Current I', unit: 'mA' },
        points: pts,
        fit,
        results: [
          { label: 'Resistance from slope of I–V graph', symbol: 'R', value: Rg, uncertainty: Rerr, unit: 'Ω', accepted: nominal, acceptedLabel: 'Colour-code value', decimals: 2 },
          { label: 'Mean of V/I over all readings', symbol: '\\overline{V/I}', value: Rmean, unit: 'Ω', accepted: nominal, decimals: 2 },
        ],
        calculations: [
          { label: 'Slope of the I–V line', tex: `\\text{slope} = \\frac{\\Delta I}{\\Delta V} = ${sig(fit.slope, 4)}\\ \\mathrm{mA\\,V^{-1}}` },
          { label: 'Resistance', tex: `R = \\frac{1}{\\text{slope}} = \\frac{1000}{${sig(fit.slope, 4)}}\\ \\Omega = ${fixed(Rg, 2)}\\ \\Omega` },
          { label: 'Uncertainty from the fit', tex: `\\Delta R = R\\,\\frac{\\sigma_{\\text{slope}}}{\\text{slope}} = ${sig(Rerr, 2)}\\ \\Omega` },
          { label: 'Intercept (ideally zero)', tex: `c = ${fixed(fit.intercept, 3)}\\ \\mathrm{mA}` },
          { label: 'Percentage error', tex: `\\frac{|R - R_0|}{R_0}\\times100 = ${fixed(err, 2)}\\%` },
        ],
        warnings: [],
        conclusion: `The I–V graph of the resistor is a straight line through the origin (R² = ${fixed(fit.r2, 5)}), so the current is directly proportional to the potential difference — Ohm’s law is verified. The resistance is R = ${fixed(Rg, 1)} ± ${sig(Rerr, 1)} Ω, within ${fixed(err, 1)}% of the nominal ${nominal} Ω.`,
      }
    }

    if (device === 'lamp') {
      if (conducting.length < 2) return null
      const lo = conducting.reduce((a, b) => (num(b, 'I') < num(a, 'I') ? b : a))
      const hi = conducting.reduce((a, b) => (num(b, 'I') > num(a, 'I') ? b : a))
      const cv = (stdDev(ratios) / mean(ratios)) * 100
      return {
        x: { label: 'Potential difference V', unit: 'V' },
        y: { label: 'Current I', unit: 'mA' },
        points: pts,
        connectPoints: true,
        results: [
          { label: 'V/I at the lowest current', symbol: 'R_{\\text{cold}}', value: num(lo, 'ratio'), unit: 'Ω', decimals: 2 },
          { label: 'V/I at the highest current', symbol: 'R_{\\text{hot}}', value: num(hi, 'ratio'), unit: 'Ω', decimals: 2 },
          { label: 'Spread of V/I (coefficient of variation)', symbol: 'CV', value: cv, unit: '%', decimals: 1 },
        ],
        calculations: [
          { label: 'Resistance at low current', tex: `R = \\frac{V}{I} = \\frac{${fixed(num(lo, 'V'), 2)}\\ \\mathrm V}{${fixed(num(lo, 'I'), 1)}\\ \\mathrm{mA}} = ${fixed(num(lo, 'ratio'), 2)}\\ \\Omega` },
          { label: 'Resistance at high current', tex: `R = \\frac{V}{I} = \\frac{${fixed(num(hi, 'V'), 2)}\\ \\mathrm V}{${fixed(num(hi, 'I'), 1)}\\ \\mathrm{mA}} = ${fixed(num(hi, 'ratio'), 2)}\\ \\Omega` },
          { label: 'Increase in resistance', tex: `\\frac{R_{\\text{hot}}}{R_{\\text{cold}}} = ${fixed(num(hi, 'ratio') / num(lo, 'ratio'), 2)}` },
        ],
        warnings: [],
        conclusion: `The I–V curve of the filament lamp bends towards the voltage axis: V/I rises from ${fixed(num(lo, 'ratio'), 1)} Ω to ${fixed(num(hi, 'ratio'), 1)} Ω as the filament heats up. The ratio is not constant (CV = ${fixed(cv, 0)}%), so the lamp is a non-ohmic device.`,
      }
    }

    // Diode
    if (pts.length < 2) return null
    let knee = NaN
    for (let i = 1; i < pts.length; i++) {
      if (pts[i - 1].y < 1 && pts[i].y >= 1) {
        const f = (1 - pts[i - 1].y) / (pts[i].y - pts[i - 1].y)
        knee = pts[i - 1].x + f * (pts[i].x - pts[i - 1].x)
      }
    }
    const a = pts[pts.length - 2]
    const b = pts[pts.length - 1]
    const rd = b.y !== a.y ? ((b.x - a.x) / (b.y - a.y)) * 1000 : NaN
    const warnings = Number.isFinite(knee) ? [] : ['Take readings on both sides of ~0.6 V (supply 0.5–2 V) to locate the knee voltage.']
    return {
      x: { label: 'Forward voltage V', unit: 'V' },
      y: { label: 'Forward current I', unit: 'mA' },
      points: pts,
      connectPoints: true,
      results: [
        { label: 'Knee voltage (current reaches 1 mA)', symbol: 'V_{\\text{knee}}', value: knee, unit: 'V', decimals: 3 },
        { label: 'Dynamic resistance at the highest current', symbol: 'r_d', value: rd, unit: 'Ω', decimals: 2 },
      ],
      calculations: [
        { label: 'Knee voltage by interpolation', tex: `V_{\\text{knee}} \\approx ${fixed(knee, 3)}\\ \\mathrm V` },
        { label: 'Dynamic resistance', tex: `r_d = \\frac{\\Delta V}{\\Delta I} = \\frac{${fixed(b.x - a.x, 3)}\\ \\mathrm V}{${fixed(b.y - a.y, 2)}\\ \\mathrm{mA}} = ${fixed(rd, 2)}\\ \\Omega` },
      ],
      warnings,
      conclusion: `The diode conducts negligibly below about ${fixed(knee, 2)} V, after which the current rises steeply (exponentially). The I–V characteristic is not a straight line, so a p–n junction diode is non-ohmic.`,
    }
  },
  viva,
}
