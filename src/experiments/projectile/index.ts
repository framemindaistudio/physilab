import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { GRAVITY, GRAVITY_OPTIONS, gravityOf } from '@/physics/constants'
import { idealFlightTime, idealMaxHeight, idealRange, simulateTrajectory } from '@/physics/mechanics/projectile'
import { leastCount } from '@/utils/random'
import { linearFit, mean, percentError } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'

export const projectile: ExperimentModule = {
  id: 'projectile',
  number: '02',
  title: 'Projectile Motion',
  category: 'mechanics',
  tagline: 'Launch, land, and read gravity off the range.',
  summary:
    'Fire a projectile at different speeds and angles, measure range, height and time of flight, and verify R = v₀² sin 2θ / g.',
  difficulty: 'Introductory',
  durationMin: 25,

  aim: 'To study the motion of a projectile, verify the range equation R = v₀² sin 2θ / g, and determine g from the measured ranges.',
  objectives: [
    'Measure the horizontal range, maximum height and time of flight for different launch speeds and angles.',
    'Show that the range is proportional to v₀² sin 2θ, and find g from the slope.',
    'Find the launch angle that gives the maximum range.',
    'See how air resistance shortens and skews the trajectory.',
  ],
  apparatusList: [
    'Projectile launcher with adjustable speed and angle scale',
    'Steel ball',
    'Measuring tape (least count 1 cm)',
    'Stopwatch / light gates',
    'Adjustable launch platform',
  ],
  theory: [
    {
      heading: 'Independent horizontal and vertical motion',
      body: [
        'Once launched, the only force on an ideal projectile is its weight. The horizontal velocity v₀ cos θ stays constant, while the vertical velocity changes at a constant rate −g. The two motions are independent and share only the time t.',
        'Eliminating t gives a parabola: the trajectory of every drag-free projectile.',
      ],
      formulas: [
        { tex: 'x = v_0\\cos\\theta\\;t, \\qquad y = h + v_0\\sin\\theta\\;t - \\tfrac12 g t^2', caption: 'Equations of motion' },
        { tex: 'y = h + x\\tan\\theta - \\frac{g\\,x^2}{2v_0^2\\cos^2\\theta}', caption: 'Parabolic trajectory' },
      ],
    },
    {
      heading: 'Range, height and time of flight (level ground)',
      body: [
        'When the landing point is at launch height (h = 0), the time of flight, maximum height and range follow from setting y = 0 and v_y = 0.',
        'The range depends on sin 2θ, which is largest at θ = 45°. Complementary angles (e.g. 30° and 60°) give the same range. Plotting R against v₀² sin 2θ gives a straight line of slope 1/g.',
      ],
      formulas: [
        { tex: 'T = \\frac{2v_0\\sin\\theta}{g}', caption: 'Time of flight' },
        { tex: 'H = \\frac{v_0^2\\sin^2\\theta}{2g}', caption: 'Maximum height' },
        { tex: 'R = \\frac{v_0^2\\sin 2\\theta}{g}', caption: 'Horizontal range' },
      ],
    },
    {
      heading: 'Air resistance',
      body: [
        'Real projectiles feel a drag force roughly proportional to v². Drag removes energy, so the range and height fall, the descent is steeper than the ascent, and the optimum angle drops below 45°. The simulation can switch this on so you can compare with the ideal parabola.',
      ],
      formulas: [{ tex: '\\frac{d\\vec v}{dt} = -g\\,\\hat y - k\\,|\\vec v|\\,\\vec v', caption: 'Quadratic drag (k = drag per unit mass)' }],
    },
  ],
  variables: [
    { symbol: 'v_0', name: 'Launch speed', unit: 'm s⁻¹', role: 'independent' },
    { symbol: '\\theta', name: 'Launch angle', unit: '°', role: 'independent' },
    { symbol: 'R', name: 'Horizontal range', unit: 'm', role: 'dependent' },
    { symbol: 'H', name: 'Maximum height', unit: 'm', role: 'dependent' },
    { symbol: 'T', name: 'Time of flight', unit: 's', role: 'dependent' },
    { symbol: 'h', name: 'Launch height', unit: 'm', role: 'controlled' },
  ],
  procedure: [
    'Keep the launch height at 0 m and air resistance off for the main experiment.',
    'Set v₀ = 15 m/s and θ = 15°. Press Start to fire, then press “Measure landing” to record R, H and T.',
    'Repeat for θ = 30°, 45°, 60° and 75°, then vary v₀ at a fixed angle. Take at least six readings.',
    'In Analysis, plot R against v₀² sin 2θ. The slope is 1/g.',
    'Compare complementary angles and identify the angle of maximum range.',
    'Optional: turn on air resistance and watch the trajectory lose symmetry.',
  ],
  precautions: [
    'Measure the range from the launch point to the first point of impact.',
    'Keep the launch and landing points at the same level when verifying R = v₀² sin 2θ / g.',
    'Read the angle scale at eye level to avoid parallax.',
  ],
  model: {
    equations: [
      { tex: '\\dot x = v_x,\\ \\dot y = v_y,\\ \\dot v_x = -k|v|v_x,\\ \\dot v_y = -g - k|v|v_y', caption: 'Integrated with RK4, Δt = 1 ms' },
    ],
    assumptions: [
      'Point projectile, uniform g, flat ground, no wind or spin.',
      'Drag (when enabled) is quadratic in speed.',
      'Instrument error (when enabled): landing mark ±0.3% of R, tape least count 0.01 m, timing σ ≈ 0.03 s.',
    ],
    method:
      'The trajectory is integrated numerically; the landing instant is found by interpolating the step where y crosses zero. R, H and T are read off that computed trajectory — the closed-form formulas are only used as the theory readouts to compare against.',
  },

  parameters: [
    { kind: 'range', key: 'v0', label: 'Launch speed v₀', unit: 'm/s', min: 5, max: 40, step: 0.5, default: 15 },
    { kind: 'range', key: 'angle', label: 'Launch angle θ', unit: '°', min: 5, max: 85, step: 1, default: 45 },
    { kind: 'range', key: 'height', label: 'Launch height h', unit: 'm', min: 0, max: 30, step: 0.5, default: 0 },
    { kind: 'range', key: 'drag', label: 'Air resistance k', unit: 'm⁻¹', min: 0, max: 0.05, step: 0.002, default: 0, decimals: 3, hint: '0 = vacuum. A cricket ball is about 0.005 m⁻¹.' },
    { kind: 'select', key: 'location', label: 'Location', options: GRAVITY_OPTIONS, default: 'earth' },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const v0 = p(prm, 'v0')
    const th = p(prm, 'angle')
    const h = p(prm, 'height')
    const g = gravityOf(prm.location)
    return [
      { label: 'Ideal range', value: fixed(idealRange(v0, th, h, g), 2), unit: 'm', tone: 'theory' },
      { label: 'Ideal max height', value: fixed(idealMaxHeight(v0, th, h, g), 2), unit: 'm', tone: 'theory' },
      { label: 'Ideal time of flight', value: fixed(idealFlightTime(v0, th, h, g), 2), unit: 's', tone: 'theory' },
      { label: 'v₀² sin 2θ', value: fixed(v0 * v0 * Math.sin((2 * th * Math.PI) / 180), 1), unit: 'm²/s²', tone: 'theory' },
    ]
  },

  observation: {
    columns: [
      { key: 'v0', label: 'v₀', unit: 'm/s', decimals: 1 },
      { key: 'angle', label: 'θ', unit: '°', decimals: 0 },
      { key: 'R', label: 'R', unit: 'm', decimals: 2 },
      { key: 'H', label: 'H', unit: 'm', decimals: 2 },
      { key: 'T', label: 'T', unit: 's', decimals: 2 },
      { key: 'x', label: 'v₀² sin 2θ', unit: 'm²/s²', decimals: 1 },
    ],
    measureLabel: 'Measure landing',
    hint: 'Vary θ and v₀ between shots. Keep h = 0 and air resistance off to test R = v₀² sin 2θ / g.',
    minTrials: 6,
    controlKeys: ['location', 'height', 'drag'],
    measure: (prm, ctx) => {
      const v0 = p(prm, 'v0')
      const th = p(prm, 'angle')
      const h = p(prm, 'height')
      const k = p(prm, 'drag')
      const tr = simulateTrajectory(v0, th, h, gravityOf(prm.location), k)
      const R = leastCount(withNoise(tr.range, tr.range * 0.003, ctx.noise, ctx.gauss), 0.01)
      const H = leastCount(withNoise(tr.maxHeight, tr.maxHeight * 0.005, ctx.noise, ctx.gauss), 0.01)
      const T = leastCount(withNoise(tr.flightTime, 0.03, ctx.noise, ctx.gauss), 0.01)
      return {
        ok: true,
        row: { v0, angle: th, height: h, drag: k, location: String(prm.location), R, H, T, x: v0 * v0 * Math.sin((2 * th * Math.PI) / 180) },
      }
    },
  },

  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'x'), y: num(r, 'R') }))
    const fit = linearFit(points)
    if (!fit) return null
    const g = 1 / fit.slope
    const gErr = (g * fit.slopeSE) / Math.abs(fit.slope)
    const gT = mean(rows.map((r) => (2 * num(r, 'v0') * Math.sin((num(r, 'angle') * Math.PI) / 180)) / num(r, 'T')))
    const last = rows[rows.length - 1]
    const loc = String(last.location)
    const accepted = GRAVITY[loc]?.g ?? 9.81
    const warnings: string[] = []
    if (num(last, 'height') > 0)
      warnings.push('These readings were taken with a raised launch point. R = v₀² sin 2θ / g only holds when launch and landing are at the same level, so g from the slope will be wrong.')
    if (num(last, 'drag') > 0)
      warnings.push('Air resistance was on. Drag shortens the range, so the graph curves and g comes out too large. Turn drag off to verify the ideal law.')
    const best = rows.reduce((a, b) => (num(b, 'R') > num(a, 'R') ? b : a))
    const err = percentError(g, accepted)
    return {
      x: { label: 'v₀² sin 2θ', unit: 'm² s⁻²' },
      y: { label: 'Range R', unit: 'm' },
      points,
      fit,
      results: [
        { label: 'Acceleration due to gravity (from R graph)', symbol: 'g', value: g, uncertainty: gErr, unit: 'm s⁻²', accepted, acceptedLabel: GRAVITY[loc]?.label, decimals: 3 },
        { label: 'g from time of flight, 2v₀ sin θ / T (mean)', symbol: 'g_T', value: gT, unit: 'm s⁻²', accepted, decimals: 3 },
        { label: 'Angle with the longest measured range', symbol: '\\theta_{\\max}', value: num(best, 'angle'), unit: '°', decimals: 0 },
      ],
      calculations: [
        { label: 'Slope of R vs v₀² sin 2θ', tex: `\\text{slope} = \\frac{\\Delta R}{\\Delta(v_0^2\\sin2\\theta)} = ${sig(fit.slope, 4)}\\ \\mathrm{s^2\\,m^{-1}}` },
        { label: 'Acceleration due to gravity', tex: `g = \\frac{1}{\\text{slope}} = ${fixed(g, 3)}\\ \\mathrm{m\\,s^{-2}}` },
        { label: 'Uncertainty from the fit', tex: `\\Delta g = g\\,\\frac{\\sigma_{\\text{slope}}}{\\text{slope}} = ${sig(gErr, 2)}\\ \\mathrm{m\\,s^{-2}}` },
        { label: 'Check using time of flight', tex: `g_T = \\overline{\\left(\\frac{2v_0\\sin\\theta}{T}\\right)} = ${fixed(gT, 3)}\\ \\mathrm{m\\,s^{-2}}` },
        { label: 'Percentage error', tex: `\\frac{|g-g_0|}{g_0}\\times 100 = ${fixed(err, 2)}\\%` },
      ],
      warnings,
      conclusion: `The range varies linearly with v₀² sin 2θ (R² = ${fixed(fit.r2, 4)}), verifying R = v₀² sin 2θ / g. The slope gives g = ${fixed(g, 2)} ± ${sig(gErr, 1)} m s⁻² (${fixed(err, 1)}% from ${accepted} m s⁻²). The longest range was recorded at θ = ${num(best, 'angle')}°.`,
    }
  },
  viva,
  assistant,
}
