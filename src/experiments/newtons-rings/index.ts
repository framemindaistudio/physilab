import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { darkRingDiameter, findDarkRingRadius } from '@/physics/optics/newtonsRings'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'

const ZERO = 20 // mm: microscope main-scale reading at the centre of the rings

export const newtonsRings: ExperimentModule = {
  id: 'newtons-rings',
  number: '07',
  title: "Newton's Rings",
  category: 'optics',
  tagline: 'Interference in a wedge of air — measure the wavelength of sodium light.',
  summary: 'Measure the diameters of dark rings formed between a lens and a glass plate, plot D² against ring number, and find the wavelength from the slope.',
  difficulty: 'Intermediate',
  durationMin: 30,
  aim: 'To determine the wavelength of monochromatic light using Newton’s rings.',
  objectives: [
    'Observe circular interference fringes formed by the air film between a plano-convex lens and a plane glass plate.',
    'Measure the diameters of several dark rings with a travelling microscope.',
    'Show that D² increases linearly with the ring number n.',
    'Determine the wavelength from the slope of D² against n.',
  ],
  apparatusList: ['Plano-convex lens of known radius of curvature R', 'Optically plane glass plate', 'Glass plate inclined at 45°', 'Sodium vapour lamp (589.3 nm)', 'Travelling microscope (least count 0.01 mm)'],
  theory: [
    {
      heading: 'Interference in a thin air film',
      body: [
        'Light reflected from the top and bottom surfaces of the thin air film between the lens and the plate interferes. The film thickness t is zero at the point of contact and grows outwards, so the path difference — and the fringe pattern — depends only on the distance r from the centre: the fringes are circles.',
        'Reflection at the lower (air-to-glass) surface adds a phase change of π, so the centre, where t = 0, is dark.',
      ],
      formulas: [
        { tex: 't = \\frac{r^2}{2R}', caption: 'Film thickness at distance r (R ≫ r)' },
        { tex: '2t = n\\lambda \\quad \\text{(dark ring)}', caption: 'Condition for a dark ring in reflected light' },
      ],
    },
    {
      heading: 'Ring diameters and the wavelength',
      body: [
        'Combining the two results gives the radius of the n-th dark ring. The squares of the diameters increase in equal steps of 4λR, so the rings get closer together further out.',
        'Plotting D² against n gives a straight line whose slope is 4λR. Using differences such as D²ₙ₊ₚ − D²ₙ removes errors from dust or a poor point of contact.',
      ],
      formulas: [
        { tex: 'r_n^2 = n\\lambda R, \\qquad D_n^2 = 4n\\lambda R', caption: 'Dark ring diameter' },
        { tex: '\\lambda = \\frac{D_{n+p}^2 - D_n^2}{4pR} = \\frac{\\text{slope}}{4R}', caption: 'Wavelength from the slope' },
      ],
    },
  ],
  variables: [
    { symbol: 'n', name: 'Ring number', unit: '—', role: 'independent' },
    { symbol: 'D_n', name: 'Diameter of n-th dark ring', unit: 'mm', role: 'dependent' },
    { symbol: 'R', name: 'Radius of curvature of lens', unit: 'm', role: 'controlled' },
    { symbol: '\\lambda', name: 'Wavelength of light', unit: 'nm', role: 'constant' },
  ],
  procedure: [
    'Keep the wavelength and the lens (R) fixed.',
    'Choose a ring number n (start around 2) and press “Measure ring diameter”: the crosshair is set on the ring on the left (x₁) and on the right (x₂), and D = x₂ − x₁.',
    'Repeat for at least six ring numbers, e.g. n = 2, 4, 6 … 16.',
    'In Analysis, plot D² against n. The slope divided by 4R is the wavelength.',
  ],
  precautions: [
    'Clean the lens and plate so the centre is dark and sharp.',
    'Move the microscope in one direction only to avoid backlash error.',
    'Set the crosshair tangentially on the middle of each dark ring.',
  ],
  model: {
    equations: [
      { tex: 'I(r) = \\sin^2\\!\\left(\\frac{2\\pi}{\\lambda}\\frac{r^2}{2R}\\right)', caption: 'Reflected intensity computed for every pixel of the view' },
    ],
    assumptions: ['Two-beam interference, normal incidence, perfect contact at the centre.', 'Instrument error (when enabled): crosshair setting σ ≈ 0.005 mm per reading, least count 0.01 mm.'],
    method:
      'The microscope view is drawn from I(r). A reading scans I(r) outward from the centre, counts dark rings as local minima and refines the n-th with a parabola; D is never computed from √(4nλR).',
  },
  parameters: [
    { kind: 'range', key: 'wavelength', label: 'Wavelength λ', unit: 'nm', min: 400, max: 700, step: 0.1, default: 589.3, decimals: 1 },
    { kind: 'range', key: 'radius', label: 'Radius of curvature R', unit: 'm', min: 0.5, max: 2, step: 0.05, default: 1 },
    { kind: 'range', key: 'ring', label: 'Ring number n', unit: '', min: 1, max: 20, step: 1, default: 4 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const lam = p(prm, 'wavelength') * 1e-9
    const R = p(prm, 'radius')
    const n = p(prm, 'ring')
    const D = darkRingDiameter(n, lam, R) * 1000
    return [
      { label: 'Expected diameter Dₙ', value: fixed(D, 3), unit: 'mm', tone: 'theory' },
      { label: 'Dₙ²', value: fixed(D * D, 3), unit: 'mm²', tone: 'theory' },
      { label: 'Film thickness at ring', value: fixed((n * lam) / 2 * 1e9, 0), unit: 'nm', tone: 'theory' },
      { label: 'Expected slope 4λR', value: fixed(4 * lam * R * 1e6, 3), unit: 'mm²', tone: 'theory' },
    ]
  },
  observation: {
    columns: [
      { key: 'n', label: 'n', decimals: 0 },
      { key: 'x1', label: 'x₁ (left)', unit: 'mm', decimals: 2 },
      { key: 'x2', label: 'x₂ (right)', unit: 'mm', decimals: 2 },
      { key: 'D', label: 'D = x₂ − x₁', unit: 'mm', decimals: 2 },
      { key: 'D2', label: 'D²', unit: 'mm²', decimals: 3 },
    ],
    measureLabel: 'Measure ring diameter',
    hint: 'Keep λ and R fixed; measure at least six different ring numbers.',
    minTrials: 6,
    controlKeys: ['wavelength', 'radius'],
    measure: (prm, ctx) => {
      const lamNm = p(prm, 'wavelength')
      const R = p(prm, 'radius')
      const n = p(prm, 'ring')
      const r = findDarkRingRadius(n, lamNm * 1e-9, R) * 1000
      if (!Number.isFinite(r)) return { ok: false, error: 'That ring could not be found in the field of view.' }
      const x1 = leastCount(withNoise(ZERO - r, 0.005, ctx.noise, ctx.gauss), 0.01)
      const x2 = leastCount(withNoise(ZERO + r, 0.005, ctx.noise, ctx.gauss), 0.01)
      const D = x2 - x1
      return { ok: true, row: { n, x1, x2, D, D2: D * D, wavelength: lamNm, radius: R } }
    },
  },
  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'n'), y: num(r, 'D2') }))
    const fit = linearFit(points)
    if (!fit) return null
    const R = num(rows[rows.length - 1], 'radius')
    const set = num(rows[rows.length - 1], 'wavelength')
    const lam = (fit.slope * 1e-6) / (4 * R) * 1e9
    const lamErr = (fit.slopeSE * 1e-6) / (4 * R) * 1e9
    const err = percentError(lam, set)
    return {
      x: { label: 'Ring number n', unit: '' },
      y: { label: 'D²', unit: 'mm²' },
      points,
      fit,
      results: [{ label: 'Wavelength of the light', symbol: '\\lambda', value: lam, uncertainty: lamErr, unit: 'nm', accepted: set, acceptedLabel: 'Source', decimals: 1 }],
      calculations: [
        { label: 'Slope of D² vs n', tex: `\\text{slope} = \\frac{\\Delta D^2}{\\Delta n} = ${sig(fit.slope, 4)}\\ \\mathrm{mm^2}` },
        { label: 'Wavelength', tex: `\\lambda = \\frac{\\text{slope}}{4R} = \\frac{${sig(fit.slope, 4)}\\times10^{-6}}{4 \\times ${R}} = ${fixed(lam, 1)}\\ \\mathrm{nm}` },
        { label: 'Uncertainty from the fit', tex: `\\Delta\\lambda = ${sig(lamErr, 2)}\\ \\mathrm{nm}` },
        { label: 'Percentage error', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings: [],
      conclusion: `D² increases linearly with the ring number (R² = ${fixed(fit.r2, 4)}), confirming D² = 4nλR. The wavelength of the light is λ = ${fixed(lam, 1)} ± ${sig(lamErr, 1)} nm, within ${fixed(err, 1)}% of ${set} nm.`,
    }
  },
  viva,
  assistant,
}
