import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { findDarkFringes, fringeWidth } from '@/physics/optics/doubleSlit'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'

const MICROSCOPE_ZERO = 20 // mm: main-scale position of the central fringe

export const doubleSlit: ExperimentModule = {
  id: 'double-slit',
  number: '05',
  title: "Young's Double-Slit",
  category: 'optics',
  tagline: 'Measure the wavelength of light with a ruler and two slits.',
  summary:
    'Measure the fringe width with a travelling microscope for different slit separations and screen distances, and determine the wavelength of the light from β = λD/d.',
  difficulty: 'Intermediate',
  durationMin: 30,

  aim: 'To determine the wavelength of monochromatic light by measuring the fringe width in Young’s double-slit interference pattern.',
  objectives: [
    'Observe the interference pattern produced by two coherent sources.',
    'Measure the fringe width β for several values of screen distance D and slit separation d.',
    'Show that β is proportional to D/d.',
    'Determine the wavelength λ from the slope of β against D/d.',
  ],
  apparatusList: [
    'Monochromatic source (tunable laser, 380–750 nm)',
    'Double slit (separation 0.25–1.00 mm, slit width 10–40 µm)',
    'Screen on an optical bench with metre scale',
    'Travelling microscope (least count 0.01 mm)',
  ],
  theory: [
    {
      heading: 'Coherent sources and path difference',
      body: [
        'Light from one source passes through two narrow slits S₁ and S₂, which act as two coherent sources in phase. At a point P on a screen a distance D away, at height y from the centre, the waves arrive with a path difference that depends on y.',
        'Bright fringes appear where the path difference is a whole number of wavelengths (constructive interference) and dark fringes where it is an odd number of half-wavelengths (destructive interference).',
      ],
      formulas: [
        { tex: '\\Delta = S_2P - S_1P \\approx d\\sin\\theta \\approx \\frac{d\\,y}{D}', caption: 'Path difference (D ≫ d)' },
        { tex: 'y_n = \\frac{n\\lambda D}{d}\\ \\text{(bright)}, \\qquad y_n = \\left(n+\\tfrac12\\right)\\frac{\\lambda D}{d}\\ \\text{(dark)}', caption: 'Fringe positions' },
      ],
    },
    {
      heading: 'Fringe width',
      body: [
        'The distance between consecutive bright (or dark) fringes is the fringe width β. It is the same for all fringes near the centre, grows with wavelength and screen distance, and shrinks as the slits move apart.',
        'Plotting β against D/d gives a straight line through the origin whose slope is the wavelength.',
      ],
      formulas: [
        { tex: '\\beta = \\frac{\\lambda D}{d}', caption: 'Fringe width' },
        { tex: '\\lambda = \\frac{\\beta\\, d}{D} = \\text{slope of } \\beta \\text{ vs } D/d', caption: 'Wavelength' },
      ],
    },
    {
      heading: 'Intensity pattern and the single-slit envelope',
      body: [
        'Each slit has a finite width a, so each diffracts light into a central maximum of angular half-width λ/a. The two-slit cos² fringes are modulated by this single-slit sinc² envelope. With d/a ≈ 10 you see about 19 bright fringes inside the central envelope.',
      ],
      formulas: [
        { tex: 'I(\\theta) = I_0\\cos^2\\!\\left(\\frac{\\pi d\\sin\\theta}{\\lambda}\\right)\\left[\\frac{\\sin(\\pi a\\sin\\theta/\\lambda)}{\\pi a\\sin\\theta/\\lambda}\\right]^2', caption: 'Double-slit intensity with finite slit width' },
      ],
    },
  ],
  variables: [
    { symbol: 'D', name: 'Slit-to-screen distance', unit: 'm', role: 'independent' },
    { symbol: 'd', name: 'Slit separation', unit: 'mm', role: 'independent' },
    { symbol: '\\beta', name: 'Fringe width', unit: 'mm', role: 'dependent' },
    { symbol: '\\lambda', name: 'Wavelength of light', unit: 'nm', role: 'constant' },
  ],
  procedure: [
    'Choose a wavelength (the “unknown” source) and keep it fixed for the whole experiment.',
    'Set d = 0.50 mm and D = 1.00 m. Press Start to see the wave field and the fringe pattern.',
    'Press “Measure 10 fringes”: the microscope crosshair is set on a dark fringe on the left (reading x₁), moved across ten fringes (reading x₂), and β = (x₂ − x₁)/10.',
    'Change D (0.5 → 3.0 m) and d between readings. Take at least five readings.',
    'In Analysis, plot β against D/d. The slope is the wavelength.',
  ],
  precautions: [
    'The slits must be narrow, parallel and close together, and the source monochromatic.',
    'Measure across many fringes and divide, to reduce the relative error.',
    'Move the microscope in one direction only to avoid backlash error.',
    'Keep D much larger than d so that the small-angle approximation holds.',
  ],
  model: {
    equations: [
      { tex: 'I(y) = \\cos^2\\!\\left(\\frac{\\pi d \\sin\\theta}{\\lambda}\\right)\\operatorname{sinc}^2\\!\\left(\\frac{\\pi a\\sin\\theta}{\\lambda}\\right),\\ \\sin\\theta = \\frac{y}{\\sqrt{y^2+D^2}}', caption: 'Fraunhofer intensity on the screen' },
    ],
    assumptions: [
      'Plane monochromatic wave, identical slits, far-field (Fraunhofer) conditions.',
      'The top-view wave field is schematic: λ and d are enlarged so the waves are visible.',
      'Instrument error (when enabled): crosshair setting σ ≈ 0.01 mm per reading, least count 0.01 mm.',
    ],
    method:
      'The eyepiece image and the intensity curve are drawn from I(y). A reading scans I(y) in 5 µm steps, finds dark fringes as local minima (refined by a parabola through three samples), and reads the positions of the 5th dark fringe left of centre and the dark fringe ten fringes to its right. β is never computed from λD/d in the measurement.',
  },

  parameters: [
    { kind: 'range', key: 'wavelength', label: 'Wavelength λ', unit: 'nm', min: 380, max: 750, step: 1, default: 589 },
    { kind: 'range', key: 'separation', label: 'Slit separation d', unit: 'mm', min: 0.25, max: 1.0, step: 0.01, default: 0.5 },
    { kind: 'range', key: 'distance', label: 'Screen distance D', unit: 'm', min: 0.5, max: 3.0, step: 0.05, default: 1.0 },
    { kind: 'range', key: 'slitWidth', label: 'Slit width a', unit: 'mm', min: 0.01, max: 0.04, step: 0.005, default: 0.02, decimals: 3 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const lam = p(prm, 'wavelength') * 1e-9
    const d = p(prm, 'separation') * 1e-3
    const D = p(prm, 'distance')
    const a = p(prm, 'slitWidth') * 1e-3
    return [
      { label: 'Fringe width β = λD/d', value: fixed(fringeWidth(lam, d, D) * 1000, 3), unit: 'mm', tone: 'theory' },
      { label: 'Angular fringe width λ/d', value: fixed((lam / d) * 1000, 3), unit: 'mrad', tone: 'theory' },
      { label: 'First envelope zero λD/a', value: fixed(((lam * D) / a) * 1000, 1), unit: 'mm', tone: 'theory' },
      { label: 'Bright fringes in envelope', value: String(2 * Math.ceil(d / a) - 1), tone: 'theory' },
    ]
  },

  observation: {
    columns: [
      { key: 'D', label: 'D', unit: 'm', decimals: 2 },
      { key: 'd', label: 'd', unit: 'mm', decimals: 2 },
      { key: 'x1', label: 'x₁', unit: 'mm', decimals: 2 },
      { key: 'x2', label: 'x₂', unit: 'mm', decimals: 2 },
      { key: 'beta', label: 'β = (x₂−x₁)/10', unit: 'mm', decimals: 3 },
      { key: 'ratio', label: 'D/d', unit: 'm/mm', decimals: 2 },
    ],
    measureLabel: 'Measure 10 fringes',
    hint: 'Keep λ fixed. Vary D and d so that D/d takes at least five different values.',
    minTrials: 5,
    controlKeys: ['wavelength'],
    measure: (prm, ctx) => {
      const lamNm = p(prm, 'wavelength')
      const dMm = p(prm, 'separation')
      const D = p(prm, 'distance')
      const aMm = p(prm, 'slitWidth')
      const darks = findDarkFringes(lamNm * 1e-9, dMm * 1e-3, D, aMm * 1e-3, 0.08, 5e-6)
      const i0 = darks.findIndex((y) => y > 0)
      if (i0 < 5 || i0 + 5 >= darks.length) return { ok: false, error: 'Could not find ten clear fringes in the field of view. Reduce D or increase d.' }
      const yL = darks[i0 - 5] * 1000
      const yR = darks[i0 + 5] * 1000
      const x1 = leastCount(withNoise(MICROSCOPE_ZERO + yL, 0.01, ctx.noise, ctx.gauss), 0.01)
      const x2 = leastCount(withNoise(MICROSCOPE_ZERO + yR, 0.01, ctx.noise, ctx.gauss), 0.01)
      const beta = (x2 - x1) / 10
      return {
        ok: true,
        row: { wavelength: lamNm, slitWidth: aMm, D, d: dMm, x1, x2, beta, ratio: D / dMm },
      }
    },
  },

  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'ratio'), y: num(r, 'beta') }))
    const fit = linearFit(points)
    if (!fit) return null
    const lam = fit.slope * 1000
    const lamErr = fit.slopeSE * 1000
    const set = num(rows[rows.length - 1], 'wavelength')
    const err = percentError(lam, set)
    return {
      x: { label: 'D/d', unit: 'm mm⁻¹' },
      y: { label: 'Fringe width β', unit: 'mm' },
      points,
      fit,
      results: [{ label: 'Wavelength of the source', symbol: '\\lambda', value: lam, uncertainty: lamErr, unit: 'nm', accepted: set, acceptedLabel: 'Source setting', decimals: 1 }],
      calculations: [
        { label: 'Slope of β vs D/d', tex: `\\text{slope} = \\frac{\\Delta\\beta}{\\Delta(D/d)} = ${sig(fit.slope, 4)}\\ \\mathrm{mm \\cdot mm\\,m^{-1}} = ${sig(fit.slope, 4)}\\times10^{-3}\\ \\mathrm{mm}` },
        { label: 'Wavelength', tex: `\\lambda = \\text{slope} = ${sig(fit.slope, 4)}\\times10^{-6}\\ \\mathrm{m} = ${fixed(lam, 1)}\\ \\mathrm{nm}` },
        { label: 'Uncertainty from the fit', tex: `\\Delta\\lambda = ${sig(lamErr, 2)}\\ \\mathrm{nm}` },
        { label: 'Example (first reading)', tex: `\\lambda = \\frac{\\beta d}{D} = \\frac{${fixed(num(rows[0], 'beta'), 3)}\\ \\mathrm{mm}\\times ${fixed(num(rows[0], 'd'), 2)}\\ \\mathrm{mm}}{${fixed(num(rows[0], 'D'), 2)}\\ \\mathrm{m}} = ${fixed(((num(rows[0], 'beta') * num(rows[0], 'd')) / num(rows[0], 'D')) * 1000, 1)}\\ \\mathrm{nm}` },
        { label: 'Percentage error', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings: [],
      conclusion: `The fringe width is directly proportional to D/d (R² = ${fixed(fit.r2, 4)}), as predicted by β = λD/d. The wavelength of the light is λ = ${fixed(lam, 0)} ± ${sig(lamErr, 1)} nm, within ${fixed(err, 1)}% of the source value ${set} nm.`,
    }
  },
  viva,
}
