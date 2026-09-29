import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { transmitted } from '@/physics/optics/malus'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'
import { MALUS_BACKGROUND, sourceIntensity } from './model'

export const malusLaw: ExperimentModule = {
  id: 'malus-law',
  number: '09',
  title: "Malus's Law",
  category: 'optics',
  tagline: 'Rotate an analyser and watch polarised light fade as cos²θ.',
  summary: 'Measure the light transmitted through a polariser–analyser pair at different angles and verify that the intensity is proportional to cos²θ.',
  difficulty: 'Introductory',
  durationMin: 20,
  aim: 'To verify Malus’s law for plane-polarised light.',
  objectives: [
    'Produce plane-polarised light with a polariser.',
    'Measure the transmitted intensity as the analyser is rotated.',
    'Show that I is proportional to cos²θ and find I₀ from the slope.',
    'Observe extinction when the polariser and analyser are crossed.',
  ],
  apparatusList: ['Lamp', 'Polariser and analyser (Polaroid sheets) on rotating mounts with angle scale', 'Photodetector with micro-ammeter'],
  theory: [
    {
      heading: 'Polarised light',
      body: [
        'Light is a transverse electromagnetic wave: the electric field oscillates at right angles to the direction of travel. In ordinary (unpolarised) light it points in all such directions at random.',
        'A polariser passes only the component of the field along its transmission axis, so the light leaving it is plane-polarised, with half the original intensity.',
      ],
      formulas: [{ tex: 'I_{\\text{polarised}} = \\tfrac12 I_{\\text{unpolarised}}', caption: 'An ideal polariser transmits half of unpolarised light' }],
    },
    {
      heading: 'Malus’s law',
      body: [
        'When this polarised light meets an analyser whose axis is at angle θ, only the field component E₀ cos θ passes. Intensity is proportional to the square of the field amplitude, so the transmitted intensity falls as cos²θ.',
        'The intensity is maximum at θ = 0° and 180° and zero at 90° (crossed polarisers). A graph of I against cos²θ is a straight line through the origin with slope I₀.',
      ],
      formulas: [
        { tex: 'E = E_0\\cos\\theta', caption: 'Field component along the analyser axis' },
        { tex: 'I = I_0\\cos^2\\theta', caption: 'Malus’s law' },
      ],
    },
  ],
  variables: [
    { symbol: '\\theta', name: 'Angle between polariser and analyser', unit: '°', role: 'independent' },
    { symbol: 'I', name: 'Transmitted intensity (photocurrent)', unit: 'µA', role: 'dependent' },
    { symbol: 'I_0', name: 'Intensity with the axes parallel', unit: 'µA', role: 'controlled' },
  ],
  procedure: [
    'Keep the lamp setting fixed.',
    'Set the analyser to θ = 0° and press “Read detector”.',
    'Rotate the analyser in steps of 10° or 15° up to 90° (and beyond, if you like), recording the current each time.',
    'In Analysis, plot I against cos²θ. A straight line through the origin verifies Malus’s law; the slope is I₀.',
  ],
  precautions: ['Shield the detector from room light.', 'Keep the lamp and detector fixed while rotating only the analyser.', 'Let the reading settle before recording.'],
  model: {
    equations: [{ tex: 'I = I_0\\cos^2\\theta + I_{\\text{bg}}', caption: 'Transmitted intensity with a small stray-light background (0.4 µA)' }],
    assumptions: ['Ideal polarisers; I₀ = 80 µA at 100% lamp.', 'Instrument error (when enabled): 0.5% detector noise plus ±0.05 µA, least count 0.01 µA.'],
    method: 'The detector reading is I₀ cos²θ plus background with meter noise. The beam brightness and the polar plot use the same function.',
  },
  parameters: [
    { kind: 'range', key: 'angle', label: 'Analyser angle θ', unit: '°', min: 0, max: 180, step: 1, default: 30 },
    { kind: 'range', key: 'lamp', label: 'Lamp brightness', unit: '%', min: 20, max: 100, step: 5, default: 100 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const th = p(prm, 'angle')
    const I0 = sourceIntensity(p(prm, 'lamp'))
    const c2 = Math.cos((th * Math.PI) / 180) ** 2
    return [
      { label: 'cos²θ', value: fixed(c2, 4), tone: 'theory' },
      { label: 'I₀ (axes parallel)', value: fixed(I0, 1), unit: 'µA', tone: 'theory' },
      { label: 'Detector', value: fixed(transmitted(I0, th, MALUS_BACKGROUND), 2), unit: 'µA', tone: 'live' },
      { label: 'Transmitted fraction', value: fixed(c2 * 100, 1), unit: '%', tone: 'theory' },
    ]
  },
  observation: {
    columns: [
      { key: 'theta', label: 'θ', unit: '°', decimals: 0 },
      { key: 'cos2', label: 'cos²θ', decimals: 4 },
      { key: 'I', label: 'I', unit: 'µA', decimals: 2 },
    ],
    measureLabel: 'Read detector',
    hint: 'Keep the lamp fixed; rotate the analyser from 0° to 90° in steps.',
    minTrials: 6,
    controlKeys: ['lamp'],
    measure: (prm, ctx) => {
      const th = p(prm, 'angle')
      const I0 = sourceIntensity(p(prm, 'lamp'))
      const ideal = transmitted(I0, th, MALUS_BACKGROUND)
      const I = Math.max(0, leastCount(withNoise(ideal * (1 + (ctx.noise ? 0.005 * ctx.gauss() : 0)), 0.05, ctx.noise, ctx.gauss), 0.01))
      return { ok: true, row: { theta: th, cos2: Math.cos((th * Math.PI) / 180) ** 2, I, lamp: p(prm, 'lamp') } }
    },
  },
  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'cos2'), y: num(r, 'I') }))
    const fit = linearFit(points)
    if (!fit) return null
    const I0set = sourceIntensity(num(rows[rows.length - 1], 'lamp'))
    const err = percentError(fit.slope, I0set)
    return {
      x: { label: 'cos²θ', unit: '' },
      y: { label: 'Transmitted intensity I', unit: 'µA' },
      points,
      fit,
      results: [
        { label: 'I₀ from the slope', symbol: 'I_0', value: fit.slope, uncertainty: fit.slopeSE, unit: 'µA', accepted: I0set, acceptedLabel: 'Axes parallel', decimals: 2 },
        { label: 'Intercept (stray light)', symbol: 'I_{\\text{bg}}', value: fit.intercept, uncertainty: fit.interceptSE, unit: 'µA', decimals: 2 },
      ],
      calculations: [
        { label: 'Slope of I vs cos²θ', tex: `\\text{slope} = I_0 = ${fixed(fit.slope, 2)}\\ \\mu\\mathrm A` },
        { label: 'Intercept', tex: `c = ${fixed(fit.intercept, 2)}\\ \\mu\\mathrm A \\ (\\text{background light})` },
        { label: 'Linearity', tex: `R^2 = ${fixed(fit.r2, 5)}` },
        { label: 'Percentage difference in I₀', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings: [],
      conclusion: `The transmitted intensity is a straight-line function of cos²θ (R² = ${fixed(fit.r2, 4)}) passing close to the origin, verifying Malus’s law I = I₀cos²θ with I₀ = ${fixed(fit.slope, 1)} µA.`,
    }
  },
  viva,
  assistant,
}
