import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { hallCoefficient, hallVoltage, SAMPLES } from '@/physics/semiconductor/hall'
import { ELEMENTARY_E } from '@/physics/constants'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig, texSci } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'

export const hallEffect: ExperimentModule = {
  id: 'hall-effect',
  number: '14',
  title: 'Hall Effect',
  category: 'semiconductor',
  tagline: 'Push charge carriers sideways with a magnet to count them and learn their sign.',
  summary: 'Measure the Hall voltage across a semiconductor slab for different currents and fields, and determine the Hall coefficient, carrier type and carrier concentration.',
  difficulty: 'Advanced',
  durationMin: 30,
  aim: 'To determine the Hall coefficient, the type of charge carriers and the carrier concentration of a semiconductor using the Hall effect.',
  objectives: [
    'Observe the Hall voltage produced across a current-carrying slab in a magnetic field.',
    'Show that V_H is proportional to the product I·B.',
    'Determine the Hall coefficient R_H from the slope.',
    'Find the carrier type from the sign of V_H and the carrier concentration n = 1/(e|R_H|).',
  ],
  apparatusList: ['Semiconductor slab (Ge or Si), thickness 0.5 mm', 'Constant-current source (0–10 mA)', 'Electromagnet with gaussmeter', 'Millivoltmeter'],
  theory: [
    {
      heading: 'Magnetic force on moving charges',
      body: [
        'Charge carriers drifting along a slab with velocity v in a perpendicular magnetic field B feel a sideways Lorentz force. They pile up on one face, leaving the opposite charge on the other face.',
        'This builds a transverse electric field — the Hall field — until its force exactly balances the magnetic force, and a steady Hall voltage V_H appears across the width.',
      ],
      formulas: [
        { tex: '\\vec F = q\\,\\vec v\\times\\vec B', caption: 'Lorentz force' },
        { tex: 'qE_H = qvB \\quad\\Rightarrow\\quad E_H = vB', caption: 'Equilibrium' },
      ],
    },
    {
      heading: 'Hall voltage, coefficient and carriers',
      body: [
        'Using I = nqvA gives the Hall voltage in terms of measurable quantities. It is inversely proportional to the carrier concentration, which is why the effect is large in semiconductors and tiny in metals.',
        'Electrons and holes are pushed to the same face, so they build up opposite charges there: the sign of V_H (or of R_H) tells whether the sample is n-type or p-type.',
      ],
      formulas: [
        { tex: 'V_H = \\frac{IB}{nqt}', caption: 'Hall voltage (t = thickness)' },
        { tex: 'R_H = \\frac{V_H\\,t}{IB} = \\frac{1}{nq}, \\qquad n = \\frac{1}{e\\,|R_H|}', caption: 'Hall coefficient and carrier concentration' },
      ],
    },
  ],
  variables: [
    { symbol: 'I\\,B', name: 'Current × magnetic field', unit: 'mA T', role: 'independent' },
    { symbol: 'V_H', name: 'Hall voltage', unit: 'mV', role: 'dependent' },
    { symbol: 't', name: 'Slab thickness', unit: 'mm', role: 'constant' },
    { symbol: 'n', name: 'Carrier concentration', unit: 'm⁻³', role: 'constant' },
  ],
  procedure: [
    'Choose the sample and keep it fixed.',
    'Set the magnetic field and the current, press Start to watch the carriers, and press “Read Hall voltage”.',
    'Vary the current (1–10 mA) and the field (0.1–1 T) to get at least six different values of I·B.',
    'In Analysis, plot V_H against I·B. R_H = slope × t; its sign gives the carrier type and n = 1/(e|R_H|).',
  ],
  precautions: ['Keep the current small so the sample does not heat up.', 'Place the slab with its face perpendicular to the field.', 'Reverse the field and average to remove any misalignment voltage.'],
  model: {
    equations: [{ tex: 'V_H = \\frac{IB}{nqt}', caption: 'Ideal single-carrier Hall voltage' }],
    assumptions: ['One type of carrier; t = 0.5 mm. n-Ge 1.0×10²², p-Ge 2.0×10²², n-Si 5.0×10²¹ m⁻³.', 'Instrument error (when enabled): ±5 µV noise, least count 0.01 mV.'],
    method: 'The millivoltmeter reads V_H from the formula with meter noise. The carriers in the animation drift with the current and are deflected by the same Lorentz force.',
  },
  parameters: [
    { kind: 'select', key: 'sample', label: 'Sample', default: 'n-ge', options: Object.entries(SAMPLES).map(([value, s]) => ({ value, label: s.label })) },
    { kind: 'range', key: 'current', label: 'Current I', unit: 'mA', min: 1, max: 10, step: 0.5, default: 5 },
    { kind: 'range', key: 'field', label: 'Magnetic field B', unit: 'T', min: 0.1, max: 1, step: 0.05, default: 0.5 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const s = SAMPLES[String(prm.sample)] ?? SAMPLES['n-ge']
    const VH = hallVoltage(p(prm, 'current') * 1e-3, p(prm, 'field'), s) * 1000
    return [
      { label: 'Hall voltage', value: fixed(VH, 3), unit: 'mV', tone: 'live' },
      { label: 'I × B', value: fixed(p(prm, 'current') * p(prm, 'field'), 2), unit: 'mA T', tone: 'theory' },
      { label: 'Hall coefficient R_H', value: fixed(hallCoefficient(s) * 1e3, 3), unit: '×10⁻³ m³/C', tone: 'theory' },
      { label: 'Carrier type', value: s.sign < 0 ? 'electrons' : 'holes', tone: 'theory' },
    ]
  },
  observation: {
    columns: [
      { key: 'I', label: 'I', unit: 'mA', decimals: 1 },
      { key: 'B', label: 'B', unit: 'T', decimals: 2 },
      { key: 'IB', label: 'I·B', unit: 'mA T', decimals: 3 },
      { key: 'VH', label: 'V_H', unit: 'mV', decimals: 2 },
    ],
    measureLabel: 'Read Hall voltage',
    hint: 'Keep the sample fixed; vary I and B to cover a wide range of I·B.',
    minTrials: 6,
    controlKeys: ['sample'],
    measure: (prm, ctx) => {
      const s = SAMPLES[String(prm.sample)] ?? SAMPLES['n-ge']
      const I = p(prm, 'current')
      const B = p(prm, 'field')
      const VH = leastCount(withNoise(hallVoltage(I * 1e-3, B, s) * 1000, 0.005, ctx.noise, ctx.gauss), 0.01)
      return { ok: true, row: { I, B, IB: I * B, VH, sample: String(prm.sample) } }
    },
  },
  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'IB'), y: num(r, 'VH') }))
    const fit = linearFit(points)
    if (!fit) return null
    const s = SAMPLES[String(rows[rows.length - 1].sample)] ?? SAMPLES['n-ge']
    // slope in mV/(mA·T) = V/(A·T); R_H = slope × t
    const RH = fit.slope * s.t
    const n = 1 / (ELEMENTARY_E * Math.abs(RH))
    const err = percentError(n, s.n)
    const type = RH < 0 ? 'n-type (electrons)' : 'p-type (holes)'
    return {
      x: { label: 'I·B', unit: 'mA T' },
      y: { label: 'Hall voltage V_H', unit: 'mV' },
      points,
      fit,
      results: [
        { label: 'Hall coefficient R_H = slope × t', symbol: 'R_H', value: RH * 1e3, uncertainty: fit.slopeSE * s.t * 1e3, unit: '×10⁻³ m³ C⁻¹', accepted: hallCoefficient(s) * 1e3, acceptedLabel: 'Sample data', decimals: 4 },
        { label: `Carrier concentration — ${type}`, symbol: 'n', value: n / 1e21, unit: '×10²¹ m⁻³', accepted: s.n / 1e21, acceptedLabel: 'Sample data', decimals: 2 },
      ],
      calculations: [
        { label: 'Slope of V_H vs I·B', tex: `\\text{slope} = ${sig(fit.slope, 4)}\\ \\mathrm{mV\\,/\\,(mA\\,T)} = ${sig(fit.slope, 4)}\\ \\mathrm{V\\,A^{-1}T^{-1}}` },
        { label: 'Hall coefficient', tex: `R_H = \\text{slope}\\times t = ${sig(fit.slope, 4)}\\times ${s.t} = ${texSci(RH, 4)}\\ \\mathrm{m^3\\,C^{-1}}` },
        { label: 'Carrier concentration', tex: `n = \\frac{1}{e|R_H|} = \\frac{1}{(1.602\\times10^{-19})(${texSci(Math.abs(RH), 4)})} = ${texSci(n, 3)}\\ \\mathrm{m^{-3}}` },
        { label: 'Carrier type', tex: `R_H ${RH < 0 ? '< 0 \\Rightarrow \\text{electrons (n-type)}' : '> 0 \\Rightarrow \\text{holes (p-type)}'}` },
        { label: 'Percentage error in n', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings: [],
      conclusion: `The Hall voltage is proportional to I·B (R² = ${fixed(fit.r2, 4)}). R_H = ${texSciPlain(RH)} m³/C is ${RH < 0 ? 'negative, so the carriers are electrons (n-type)' : 'positive, so the carriers are holes (p-type)'}, with a concentration of ${(n / 1e21).toFixed(2)} × 10²¹ m⁻³.`,
    }
  },
  viva,
  assistant,
}

function texSciPlain(v: number) {
  const [mant, e] = v.toExponential(2).split('e')
  return `${mant} × 10^${Number(e)}`
}
