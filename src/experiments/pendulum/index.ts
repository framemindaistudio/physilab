import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { GRAVITY, GRAVITY_OPTIONS, gravityOf } from '@/physics/constants'
import { exactPeriod, smallAnglePeriod, timeOscillations } from '@/physics/mechanics/pendulum'
import { rad } from '@/physics/numerics'
import { leastCount } from '@/utils/random'
import { linearFit, mean, percentError } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'

const FOUR_PI2 = 4 * Math.PI * Math.PI
const N_OSC = 10

export const pendulum: ExperimentModule = {
  id: 'pendulum',
  number: '01',
  title: 'Simple Pendulum',
  category: 'mechanics',
  tagline: 'Find g from how a swinging bob keeps time.',
  summary:
    'Time ten oscillations at several string lengths, plot T² against L and extract the acceleration due to gravity from the slope.',
  difficulty: 'Introductory',
  durationMin: 25,

  aim: 'To determine the acceleration due to gravity (g) using a simple pendulum, by studying how its period depends on its length.',
  objectives: [
    'Measure the time period T of a simple pendulum for different effective lengths L.',
    'Show that T² is directly proportional to L.',
    'Determine g from the slope of the T²–L graph.',
    'Verify that the period does not depend on the mass of the bob, and see how large amplitudes break the small-angle law.',
  ],
  apparatusList: [
    'Rigid support with split cork',
    'Inextensible light string',
    'Metallic bob (mass adjustable)',
    'Digital stopwatch (least count 0.01 s)',
    'Metre scale and protractor',
  ],
  theory: [
    {
      heading: 'Restoring force',
      body: [
        'A bob of mass m hanging from a string of length L is displaced by an angle θ. Gravity has a component mg sin θ along the arc, always pointing back towards the mean position. Newton’s second law along the arc gives the equation of motion below.',
        'For small angles (θ in radians, θ ≲ 0.17 rad ≈ 10°) sin θ ≈ θ, and the motion becomes simple harmonic with angular frequency ω = √(g/L).',
      ],
      formulas: [
        { tex: 'mL\\frac{d^2\\theta}{dt^2} = -mg\\sin\\theta', caption: 'Equation of motion (exact)' },
        { tex: '\\frac{d^2\\theta}{dt^2} \\approx -\\frac{g}{L}\\,\\theta', caption: 'Small-angle approximation' },
      ],
    },
    {
      heading: 'Period and the T²–L graph',
      body: [
        'The period of the simple harmonic motion depends only on L and g — not on the mass of the bob and (for small swings) not on the amplitude.',
        'Squaring shows that T² is a straight-line function of L passing through the origin. The slope of the T²–L graph is 4π²/g, so g follows directly from the slope. Using a graph averages out random timing errors across all trials.',
      ],
      formulas: [
        { tex: 'T = 2\\pi\\sqrt{\\frac{L}{g}}', caption: 'Period of a simple pendulum' },
        { tex: 'T^2 = \\frac{4\\pi^2}{g}\\,L', caption: 'Linear form used for the graph' },
        { tex: 'g = \\frac{4\\pi^2}{\\text{slope}}', caption: 'g from the slope of T² vs L' },
      ],
    },
    {
      heading: 'Beyond small angles',
      body: [
        'The exact period grows with amplitude θ₀. To first order T ≈ T₀(1 + θ₀²/16). At 10° the period is only 0.19% longer, but at 30° it is 1.7% longer — enough to bias g noticeably. The simulation integrates the exact equation, so this effect appears in your data if you swing too wide.',
      ],
      formulas: [{ tex: 'T = \\frac{2\\pi\\sqrt{L/g}}{\\operatorname{AGM}\\!\\left(1,\\cos\\frac{\\theta_0}{2}\\right)} \\approx T_0\\left(1+\\frac{\\theta_0^2}{16}\\right)', caption: 'Exact period (arithmetic–geometric mean form)' }],
    },
  ],
  variables: [
    { symbol: 'L', name: 'Effective length (pivot to centre of bob)', unit: 'm', role: 'independent' },
    { symbol: 'T', name: 'Time period', unit: 's', role: 'dependent' },
    { symbol: 'm', name: 'Mass of bob', unit: 'g', role: 'controlled' },
    { symbol: '\\theta_0', name: 'Amplitude', unit: '°', role: 'controlled' },
    { symbol: 'g', name: 'Acceleration due to gravity', unit: 'm s⁻²', role: 'constant' },
  ],
  procedure: [
    'Set the effective length L to about 0.40 m and keep the amplitude small (≤ 10°).',
    'Press Start and let the bob swing. Press “Time 10 oscillations” — the stopwatch starts as the bob passes the mean position and stops after ten complete oscillations.',
    'The reading is entered in the observation table along with T = t/10 and T².',
    'Increase L in steps of about 0.20 m up to 1.60 m and repeat. Take at least five readings.',
    'Open Analysis: plot T² against L, draw the best-fit line and compute g from its slope.',
    'Optional: change the mass at a fixed length and confirm that T does not change; then try θ₀ = 30° and compare.',
  ],
  precautions: [
    'Keep the amplitude small so the motion is simple harmonic.',
    'Measure L to the centre of the bob, not to its top.',
    'Time many oscillations and divide, to reduce the effect of reaction time.',
    'Start and stop timing as the bob passes the mean position, where it moves fastest.',
  ],
  model: {
    equations: [
      { tex: '\\ddot\\theta = -\\frac{g}{L}\\sin\\theta', caption: 'Integrated exactly — no small-angle approximation' },
      { tex: 't_{10} = \\text{time between 1st and 21st mean-position crossing}', caption: 'How a reading is taken' },
    ],
    assumptions: [
      'Point mass bob on a massless, inextensible string; rigid pivot.',
      'No air resistance or pivot friction.',
      'Instrument error (when enabled): human reaction time σ ≈ 0.10 s on each timing, stopwatch least count 0.01 s.',
    ],
    method:
      'The animation and every reading use the same fourth-order Runge–Kutta integration of the full non-linear equation of motion. A reading is taken by counting zero crossings of θ(t) in the simulation — exactly what a student does with a stopwatch — so T is measured, not looked up from 2π√(L/g).',
  },

  parameters: [
    { kind: 'range', key: 'length', label: 'Effective length L', unit: 'm', min: 0.2, max: 2.0, step: 0.05, default: 1.0 },
    { kind: 'range', key: 'mass', label: 'Mass of bob m', unit: 'g', min: 20, max: 500, step: 10, default: 100 },
    { kind: 'range', key: 'amplitude', label: 'Amplitude θ₀', unit: '°', min: 2, max: 45, step: 1, default: 8, hint: 'Keep ≤ 10° for simple harmonic motion.' },
    { kind: 'select', key: 'location', label: 'Laboratory location', options: GRAVITY_OPTIONS, default: 'earth' },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const L = p(prm, 'length')
    const g = gravityOf(prm.location)
    const t0 = smallAnglePeriod(L, g)
    const t = exactPeriod(L, g, rad(p(prm, 'amplitude')))
    return [
      { label: 'Small-angle period T₀', value: fixed(t0, 3), unit: 's', tone: 'theory' },
      { label: 'Exact period at θ₀', value: fixed(t, 3), unit: 's', tone: 'theory' },
      { label: 'Amplitude correction', value: `+${fixed(((t - t0) / t0) * 100, 2)}`, unit: '%', tone: 'theory' },
      { label: 'Angular frequency ω', value: fixed(Math.sqrt(g / L), 3), unit: 'rad/s', tone: 'theory' },
    ]
  },

  observation: {
    columns: [
      { key: 'length', label: 'L', unit: 'm', decimals: 2 },
      { key: 'mass', label: 'm', unit: 'g', decimals: 0 },
      { key: 'amplitude', label: 'θ₀', unit: '°', decimals: 0 },
      { key: 't10', label: 't (10 osc.)', unit: 's', decimals: 2 },
      { key: 'T', label: 'T = t/10', unit: 's', decimals: 3 },
      { key: 'T2', label: 'T²', unit: 's²', decimals: 3 },
    ],
    measureLabel: 'Time 10 oscillations',
    hint: 'Change L between readings. Five or more lengths from 0.2 m to 2.0 m give a good graph.',
    minTrials: 5,
    controlKeys: ['location'],
    measure: (prm, ctx) => {
      const L = p(prm, 'length')
      const g = gravityOf(prm.location)
      const exact = timeOscillations(L, g, rad(p(prm, 'amplitude')), N_OSC)
      if (!Number.isFinite(exact)) return { ok: false, error: 'The pendulum did not complete ten oscillations. Reduce the amplitude.' }
      // Two reaction-time errors (start and stop) of ~0.07 s each combine to ~0.1 s.
      const t10 = leastCount(Math.max(0.01, withNoise(exact, 0.1, ctx.noise, ctx.gauss)), 0.01)
      const T = t10 / N_OSC
      return {
        ok: true,
        row: { length: L, mass: p(prm, 'mass'), amplitude: p(prm, 'amplitude'), location: String(prm.location), t10, T, T2: T * T },
      }
    },
  },

  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'length'), y: num(r, 'T2') }))
    const fit = linearFit(points)
    if (!fit) return null
    const g = FOUR_PI2 / fit.slope
    const gErr = (g * fit.slopeSE) / Math.abs(fit.slope)
    const perTrial = rows.map((r) => (FOUR_PI2 * num(r, 'length')) / num(r, 'T2'))
    const gMean = mean(perTrial)
    const loc = String(rows[rows.length - 1].location)
    const accepted = GRAVITY[loc]?.g ?? 9.81
    const warnings: string[] = []
    const maxAmp = Math.max(...rows.map((r) => num(r, 'amplitude')))
    if (maxAmp > 15)
      warnings.push(`Some readings used θ₀ up to ${maxAmp}°. Large amplitudes lengthen the period, so T² is too big and g comes out low.`)
    const err = percentError(g, accepted)
    return {
      x: { label: 'Length L', unit: 'm' },
      y: { label: 'T²', unit: 's²' },
      points,
      fit,
      results: [
        { label: 'Acceleration due to gravity (from slope)', symbol: 'g', value: g, uncertainty: gErr, unit: 'm s⁻²', accepted, acceptedLabel: `${GRAVITY[loc]?.label ?? 'Earth'} standard`, decimals: 3 },
        { label: 'Mean of individual trials 4π²L/T²', symbol: '\\bar g', value: gMean, unit: 'm s⁻²', accepted, decimals: 3 },
      ],
      calculations: [
        { label: 'Slope of the best-fit line', tex: `\\text{slope} = \\frac{\\Delta T^2}{\\Delta L} = ${fixed(fit.slope, 4)}\\ \\mathrm{s^2\\,m^{-1}}` },
        { label: 'Acceleration due to gravity', tex: `g = \\frac{4\\pi^2}{\\text{slope}} = \\frac{39.478}{${fixed(fit.slope, 4)}} = ${fixed(g, 3)}\\ \\mathrm{m\\,s^{-2}}` },
        { label: 'Uncertainty from the fit', tex: `\\Delta g = g\\,\\frac{\\sigma_{\\text{slope}}}{\\text{slope}} = ${sig(gErr, 2)}\\ \\mathrm{m\\,s^{-2}}` },
        { label: 'Intercept (ideally zero)', tex: `c = ${fixed(fit.intercept, 4)}\\ \\mathrm{s^2}` },
        { label: 'Percentage error', tex: `\\frac{|g - g_0|}{g_0}\\times100 = ${fixed(err, 2)}\\%` },
      ],
      warnings,
      conclusion: `The graph of T² against L is a straight line through the origin (R² = ${fixed(fit.r2, 4)}), confirming T ∝ √L. The acceleration due to gravity is g = ${fixed(g, 2)} ± ${sig(gErr, 1)} m s⁻², within ${fixed(err, 1)}% of the accepted ${accepted} m s⁻².`,
    }
  },
  viva,
}
