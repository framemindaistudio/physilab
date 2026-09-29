import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { K_EV, MATERIALS, saturationCurrent } from '@/physics/semiconductor/bandGap'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'

export const bandGap: ExperimentModule = {
  id: 'band-gap',
  number: '13',
  title: 'Energy Band Gap of a Semiconductor',
  category: 'semiconductor',
  tagline: 'Heat a diode, watch its leakage current climb, and read off the band gap.',
  summary: 'Measure the reverse saturation current of a p–n junction at different temperatures and determine the band gap from the slope of ln(I_s/T³) against 1/T.',
  difficulty: 'Advanced',
  durationMin: 30,
  aim: 'To determine the energy band gap of a semiconductor using a p–n junction diode.',
  objectives: [
    'Measure the reverse saturation current of a diode as its temperature is raised.',
    'Understand why thermally generated carriers make I_s rise steeply with temperature.',
    'Plot ln(I_s/T³) against 1/T and show that it is a straight line.',
    'Determine the band gap E_g from the slope.',
  ],
  apparatusList: ['p–n junction diode (Si or Ge)', 'Oil bath with heater', 'Thermometer (0–100 °C)', 'DC supply for reverse bias', 'Nano/micro-ammeter'],
  theory: [
    {
      heading: 'Band gap and intrinsic carriers',
      body: [
        'In a semiconductor the filled valence band and the empty conduction band are separated by a forbidden energy gap E_g. At a temperature T, thermal energy lifts a few electrons across the gap, leaving holes behind.',
        'The chance of an electron crossing depends on the Boltzmann factor e^(−E_g/kT), so the number of carriers — and the reverse current of a diode, which they carry — rises extremely rapidly with temperature.',
      ],
      formulas: [
        { tex: 'n_i \\propto T^{3/2}\\,e^{-E_g/2kT}', caption: 'Intrinsic carrier concentration' },
        { tex: 'I_s = C\\,T^3\\,e^{-E_g/kT}', caption: 'Reverse saturation current (I_s ∝ n_i²)' },
      ],
    },
    {
      heading: 'Finding E_g from the graph',
      body: [
        'Taking logarithms gives a straight line when ln(I_s/T³) is plotted against 1/T. Its slope is −E_g/k.',
        'Many lab manuals plot ln I_s (ignoring the T³ term). That is simpler but adds about 3kT (≈ 0.09 eV) to the answer — the analysis shows both.',
      ],
      formulas: [
        { tex: '\\ln\\frac{I_s}{T^3} = \\ln C - \\frac{E_g}{k}\\cdot\\frac{1}{T}', caption: 'Linear form' },
        { tex: 'E_g = -k\\times\\text{slope}', caption: 'Band gap (k = 8.617 × 10⁻⁵ eV/K)' },
      ],
    },
  ],
  variables: [
    { symbol: '1/T', name: 'Reciprocal of absolute temperature', unit: 'K⁻¹', role: 'independent' },
    { symbol: 'I_s', name: 'Reverse saturation current', unit: 'nA', role: 'dependent' },
    { symbol: 'E_g', name: 'Band gap', unit: 'eV', role: 'constant' },
  ],
  procedure: [
    'Choose the diode material and keep it fixed.',
    'Set the oil-bath temperature (start near room temperature) and press “Read current”.',
    'Raise the temperature in steps of about 10 °C up to 90 °C, reading the current each time.',
    'In Analysis, plot ln(I_s/T³) against 1000/T; E_g = −k × slope.',
  ],
  precautions: ['Keep the diode fully immersed and wait for the temperature to become steady.', 'Keep the reverse bias small so there is no breakdown.', 'Convert temperatures to kelvin.'],
  model: {
    equations: [{ tex: 'I_s = C\\,T^3\\,e^{-E_g/kT}', caption: 'Si: E_g = 1.12 eV; Ge: E_g = 0.66 eV' }],
    assumptions: ['E_g taken as constant over 25–95 °C.', 'Instrument error (when enabled): 1% meter noise, least count 0.01 nA.'],
    method: 'The ammeter reads I_s(T) from the model with meter noise. The band picture shows electrons crossing the gap at a rate that grows with I_s.',
  },
  parameters: [
    { kind: 'select', key: 'material', label: 'Diode material', default: 'silicon', options: Object.entries(MATERIALS).map(([value, mm]) => ({ value, label: mm.label })) },
    { kind: 'range', key: 'temperature', label: 'Temperature', unit: '°C', min: 25, max: 95, step: 1, default: 30 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const m = MATERIALS[String(prm.material)] ?? MATERIALS.silicon
    const T = p(prm, 'temperature') + 273.15
    return [
      { label: 'Absolute temperature', value: fixed(T, 1), unit: 'K', tone: 'theory' },
      { label: 'Thermal energy kT', value: fixed(K_EV * T * 1000, 2), unit: 'meV', tone: 'theory' },
      { label: 'Band gap', value: fixed(m.eg, 2), unit: 'eV', tone: 'theory' },
      { label: 'Reverse current', value: fixed(saturationCurrent(T, m) * 1e9, 2), unit: 'nA', tone: 'live' },
    ]
  },
  observation: {
    columns: [
      { key: 'T_C', label: 'T', unit: '°C', decimals: 0 },
      { key: 'invT', label: '1000/T', unit: 'K⁻¹', decimals: 4 },
      { key: 'Is', label: 'I_s', unit: 'nA', decimals: 2 },
      { key: 'y', label: 'ln(I_s/T³)', decimals: 4 },
    ],
    measureLabel: 'Read current',
    hint: 'Keep the material fixed; take readings from room temperature up to about 90 °C.',
    minTrials: 6,
    controlKeys: ['material'],
    measure: (prm, ctx) => {
      const m = MATERIALS[String(prm.material)] ?? MATERIALS.silicon
      const Tc = p(prm, 'temperature')
      const T = Tc + 273.15
      const nA = leastCount(withNoise(saturationCurrent(T, m) * 1e9 * (1 + (ctx.noise ? 0.01 * ctx.gauss() : 0)), 0.005, ctx.noise, ctx.gauss), 0.01)
      if (nA <= 0) return { ok: false, error: 'The current is below the meter’s resolution. Raise the temperature.' }
      return { ok: true, row: { T_C: Tc, invT: 1000 / T, Is: nA, y: Math.log((nA * 1e-9) / T ** 3), material: String(prm.material) } }
    },
  },
  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'invT'), y: num(r, 'y') }))
    const fit = linearFit(points)
    if (!fit) return null
    const m = MATERIALS[String(rows[rows.length - 1].material)] ?? MATERIALS.silicon
    const eg = -fit.slope * 1000 * K_EV
    const egErr = fit.slopeSE * 1000 * K_EV
    // The common simplification: ln I_s against 1/T, ignoring T³.
    const simple = linearFit(rows.map((r) => ({ x: num(r, 'invT'), y: Math.log(num(r, 'Is')) })))
    const egSimple = simple ? -simple.slope * 1000 * K_EV : NaN
    const err = percentError(eg, m.eg)
    return {
      x: { label: '1000/T', unit: 'K⁻¹' },
      y: { label: 'ln(I_s/T³)', unit: '' },
      points,
      fit,
      results: [
        { label: `Band gap of ${m.label}`, symbol: 'E_g', value: eg, uncertainty: egErr, unit: 'eV', accepted: m.eg, acceptedLabel: 'Standard', decimals: 3 },
        { label: 'E_g if the T³ factor is ignored (ln I_s vs 1/T)', symbol: "E_g'", value: egSimple, unit: 'eV', accepted: m.eg, decimals: 3 },
      ],
      calculations: [
        { label: 'Slope of ln(I_s/T³) vs 1000/T', tex: `\\text{slope} = ${sig(fit.slope, 5)}\\ \\mathrm{K}` },
        { label: 'Band gap', tex: `E_g = -k\\times\\text{slope}\\times1000 = (8.617\\times10^{-5})(${fixed(-fit.slope * 1000, 1)}) = ${fixed(eg, 3)}\\ \\mathrm{eV}` },
        { label: 'Without the T³ term', tex: `E_g' = ${fixed(egSimple, 3)}\\ \\mathrm{eV}\\ (\\approx E_g + 3k\\bar T)` },
        { label: 'Percentage error', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings: [],
      conclusion: `ln(I_s/T³) falls linearly with 1/T (R² = ${fixed(fit.r2, 4)}), as expected for thermally generated carriers. The band gap of ${m.label} is E_g = ${fixed(eg, 3)} ± ${sig(egErr, 1)} eV (standard ${m.eg} eV). Ignoring the T³ factor would give ${fixed(egSimple, 2)} eV.`,
    }
  },
  viva,
  assistant,
}
