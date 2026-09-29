import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'
import { LASERS, SCREEN_HALF, spotPosition } from './model'

export const laserWavelength: ExperimentModule = {
  id: 'laser-wavelength',
  number: '16',
  title: 'Wavelength of a Laser',
  category: 'optics',
  tagline: 'Shine a laser through a grating and measure the spots on a wall.',
  summary: 'Measure the separation of diffraction spots formed by a grating on a screen, compute the diffraction angles and find the laser wavelength from sin θ against n.',
  difficulty: 'Introductory',
  durationMin: 20,
  aim: 'To determine the wavelength of a laser beam using a diffraction grating.',
  objectives: [
    'Obtain the diffraction pattern of a laser beam through a grating on a screen.',
    'Measure the distance between the spots of each order and the grating-to-screen distance.',
    'Calculate the angle of diffraction for each order.',
    'Determine the wavelength from the slope of sin θ against the order n.',
  ],
  apparatusList: ['Laser (He–Ne or diode)', 'Plane transmission grating (100 / 300 / 600 lines per mm)', 'Screen with metre scale', 'Metre scale for D'],
  theory: [
    {
      heading: 'Diffraction of a laser beam by a grating',
      body: [
        'A laser gives a narrow, monochromatic and coherent beam. Passing through a grating with N lines per metre (grating element d = 1/N), it is split into beams at angles where light from neighbouring lines arrives in step.',
        'On a screen a distance D away these beams make a row of bright spots. The n-th order spot is a distance x from the central spot, and the angle follows from simple geometry.',
      ],
      formulas: [
        { tex: 'd\\sin\\theta_n = n\\lambda', caption: 'Grating equation' },
        { tex: '\\tan\\theta_n = \\frac{x_n}{D}, \\qquad \\sin\\theta_n = \\frac{x_n}{\\sqrt{x_n^2 + D^2}}', caption: 'Angle from the spot position' },
      ],
    },
    {
      heading: 'Finding the wavelength',
      body: [
        'Measuring the distance 2x between the two n-th order spots (left and right) and halving it removes errors in locating the centre.',
        'sin θ is proportional to n; the slope of sin θ against n equals λ/d, so λ = slope/N.',
      ],
      formulas: [{ tex: '\\lambda = \\frac{d\\sin\\theta}{n} = \\frac{\\text{slope}}{N}', caption: 'Wavelength from the graph' }],
    },
  ],
  variables: [
    { symbol: 'n', name: 'Order of the spot', unit: '—', role: 'independent' },
    { symbol: 'x_n', name: 'Distance of the n-th spot from the centre', unit: 'cm', role: 'dependent' },
    { symbol: 'D', name: 'Grating-to-screen distance', unit: 'm', role: 'controlled' },
    { symbol: 'N', name: 'Lines per mm of the grating', unit: 'mm⁻¹', role: 'constant' },
  ],
  procedure: [
    'Choose the laser and grating and keep them fixed. Press Start to switch on the laser.',
    'Set D (about 0.5 m) and the order n = 1. Press “Measure spots” to record the distance 2x between the two first-order spots.',
    'Repeat for every order that fits on the screen, and for a few different values of D.',
    'In Analysis, plot sin θ against n; λ = slope/N.',
  ],
  precautions: ['Never look directly into the laser beam.', 'Keep the grating perpendicular to the beam and parallel to the screen.', 'Measure to the centres of the spots.'],
  model: {
    equations: [{ tex: 'x_n = D\\tan\\!\\left[\\sin^{-1}\\!\\left(\\frac{n\\lambda}{d}\\right)\\right]', caption: 'Spot positions on the screen' }],
    assumptions: ['Normal incidence; screen perpendicular to the central beam; screen ±60 cm wide.', 'Instrument error (when enabled): each spot located to σ ≈ 1 mm, scale least count 1 mm.'],
    method: 'Spot positions come from the grating equation and screen geometry. A reading records the left and right spot positions on the scale with noise; the analysis recomputes θ from x and D as you would by hand.',
  },
  parameters: [
    { kind: 'select', key: 'laser', label: 'Laser', default: 'hene', options: Object.entries(LASERS).map(([value, l]) => ({ value, label: l.label })) },
    {
      kind: 'select',
      key: 'grating',
      label: 'Grating',
      default: '300',
      options: [
        { value: '100', label: '100 lines per mm' },
        { value: '300', label: '300 lines per mm' },
        { value: '600', label: '600 lines per mm' },
      ],
    },
    { kind: 'range', key: 'distance', label: 'Screen distance D', unit: 'm', min: 0.2, max: 1.5, step: 0.01, default: 0.5 },
    { kind: 'range', key: 'order', label: 'Order n', unit: '', min: 1, max: 5, step: 1, default: 1 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const l = LASERS[String(prm.laser)] ?? LASERS.hene
    const N = p(prm, 'grating')
    const x = spotPosition(p(prm, 'order'), l.nm, N, p(prm, 'distance'))
    return [
      { label: 'Grating element d', value: fixed(1000 / N, 3), unit: 'µm', tone: 'theory' },
      { label: 'Spot distance x', value: Number.isFinite(x) ? fixed(x * 100, 2) : '—', unit: 'cm', tone: 'theory' },
      { label: 'Diffraction angle', value: Number.isFinite(x) ? fixed((Math.atan(x / p(prm, 'distance')) * 180) / Math.PI, 2) : '—', unit: '°', tone: 'theory' },
      { label: 'Highest order', value: String(Math.floor(1e6 / (N * l.nm))), tone: 'theory' },
    ]
  },
  observation: {
    columns: [
      { key: 'n', label: 'n', decimals: 0 },
      { key: 'D', label: 'D', unit: 'm', decimals: 2 },
      { key: 'x2', label: '2x', unit: 'cm', decimals: 1 },
      { key: 'theta', label: 'θ', unit: '°', decimals: 2 },
      { key: 'sin', label: 'sin θ', decimals: 4 },
    ],
    measureLabel: 'Measure spots',
    hint: 'Keep the laser and grating fixed; measure every order that fits on the screen.',
    minTrials: 4,
    controlKeys: ['laser', 'grating'],
    measure: (prm, ctx) => {
      const l = LASERS[String(prm.laser)] ?? LASERS.hene
      const N = p(prm, 'grating')
      const D = p(prm, 'distance')
      const n = p(prm, 'order')
      const x = spotPosition(n, l.nm, N, D)
      if (!Number.isFinite(x)) return { ok: false, error: `Order ${n} does not exist for this laser and grating (nλ/d > 1).` }
      if (x > SCREEN_HALF) return { ok: false, error: `The order-${n} spots are ${(x * 100).toFixed(0)} cm from the centre — off the screen. Reduce D or the order.` }
      const left = leastCount(withNoise(-x * 100, 0.1, ctx.noise, ctx.gauss), 0.1)
      const right = leastCount(withNoise(x * 100, 0.1, ctx.noise, ctx.gauss), 0.1)
      const x2 = right - left
      const theta = Math.atan(x2 / 200 / D)
      return { ok: true, row: { n, D, x2, theta: (theta * 180) / Math.PI, sin: Math.sin(theta), laser: String(prm.laser), grating: String(N) } }
    },
  },
  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'n'), y: num(r, 'sin') }))
    const fit = linearFit(points)
    if (!fit) return null
    const last = rows[rows.length - 1]
    const N = num(last, 'grating')
    const l = LASERS[String(last.laser)] ?? LASERS.hene
    const lam = (fit.slope / N) * 1e6
    const lamErr = (fit.slopeSE / N) * 1e6
    const err = percentError(lam, l.nm)
    return {
      x: { label: 'Order n', unit: '' },
      y: { label: 'sin θ', unit: '' },
      points,
      fit,
      results: [{ label: `Wavelength of the ${l.label}`, symbol: '\\lambda', value: lam, uncertainty: lamErr, unit: 'nm', accepted: l.nm, acceptedLabel: 'Manufacturer', decimals: 1 }],
      calculations: [
        { label: 'Angle for the first reading', tex: `\\theta = \\tan^{-1}\\frac{x}{D} = \\tan^{-1}\\frac{${fixed(num(rows[0], 'x2') / 2, 1)}\\ \\mathrm{cm}}{${fixed(num(rows[0], 'D') * 100, 0)}\\ \\mathrm{cm}} = ${fixed(num(rows[0], 'theta'), 2)}^\\circ` },
        { label: 'Slope of sin θ vs n', tex: `\\text{slope} = \\frac{\\lambda}{d} = ${sig(fit.slope, 5)}` },
        { label: 'Wavelength', tex: `\\lambda = \\frac{\\text{slope}}{N} = \\frac{${sig(fit.slope, 5)}}{${N}\\ \\mathrm{mm^{-1}}} = ${fixed(lam, 1)}\\ \\mathrm{nm}` },
        { label: 'Percentage error', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings: [],
      conclusion: `sin θ increases in proportion to the order (R² = ${fixed(fit.r2, 4)}). The wavelength of the ${l.label} is λ = ${fixed(lam, 1)} ± ${sig(lamErr, 1)} nm (specified ${l.nm} nm).`,
    }
  },
  viva,
  assistant,
}
