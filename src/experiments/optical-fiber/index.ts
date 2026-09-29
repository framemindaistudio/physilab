import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { acceptanceAngleDeg, criticalAngleDeg, FIBRES, numericalAperture, spotDiameter } from '@/physics/optics/fiber'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'

export const opticalFiber: ExperimentModule = {
  id: 'optical-fiber',
  number: '17',
  title: 'Numerical Aperture of an Optical Fibre',
  category: 'optics',
  tagline: 'Measure the cone of light leaving a fibre to find how much it can accept.',
  summary: 'Measure the diameter of the light spot from an optical fibre on a screen at different distances and determine the numerical aperture and acceptance angle.',
  difficulty: 'Introductory',
  durationMin: 20,
  aim: 'To determine the numerical aperture and acceptance angle of an optical fibre.',
  objectives: [
    'Launch laser light into an optical fibre and observe the output spot on a screen.',
    'Measure the spot diameter W at several fibre-to-screen distances L.',
    'Show that W increases linearly with L.',
    'Determine the acceptance angle θₐ and the numerical aperture NA = sin θₐ.',
  ],
  apparatusList: ['Laser source with launching lens', 'Step-index optical fibre (1–2 m)', 'Screen with mm graph paper', 'Scale to measure L'],
  theory: [
    {
      heading: 'Total internal reflection in a fibre',
      body: [
        'An optical fibre has a core of refractive index n₁ surrounded by a cladding of slightly lower index n₂. Light striking the core–cladding boundary at more than the critical angle is totally reflected and so is guided along the fibre, even around bends.',
        'Only rays that enter the end face within a certain cone are guided; rays outside it hit the boundary below the critical angle and leak into the cladding.',
      ],
      formulas: [
        { tex: '\\sin\\theta_c = \\frac{n_2}{n_1}', caption: 'Critical angle at the core–cladding boundary' },
        { tex: 'NA = \\sin\\theta_a = \\sqrt{n_1^2 - n_2^2}', caption: 'Numerical aperture (launch from air)' },
      ],
    },
    {
      heading: 'Measuring NA from the output cone',
      body: [
        'Light leaves the far end of the fibre in the same cone of half-angle θₐ. On a screen a distance L away it makes a circular spot of diameter W.',
        'Plotting W against L gives a straight line of slope 2 tan θₐ; its intercept is the size of the core. For a single reading, NA = W/√(4L² + W²).',
      ],
      formulas: [
        { tex: 'W = 2L\\tan\\theta_a + d_{\\text{core}}', caption: 'Spot diameter' },
        { tex: 'NA = \\sin\\left[\\tan^{-1}\\!\\left(\\frac{\\text{slope}}{2}\\right)\\right], \\qquad 2\\theta_a = \\text{acceptance angle}', caption: 'NA from the graph' },
      ],
    },
  ],
  variables: [
    { symbol: 'L', name: 'Fibre-end to screen distance', unit: 'mm', role: 'independent' },
    { symbol: 'W', name: 'Spot diameter', unit: 'mm', role: 'dependent' },
    { symbol: 'n_1,\\ n_2', name: 'Core and cladding indices', unit: '—', role: 'constant' },
  ],
  procedure: [
    'Choose the fibre and keep it fixed. Press Start to launch light into the fibre.',
    'Set the screen distance L (e.g. 20 mm) and press “Measure spot” to record the spot diameter W.',
    'Repeat for at least five distances between 10 mm and 100 mm.',
    'In Analysis, plot W against L; NA = sin(tan⁻¹(slope/2)).',
  ],
  precautions: ['Keep the fibre end perpendicular to the screen.', 'Measure the diameter across the brightest part of the spot, in two perpendicular directions.', 'Avoid sharp bends in the fibre.'],
  model: {
    equations: [{ tex: 'W = 2L\\tan\\left(\\sin^{-1}\\sqrt{n_1^2-n_2^2}\\right) + d_{\\text{core}}', caption: 'Spot size from the fibre’s indices' }],
    assumptions: ['Step-index fibre, fully filled acceptance cone.', 'Instrument error (when enabled): spot edge judged to σ ≈ 0.3 mm, scale least count 0.5 mm.'],
    method: 'The spot size comes from the fibre’s refractive indices through the acceptance angle. A reading adds judgement error to W; the analysis recovers NA from the slope, as on paper.',
  },
  parameters: [
    { kind: 'select', key: 'fiber', label: 'Fibre', default: 'silica-mm', options: Object.entries(FIBRES).map(([value, f]) => ({ value, label: f.label })) },
    { kind: 'range', key: 'distance', label: 'Screen distance L', unit: 'mm', min: 10, max: 100, step: 1, default: 30 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const f = FIBRES[String(prm.fiber)] ?? FIBRES['silica-mm']
    return [
      { label: 'NA = √(n₁² − n₂²)', value: fixed(numericalAperture(f), 3), tone: 'theory' },
      { label: 'Acceptance half-angle θₐ', value: fixed(acceptanceAngleDeg(f), 2), unit: '°', tone: 'theory' },
      { label: 'Critical angle θc', value: fixed(criticalAngleDeg(f), 2), unit: '°', tone: 'theory' },
      { label: 'Spot diameter', value: fixed(spotDiameter(p(prm, 'distance') / 1000, f) * 1000, 1), unit: 'mm', tone: 'live' },
    ]
  },
  observation: {
    columns: [
      { key: 'L', label: 'L', unit: 'mm', decimals: 0 },
      { key: 'W', label: 'W', unit: 'mm', decimals: 1 },
      { key: 'na', label: 'NA = W/√(4L²+W²)', decimals: 3 },
    ],
    measureLabel: 'Measure spot',
    hint: 'Keep the fibre fixed; measure the spot at five or more distances.',
    minTrials: 5,
    controlKeys: ['fiber'],
    measure: (prm, ctx) => {
      const f = FIBRES[String(prm.fiber)] ?? FIBRES['silica-mm']
      const L = p(prm, 'distance')
      const W = leastCount(withNoise(spotDiameter(L / 1000, f) * 1000, 0.3, ctx.noise, ctx.gauss), 0.5)
      if (W > 125) return { ok: false, error: 'The spot is larger than the screen. Move the screen closer.' }
      return { ok: true, row: { L, W, na: W / Math.sqrt(4 * L * L + W * W), fiber: String(prm.fiber) } }
    },
  },
  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'L'), y: num(r, 'W') }))
    const fit = linearFit(points)
    if (!fit) return null
    const f = FIBRES[String(rows[rows.length - 1].fiber)] ?? FIBRES['silica-mm']
    const theta = Math.atan(fit.slope / 2)
    const na = Math.sin(theta)
    const naErr = (Math.cos(theta) ** 3 * fit.slopeSE) / 2
    const err = percentError(na, numericalAperture(f))
    return {
      x: { label: 'Screen distance L', unit: 'mm' },
      y: { label: 'Spot diameter W', unit: 'mm' },
      points,
      fit,
      results: [
        { label: 'Numerical aperture', symbol: 'NA', value: na, uncertainty: naErr, unit: '', accepted: numericalAperture(f), acceptedLabel: '√(n₁² − n₂²)', decimals: 3 },
        { label: 'Acceptance angle 2θₐ', symbol: '2\\theta_a', value: (2 * theta * 180) / Math.PI, unit: '°', accepted: 2 * acceptanceAngleDeg(f), decimals: 1 },
        { label: 'Core diameter (intercept)', symbol: 'd', value: fit.intercept, unit: 'mm', decimals: 2 },
      ],
      calculations: [
        { label: 'Slope of W vs L', tex: `\\text{slope} = 2\\tan\\theta_a = ${sig(fit.slope, 4)}` },
        { label: 'Acceptance half-angle', tex: `\\theta_a = \\tan^{-1}\\frac{${sig(fit.slope, 4)}}{2} = ${fixed((theta * 180) / Math.PI, 2)}^\\circ` },
        { label: 'Numerical aperture', tex: `NA = \\sin\\theta_a = ${fixed(na, 3)}` },
        { label: 'Theory', tex: `\\sqrt{n_1^2 - n_2^2} = \\sqrt{${f.n1}^2 - ${f.n2}^2} = ${fixed(numericalAperture(f), 3)}` },
        { label: 'Percentage error', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings: [],
      conclusion: `The spot diameter grows linearly with distance (R² = ${fixed(fit.r2, 4)}). The fibre’s numerical aperture is NA = ${fixed(na, 3)} (theory ${fixed(numericalAperture(f), 3)}) and its acceptance angle is 2θₐ = ${fixed((2 * theta * 180) / Math.PI, 1)}°.`,
    }
  },
  viva,
  assistant,
}
