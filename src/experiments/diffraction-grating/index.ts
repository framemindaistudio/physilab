import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { diffractionAngle, maxOrder, MERCURY_LINES } from '@/physics/optics/grating'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'

const MINUTE = 1 / 60 // vernier least count: 1 minute of arc

export const diffractionGrating: ExperimentModule = {
  id: 'diffraction-grating',
  number: '08',
  title: 'Diffraction Grating',
  category: 'optics',
  tagline: 'Split mercury light into lines and measure their wavelengths.',
  summary: 'Use a spectrometer and plane transmission grating to measure diffraction angles in several orders, then find each line’s wavelength from sin θ against n.',
  difficulty: 'Intermediate',
  durationMin: 30,
  aim: 'To determine the wavelengths of the prominent lines of the mercury spectrum using a plane transmission grating at normal incidence.',
  objectives: [
    'Set the grating for normal incidence and observe the mercury spectrum in several orders.',
    'Measure the angle of diffraction of a chosen line on both sides of the central image.',
    'Show that sin θ is proportional to the order n.',
    'Determine the wavelength from the slope of sin θ against n.',
  ],
  apparatusList: ['Spectrometer with vernier scales (least count 1′)', 'Plane transmission grating (300 / 500 / 600 lines per mm)', 'Mercury vapour lamp', 'Spirit level'],
  theory: [
    {
      heading: 'The grating equation',
      body: [
        'A grating is a large number N of equally spaced parallel slits. Light from neighbouring slits reaching the telescope at angle θ differs in path by d sin θ, where d = 1/N is the grating element. Bright principal maxima appear when this is a whole number of wavelengths.',
        'Because different colours satisfy the condition at different angles, the grating spreads white or mercury light into a spectrum, repeated in each order n.',
      ],
      formulas: [
        { tex: 'd\\sin\\theta = n\\lambda', caption: 'Grating equation (normal incidence)' },
        { tex: 'd = \\frac{1}{N}', caption: 'Grating element from lines per unit length' },
      ],
    },
    {
      heading: 'Measuring θ and finding λ',
      body: [
        'The telescope is turned to the line on the left and on the right of the central image; half the difference of the two readings is θ, which cancels any error in the zero of the scale.',
        'For one spectral line, sin θ grows in equal steps with n; the slope of sin θ against n is λ/d.',
      ],
      formulas: [
        { tex: '\\theta = \\tfrac12(\\theta_R - \\theta_L)', caption: 'Angle of diffraction' },
        { tex: '\\lambda = d \\times \\text{slope} = \\frac{\\text{slope}}{N}', caption: 'Wavelength from the graph' },
        { tex: 'n_{\\max} = \\left\\lfloor \\frac{d}{\\lambda} \\right\\rfloor', caption: 'Highest visible order' },
      ],
    },
  ],
  variables: [
    { symbol: 'n', name: 'Order of the spectrum', unit: '—', role: 'independent' },
    { symbol: '\\theta', name: 'Angle of diffraction', unit: '°', role: 'dependent' },
    { symbol: 'N', name: 'Lines per mm', unit: 'mm⁻¹', role: 'controlled' },
    { symbol: '\\lambda', name: 'Wavelength of the line', unit: 'nm', role: 'constant' },
  ],
  procedure: [
    'Choose a grating and a spectral line, and keep both fixed.',
    'Set the order n = 1 and press “Measure angle”: the telescope is set on the line to the left and right of the central image.',
    'Repeat for every order that is visible (n = 2, 3 …). Take at least three readings, repeating orders if needed.',
    'In Analysis, plot sin θ against n; the slope divided by N gives λ.',
    'Repeat for the other mercury lines.',
  ],
  precautions: ['Adjust the grating for normal incidence before measuring.', 'Read both verniers and use the mean to remove eccentricity error.', 'Lock the telescope before reading the vernier.'],
  model: {
    equations: [{ tex: '\\theta_n = \\sin^{-1}\\!\\left(\\frac{n\\lambda}{d}\\right)', caption: 'Line positions for each order' }],
    assumptions: ['Normal incidence on an ideal plane grating; Hg lines 404.66, 435.83, 546.07, 576.96, 579.07 nm.', 'Instrument error (when enabled): telescope setting σ ≈ 0.5′, vernier least count 1′.'],
    method: 'Line positions come from the grating equation. A reading records the telescope angle on each side with setting noise and 1′ least count; θ is half the difference, exactly as on a real spectrometer.',
  },
  parameters: [
    {
      kind: 'select',
      key: 'grating',
      label: 'Grating',
      default: '500',
      options: [
        { value: '300', label: '300 lines per mm' },
        { value: '500', label: '500 lines per mm' },
        { value: '600', label: '600 lines per mm' },
      ],
    },
    {
      kind: 'select',
      key: 'line',
      label: 'Mercury line',
      default: 'green',
      options: Object.entries(MERCURY_LINES).map(([value, l]) => ({ value, label: `${l.label}` })),
    },
    { kind: 'range', key: 'order', label: 'Order n', unit: '', min: 1, max: 5, step: 1, default: 1 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const N = p(prm, 'grating')
    const l = MERCURY_LINES[String(prm.line)] ?? MERCURY_LINES.green
    const th = diffractionAngle(p(prm, 'order'), l.nm, N)
    return [
      { label: 'Grating element d', value: fixed((1 / N) * 1000, 3), unit: 'µm', tone: 'theory' },
      { label: 'Line wavelength', value: fixed(l.nm, 2), unit: 'nm', tone: 'theory' },
      { label: 'Expected θ', value: Number.isFinite(th) ? fixed(th, 3) : '—', unit: '°', tone: 'theory' },
      { label: 'Highest order', value: String(maxOrder(l.nm, N)), tone: 'theory' },
    ]
  },
  observation: {
    columns: [
      { key: 'n', label: 'n', decimals: 0 },
      { key: 'left', label: 'θ_L', unit: '°', decimals: 3 },
      { key: 'right', label: 'θ_R', unit: '°', decimals: 3 },
      { key: 'theta', label: 'θ', unit: '°', decimals: 3 },
      { key: 'sin', label: 'sin θ', decimals: 4 },
    ],
    measureLabel: 'Measure angle',
    hint: 'Keep the grating and line fixed; measure every visible order.',
    minTrials: 3,
    controlKeys: ['grating', 'line'],
    measure: (prm, ctx) => {
      const N = p(prm, 'grating')
      const key = String(prm.line)
      const l = MERCURY_LINES[key] ?? MERCURY_LINES.green
      const n = p(prm, 'order')
      const th = diffractionAngle(n, l.nm, N)
      if (!Number.isFinite(th)) return { ok: false, error: `Order ${n} is not visible for this line: n λ/d > 1. The highest order is ${maxOrder(l.nm, N)}.` }
      const zero = 180 // telescope scale reading of the central image
      const left = leastCount(withNoise(zero - th, MINUTE / 2, ctx.noise, ctx.gauss), MINUTE)
      const right = leastCount(withNoise(zero + th, MINUTE / 2, ctx.noise, ctx.gauss), MINUTE)
      const theta = (right - left) / 2
      return { ok: true, row: { n, left, right, theta, sin: Math.sin((theta * Math.PI) / 180), grating: String(N), line: key } }
    },
  },
  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'n'), y: num(r, 'sin') }))
    const fit = linearFit(points)
    if (!fit) return null
    const last = rows[rows.length - 1]
    const N = num(last, 'grating')
    const l = MERCURY_LINES[String(last.line)] ?? MERCURY_LINES.green
    const lam = (fit.slope / N) * 1e6
    const lamErr = (fit.slopeSE / N) * 1e6
    const err = percentError(lam, l.nm)
    return {
      x: { label: 'Order n', unit: '' },
      y: { label: 'sin θ', unit: '' },
      points,
      fit,
      results: [{ label: `Wavelength of the ${l.label.toLowerCase()} line`, symbol: '\\lambda', value: lam, uncertainty: lamErr, unit: 'nm', accepted: l.nm, acceptedLabel: 'Standard', decimals: 2 }],
      calculations: [
        { label: 'Slope of sin θ vs n', tex: `\\text{slope} = \\frac{\\lambda}{d} = ${sig(fit.slope, 5)}` },
        { label: 'Wavelength', tex: `\\lambda = \\frac{\\text{slope}}{N} = \\frac{${sig(fit.slope, 5)}}{${N}\\ \\mathrm{mm^{-1}}} = ${fixed(lam, 2)}\\ \\mathrm{nm}` },
        { label: 'Example (first reading)', tex: `\\lambda = \\frac{\\sin\\theta}{nN} = \\frac{${fixed(num(rows[0], 'sin'), 4)}}{${num(rows[0], 'n')}\\times${N}} = ${fixed((num(rows[0], 'sin') / (num(rows[0], 'n') * N)) * 1e6, 2)}\\ \\mathrm{nm}` },
        { label: 'Percentage error', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings: [],
      conclusion: `sin θ is proportional to the order (R² = ${fixed(fit.r2, 4)}), as the grating equation d sin θ = nλ predicts. The ${l.label.toLowerCase()} mercury line has λ = ${fixed(lam, 1)} ± ${sig(lamErr, 1)} nm (standard ${l.nm} nm).`,
    }
  },
  viva,
  assistant,
}
