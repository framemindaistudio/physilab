import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { DARK_CURRENT, photodiodeCurrent, responsivity, SOURCES } from '@/physics/semiconductor/photodiode'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'

export const photodiode: ExperimentModule = {
  id: 'photodiode',
  number: '21',
  title: 'Photodiode I–V Characteristics and Responsivity',
  category: 'semiconductor',
  tagline: 'Turn light into current — and measure how many amps each watt of light gives.',
  summary: 'Study the I–V characteristics of a photodiode at different light powers and determine its responsivity and quantum efficiency from the photocurrent in reverse bias.',
  difficulty: 'Intermediate',
  durationMin: 25,
  aim: 'To study the I–V characteristics of a photodiode and determine its responsivity.',
  objectives: [
    'Plot the I–V characteristics of a photodiode for several light intensities.',
    'Observe that in reverse bias the current is almost independent of voltage and proportional to the light power.',
    'Determine the responsivity ℛ = I_ph / P from the slope of photocurrent against power.',
    'Calculate the quantum efficiency η.',
  ],
  apparatusList: ['Silicon PIN photodiode', 'Light sources: 650, 850 and 940 nm with calibrated optical power', 'Variable DC supply (−10 V to +0.6 V)', 'Micro-ammeter'],
  theory: [
    {
      heading: 'Photodiode operation',
      body: [
        'A photodiode is a p–n junction designed to absorb light. Each absorbed photon with enough energy creates an electron–hole pair; the electric field in the depletion region sweeps them apart, producing a photocurrent in the reverse direction.',
        'In reverse bias the depletion region is wide and the diode current is just the tiny dark current plus the photocurrent, which is proportional to the light power and nearly independent of the bias voltage.',
      ],
      formulas: [
        { tex: 'I = I_s\\left(e^{V/nV_T} - 1\\right) - I_{ph}', caption: 'Photodiode characteristic' },
        { tex: 'I_{ph} = \\mathcal R\\,P', caption: 'Photocurrent proportional to optical power' },
      ],
    },
    {
      heading: 'Responsivity and quantum efficiency',
      body: [
        'Responsivity ℛ (A/W) is the photocurrent per watt of incident light. If a fraction η of photons (the quantum efficiency) each produce one electron, ℛ follows from the photon energy hc/λ.',
        'Plotting the reverse photocurrent against the optical power gives a straight line of slope ℛ; its small intercept is the dark current.',
      ],
      formulas: [
        { tex: '\\mathcal R = \\frac{I_{ph}}{P} = \\frac{\\eta e\\lambda}{hc} = \\frac{\\eta\\,\\lambda(\\mathrm{nm})}{1240}\\ \\mathrm{A/W}', caption: 'Responsivity' },
        { tex: '\\eta = \\frac{\\mathcal R\\,hc}{e\\lambda}', caption: 'Quantum efficiency from responsivity' },
      ],
    },
  ],
  variables: [
    { symbol: 'P', name: 'Incident optical power', unit: 'µW', role: 'independent' },
    { symbol: 'I_{ph}', name: 'Reverse photocurrent', unit: 'µA', role: 'dependent' },
    { symbol: 'V', name: 'Reverse bias', unit: 'V', role: 'controlled' },
    { symbol: '\\lambda', name: 'Wavelength of the light', unit: 'nm', role: 'controlled' },
  ],
  procedure: [
    'Choose the light source and set a reverse bias of about −5 V.',
    'Press Start. Set the optical power and press “Read current”.',
    'Change the power in steps from 0 to 500 µW, recording the current each time (at least six readings).',
    'Optionally sweep the bias from −10 V to +0.6 V at a fixed power to see the full I–V curve.',
    'In Analysis, plot the reverse current against P; the slope is the responsivity.',
  ],
  precautions: ['Keep the photodiode shielded from room light.', 'Do not forward-bias the photodiode heavily.', 'Keep the source-to-diode distance fixed.'],
  model: {
    equations: [{ tex: 'I(V,P) = I_s\\left(e^{V/nV_T}-1\\right) - \\frac{\\eta\\lambda}{1240}P', caption: 'η = 0.62 (650 nm), 0.80 (850 nm), 0.72 (940 nm); dark current 2 nA' }],
    assumptions: ['Ideal PIN photodiode; power calibrated at the detector.', 'Instrument error (when enabled): 0.2% meter noise and ±5 nA, least count 1 nA.'],
    method: 'The micro-ammeter reads the photodiode equation at the chosen bias and power. Only reverse-bias readings (V ≤ −0.5 V) are used for the responsivity, because there the current is set by the light alone.',
  },
  parameters: [
    { kind: 'select', key: 'source', label: 'Light source', default: 'nir', options: Object.entries(SOURCES).map(([value, s]) => ({ value, label: s.label })) },
    { kind: 'range', key: 'power', label: 'Optical power P', unit: 'µW', min: 0, max: 500, step: 10, default: 100 },
    { kind: 'range', key: 'bias', label: 'Bias voltage', unit: 'V', min: -10, max: 0.6, step: 0.05, default: -5 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const s = SOURCES[String(prm.source)] ?? SOURCES.nir
    const P = p(prm, 'power') * 1e-6
    return [
      { label: 'Diode current', value: fixed(photodiodeCurrent(p(prm, 'bias'), P, s) * 1e6, 3), unit: 'µA', tone: 'live' },
      { label: 'Photon energy', value: fixed(1239.84 / s.nm, 3), unit: 'eV', tone: 'theory' },
      { label: 'Responsivity ℛ', value: fixed(responsivity(s), 3), unit: 'A/W', tone: 'theory' },
      { label: 'Photons per second', value: ((P * s.nm * 1e-9) / (6.626e-34 * 2.998e8)).toExponential(2), unit: 's⁻¹', tone: 'theory' },
    ]
  },
  observation: {
    columns: [
      { key: 'P', label: 'P', unit: 'µW', decimals: 0 },
      { key: 'V', label: 'V', unit: 'V', decimals: 2 },
      { key: 'I', label: 'I_reverse', unit: 'µA', decimals: 3 },
    ],
    measureLabel: 'Read current',
    hint: 'Keep the source fixed and the bias negative; vary the power from 0 to 500 µW.',
    minTrials: 6,
    controlKeys: ['source'],
    measure: (prm, ctx) => {
      const s = SOURCES[String(prm.source)] ?? SOURCES.nir
      const P = p(prm, 'power')
      const V = p(prm, 'bias')
      const I = -photodiodeCurrent(V, P * 1e-6, s) * 1e6 // reverse current in µA
      const Ir = leastCount(withNoise(I * (1 + (ctx.noise ? 0.002 * ctx.gauss() : 0)), 0.005, ctx.noise, ctx.gauss), 0.001)
      return { ok: true, row: { P, V, I: Ir, source: String(prm.source) } }
    },
  },
  analyze: (rows) => {
    const reverse = rows.filter((r) => num(r, 'V') <= -0.5)
    if (reverse.length < 2) return null
    const points = reverse.map((r) => ({ x: num(r, 'P'), y: num(r, 'I') }))
    const fit = linearFit(points)
    if (!fit) return null
    const s = SOURCES[String(rows[rows.length - 1].source)] ?? SOURCES.nir
    const R = fit.slope // µA/µW = A/W
    const eta = (R * 1239.84) / s.nm
    const err = percentError(R, responsivity(s))
    const warnings = reverse.length < rows.length ? [`${rows.length - reverse.length} reading(s) taken near zero or forward bias are not used for the responsivity.`] : []
    return {
      // Only reverse-bias readings are graphed and fitted.
      x: { label: 'Optical power P', unit: 'µW' },
      y: { label: 'Reverse photocurrent', unit: 'µA' },
      points,
      fit,
      results: [
        { label: `Responsivity at ${s.nm} nm`, symbol: '\\mathcal R', value: R, uncertainty: fit.slopeSE, unit: 'A W⁻¹', accepted: responsivity(s), acceptedLabel: 'Datasheet', decimals: 3 },
        { label: 'Quantum efficiency', symbol: '\\eta', value: eta * 100, unit: '%', accepted: s.eta * 100, decimals: 1 },
      ],
      calculations: [
        { label: 'Slope of I vs P', tex: `\\mathcal R = \\frac{\\Delta I}{\\Delta P} = ${sig(R, 4)}\\ \\mathrm{\\mu A/\\mu W} = ${sig(R, 4)}\\ \\mathrm{A/W}` },
        { label: 'Quantum efficiency', tex: `\\eta = \\frac{1240\\,\\mathcal R}{\\lambda} = \\frac{1240\\times${sig(R, 4)}}{${s.nm}} = ${fixed(eta * 100, 1)}\\%` },
        { label: 'Intercept', tex: `c = ${fixed(fit.intercept, 3)}\\ \\mu\\mathrm A \\ (\\text{the dark current, } ${DARK_CURRENT * 1e9}\\ \\mathrm{nA}, \\text{ is within the meter noise})` },
        { label: 'Percentage error in ℛ', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings,
      conclusion: `In reverse bias the photocurrent is proportional to the incident power (R² = ${fixed(fit.r2, 4)}). The responsivity at ${s.nm} nm is ${fixed(R, 3)} A/W, corresponding to a quantum efficiency of ${fixed(eta * 100, 0)}%.`,
    }
  },
  viva,
  assistant,
}
