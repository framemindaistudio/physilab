import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { CRYSTALS, g7, probeVoltage, resistivity, resistivityFromReading } from '@/physics/semiconductor/fourProbe'
import { K_EV } from '@/physics/semiconductor/bandGap'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'

export const fourProbe: ExperimentModule = {
  id: 'four-probe',
  number: '18',
  title: 'Energy Gap by Four-Probe Method',
  category: 'semiconductor',
  tagline: 'Measure resistivity with four needles as the crystal heats up — and find its band gap.',
  summary: 'Measure the resistivity of an intrinsic semiconductor with the four-probe method at temperatures up to 160 °C and find the energy gap from ln ρ against 1/T.',
  difficulty: 'Advanced',
  durationMin: 35,
  aim: 'To determine the energy band gap of a semiconductor (germanium) using the four-probe method.',
  objectives: [
    'Measure the voltage across the inner probes for a constant current through the outer probes.',
    'Calculate the resistivity, including the correction for a thin sample.',
    'Show that ln ρ varies linearly with 1/T in the intrinsic region.',
    'Determine the energy gap from the slope.',
  ],
  apparatusList: ['Germanium crystal (thickness 0.5 mm)', 'Four-probe arrangement (spacing s = 2 mm)', 'Oven with temperature controller (up to 160 °C)', 'Constant-current source', 'Digital millivoltmeter'],
  theory: [
    {
      heading: 'Why four probes?',
      body: [
        'Measuring the resistance of a semiconductor with two contacts also measures the large, uncertain resistance of the contacts themselves. With four collinear probes, a constant current I is passed through the outer two and the voltage V is measured across the inner two with a high-resistance meter, so almost no current — and no contact voltage drop — enters the measurement.',
        'For a thin slab (thickness W much less than the probe spacing s) a correction factor G₇ is applied.',
      ],
      formulas: [
        { tex: '\\rho_0 = 2\\pi s\\,\\frac{V}{I}', caption: 'Resistivity for a thick sample' },
        { tex: '\\rho = \\frac{\\rho_0}{G_7(W/s)}, \\qquad G_7 \\approx \\frac{2s}{W}\\ln 2', caption: 'Thin-slab correction' },
      ],
    },
    {
      heading: 'Intrinsic conduction and the energy gap',
      body: [
        'At high temperature a pure semiconductor conducts by electrons thermally excited across the energy gap. The number of carriers — and so the conductivity — rises as e^(−E_g/2kT), so the resistivity falls steeply as the crystal warms.',
        'A graph of ln ρ against 1/T is a straight line whose slope is E_g/2k.',
      ],
      formulas: [
        { tex: '\\rho = A\\,e^{E_g/2kT}', caption: 'Intrinsic resistivity' },
        { tex: 'E_g = 2k \\times \\text{slope of } \\ln\\rho \\text{ vs } \\tfrac1T', caption: 'Energy gap from the graph' },
      ],
    },
  ],
  variables: [
    { symbol: '1/T', name: 'Reciprocal of absolute temperature', unit: 'K⁻¹', role: 'independent' },
    { symbol: 'V', name: 'Inner-probe voltage', unit: 'mV', role: 'dependent' },
    { symbol: 'I', name: 'Constant current', unit: 'mA', role: 'controlled' },
    { symbol: 's,\\ W', name: 'Probe spacing, sample thickness', unit: 'mm', role: 'constant' },
  ],
  procedure: [
    'Choose the crystal and set a constant current (about 5 mA).',
    'Press Start. Set the oven temperature and press “Read voltage”.',
    'Increase the temperature in steps of about 10–15 °C up to 160 °C, recording V each time.',
    'In Analysis, plot ln ρ against 1000/T; E_g = 2k × slope × 1000.',
  ],
  precautions: ['Keep the current constant throughout.', 'Wait for the oven temperature to stabilise before each reading.', 'Do not exceed the maximum oven temperature.'],
  model: {
    equations: [{ tex: 'V = \\frac{\\rho(T)\\,I\\,G_7}{2\\pi s},\\ \\rho(T) = \\rho_{300}\\,e^{\\frac{E_g}{2k}\\left(\\frac1T - \\frac1{300}\\right)}', caption: 'Ge: E_g = 0.66 eV, ρ(300 K) = 0.47 Ω m; InSb: 0.17 eV' }],
    assumptions: ['Intrinsic conduction over the whole range; G₇ = (2s/W) ln 2 with s = 2 mm, W = 0.5 mm.', 'Instrument error (when enabled): 0.1% meter noise, least count 1 µV.'],
    method: 'The millivoltmeter reads V from the intrinsic resistivity model and the four-probe geometry. The analysis converts V back to ρ with the same geometry factor and finds E_g from the slope.',
  },
  parameters: [
    { kind: 'select', key: 'crystal', label: 'Crystal', default: 'germanium', options: Object.entries(CRYSTALS).map(([value, c]) => ({ value, label: c.label })) },
    { kind: 'range', key: 'temperature', label: 'Oven temperature', unit: '°C', min: 30, max: 160, step: 1, default: 30 },
    { kind: 'range', key: 'current', label: 'Current I', unit: 'mA', min: 1, max: 10, step: 0.5, default: 5 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const cr = CRYSTALS[String(prm.crystal)] ?? CRYSTALS.germanium
    const T = p(prm, 'temperature') + 273.15
    return [
      { label: 'Inner-probe voltage', value: fixed(probeVoltage(p(prm, 'current') * 1e-3, T, cr) * 1000, 3), unit: 'mV', tone: 'live' },
      { label: 'Resistivity ρ', value: resistivity(T, cr).toPrecision(3), unit: 'Ω m', tone: 'theory' },
      { label: 'Correction G₇', value: fixed(g7(), 3), tone: 'theory' },
      { label: 'Energy gap', value: fixed(cr.eg, 2), unit: 'eV', tone: 'theory' },
    ]
  },
  observation: {
    columns: [
      { key: 'T_C', label: 'T', unit: '°C', decimals: 0 },
      { key: 'invT', label: '1000/T', unit: 'K⁻¹', decimals: 4 },
      { key: 'V', label: 'V', unit: 'mV', decimals: 3 },
      { key: 'rho', label: 'ρ', unit: 'Ω m', decimals: 5 },
      { key: 'lnrho', label: 'ln ρ', decimals: 4 },
    ],
    measureLabel: 'Read voltage',
    hint: 'Keep the crystal and current fixed; read V from 30 °C to 160 °C.',
    minTrials: 6,
    controlKeys: ['crystal'],
    measure: (prm, ctx) => {
      const cr = CRYSTALS[String(prm.crystal)] ?? CRYSTALS.germanium
      const Tc = p(prm, 'temperature')
      const I = p(prm, 'current') * 1e-3
      const mV = leastCount(withNoise(probeVoltage(I, Tc + 273.15, cr) * 1000 * (1 + (ctx.noise ? 0.001 * ctx.gauss() : 0)), 0.0005, ctx.noise, ctx.gauss), 0.001)
      if (mV <= 0) return { ok: false, error: 'The voltage is below the meter’s resolution. Increase the current.' }
      const rho = resistivityFromReading(mV / 1000, I)
      return { ok: true, row: { T_C: Tc, invT: 1000 / (Tc + 273.15), V: mV, rho, lnrho: Math.log(rho), crystal: String(prm.crystal), current: p(prm, 'current') } }
    },
  },
  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'invT'), y: num(r, 'lnrho') }))
    const fit = linearFit(points)
    if (!fit) return null
    const cr = CRYSTALS[String(rows[rows.length - 1].crystal)] ?? CRYSTALS.germanium
    const eg = 2 * K_EV * fit.slope * 1000
    const egErr = 2 * K_EV * fit.slopeSE * 1000
    const err = percentError(eg, cr.eg)
    return {
      x: { label: '1000/T', unit: 'K⁻¹' },
      y: { label: 'ln ρ', unit: '' },
      points,
      fit,
      results: [{ label: `Energy gap of ${cr.label}`, symbol: 'E_g', value: eg, uncertainty: egErr, unit: 'eV', accepted: cr.eg, acceptedLabel: 'Standard', decimals: 3 }],
      calculations: [
        { label: 'Resistivity (first reading)', tex: `\\rho = \\frac{2\\pi s}{G_7}\\frac{V}{I} = \\frac{2\\pi(2\\times10^{-3})}{${fixed(g7(), 3)}}\\cdot\\frac{${fixed(num(rows[0], 'V'), 3)}\\times10^{-3}}{${num(rows[0], 'current')}\\times10^{-3}} = ${sig(num(rows[0], 'rho'), 4)}\\ \\Omega\\,\\mathrm m` },
        { label: 'Slope of ln ρ vs 1000/T', tex: `\\text{slope} = ${sig(fit.slope, 5)}\\ \\mathrm K` },
        { label: 'Energy gap', tex: `E_g = 2k\\times\\text{slope}\\times1000 = 2(8.617\\times10^{-5})(${fixed(fit.slope * 1000, 1)}) = ${fixed(eg, 3)}\\ \\mathrm{eV}` },
        { label: 'Percentage error', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings: [],
      conclusion: `ln ρ decreases linearly with 1/T (R² = ${fixed(fit.r2, 4)}), showing intrinsic conduction by carriers excited across the gap. The energy gap of ${cr.label} is E_g = ${fixed(eg, 3)} ± ${sig(egErr, 1)} eV (standard ${cr.eg} eV).`,
    }
  },
  viva,
  assistant,
}
