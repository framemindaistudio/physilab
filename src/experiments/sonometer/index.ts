import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { findResonance, fundamental, resonantLength, response, waveSpeed } from '@/physics/waves/sonometer'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'
import { FORKS, muOf, Q, tensionOf, WIRES } from './model'

export const sonometer: ExperimentModule = {
  id: 'sonometer',
  number: '10',
  title: 'Sonometer',
  category: 'waves',
  tagline: 'Tune a stretched wire to a tuning fork and find the speed of waves on it.',
  summary: 'Find the resonant length of a stretched wire for several tuning forks, verify f ∝ 1/L, and determine the wave speed and the wire’s mass per unit length.',
  difficulty: 'Intermediate',
  durationMin: 30,
  aim: 'To verify the law of length of a vibrating string (f ∝ 1/L) and determine the linear mass density of the wire using a sonometer.',
  objectives: [
    'Obtain resonance between a stretched wire and tuning forks of different frequencies.',
    'Show that the resonant length L is inversely proportional to the frequency.',
    'Determine the speed of transverse waves on the wire from the slope of L against 1/f.',
    'Calculate the linear mass density μ of the wire.',
  ],
  apparatusList: ['Sonometer with two bridges and a pulley', 'Set of tuning forks (256–512 Hz)', 'Slotted masses and hanger', 'Paper rider', 'Metre scale'],
  theory: [
    {
      heading: 'Transverse waves on a stretched string',
      body: [
        'A wave travels along a string under tension T with a speed set by the tension and the mass per unit length μ: a tighter or lighter string carries waves faster.',
        'Between two bridges the wave reflects back and forth, forming a standing wave with a node at each bridge. In the fundamental mode the vibrating length L is half a wavelength.',
      ],
      formulas: [
        { tex: 'v = \\sqrt{\\frac{T}{\\mu}}', caption: 'Wave speed on a string' },
        { tex: 'L = \\frac{\\lambda}{2}', caption: 'Fundamental mode' },
      ],
    },
    {
      heading: 'Laws of vibrating strings and resonance',
      body: [
        'Combining v = fλ with λ = 2L gives the fundamental frequency. It is inversely proportional to the length (law of length), and proportional to √T and to 1/√μ.',
        'When the stem of a vibrating fork touches the box, the wire is forced at the fork’s frequency. At the length where the wire’s own frequency equals the fork’s, it resonates strongly and the paper rider is thrown off. Plotting L against 1/f gives a straight line of slope v/2.',
      ],
      formulas: [
        { tex: 'f = \\frac{1}{2L}\\sqrt{\\frac{T}{\\mu}}', caption: 'Fundamental frequency' },
        { tex: 'L = \\frac{v}{2}\\cdot\\frac{1}{f}, \\quad \\mu = \\frac{T}{v^2}', caption: 'Wave speed and μ from the graph' },
      ],
    },
  ],
  variables: [
    { symbol: 'f', name: 'Tuning-fork frequency', unit: 'Hz', role: 'independent' },
    { symbol: 'L', name: 'Resonant length', unit: 'cm', role: 'dependent' },
    { symbol: 'T', name: 'Tension (mg)', unit: 'N', role: 'controlled' },
    { symbol: '\\mu', name: 'Mass per unit length', unit: 'g m⁻¹', role: 'constant' },
  ],
  procedure: [
    'Choose the wire and the hanging mass, and keep both fixed.',
    'Pick a tuning fork and press Start to strike it.',
    'Slide the movable bridge until the wire vibrates strongly and the paper rider jumps off, then press “Record resonance”.',
    'Repeat with every tuning fork (at least five).',
    'In Analysis, plot L against 1/f. The slope is v/2; from v find μ = T/v².',
  ],
  precautions: ['Place the paper rider at the middle of the vibrating length.', 'Press the fork’s stem gently on the box — do not let the prongs touch the wire.', 'Approach resonance slowly from both sides.'],
  model: {
    equations: [
      { tex: 'A(L) \\propto \\frac{1}{\\sqrt{(1 - x^2)^2 + (x/Q)^2}},\\ x = \\frac{f}{f_1(L)}', caption: 'Driven response of the wire’s fundamental mode (Q = 30)' },
    ],
    assumptions: ['Ideal flexible string, fixed nodes at the bridges, fundamental mode only.', 'Instrument error (when enabled): scale least count 0.1 cm, setting σ ≈ 0.1 cm.'],
    method: 'The wire’s vibration amplitude comes from the driven-oscillator response. A reading is only possible near resonance; it then finds the exact peak of the response (as the student fine-tunes the bridge) and reads it on the scale.',
  },
  parameters: [
    { kind: 'select', key: 'fork', label: 'Tuning fork', default: '256', options: FORKS.map((f) => ({ value: f, label: `${f} Hz` })) },
    { kind: 'range', key: 'length', label: 'Bridge separation L', unit: 'cm', min: 10, max: 100, step: 0.1, default: 50, hint: 'Slide until the rider jumps off.' },
    { kind: 'range', key: 'mass', label: 'Hanging mass', unit: 'kg', min: 1, max: 6, step: 0.5, default: 3 },
    { kind: 'select', key: 'wire', label: 'Wire', default: 'medium', options: Object.entries(WIRES).map(([value, w]) => ({ value, label: w.label })) },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const T = tensionOf(p(prm, 'mass'))
    const mu = muOf(prm.wire)
    const L = p(prm, 'length') / 100
    return [
      { label: 'Tension T = mg', value: fixed(T, 2), unit: 'N', tone: 'theory' },
      { label: 'Wave speed √(T/μ)', value: fixed(waveSpeed(T, mu), 1), unit: 'm/s', tone: 'theory' },
      { label: 'Wire’s f₁ at this L', value: fixed(fundamental(L, T, mu), 1), unit: 'Hz', tone: 'theory' },
      { label: 'Response', value: fixed(response(p(prm, 'fork'), L, T, mu, Q) * 100, 0), unit: '%', tone: 'live' },
    ]
  },
  observation: {
    columns: [
      { key: 'f', label: 'f', unit: 'Hz', decimals: 1 },
      { key: 'invf', label: '1/f', unit: 'ms', decimals: 4 },
      { key: 'L', label: 'L', unit: 'cm', decimals: 1 },
      { key: 'fL', label: 'f × L', unit: 'Hz m', decimals: 1 },
    ],
    measureLabel: 'Record resonance',
    hint: 'Keep the mass and wire fixed; find resonance for at least five forks.',
    minTrials: 5,
    controlKeys: ['mass', 'wire'],
    measure: (prm, ctx) => {
      const f = p(prm, 'fork')
      const T = tensionOf(p(prm, 'mass'))
      const mu = muOf(prm.wire)
      const L = p(prm, 'length') / 100
      const target = resonantLength(f, T, mu)
      if (target < 0.1 || target > 1.0)
        return { ok: false, error: `The resonant length for ${f} Hz is outside the 10–100 cm scale with this tension. Change the hanging mass.` }
      if (response(f, L, T, mu, Q) < 0.5) {
        const shorter = fundamental(L, T, mu) < f
        return { ok: false, error: `No resonance at ${(L * 100).toFixed(1)} cm — the rider does not move. Slide the bridge to make the wire ${shorter ? 'shorter' : 'longer'}.` }
      }
      const Lres = findResonance(f, T, mu)
      const Lcm = leastCount(withNoise(Lres * 100, 0.1, ctx.noise, ctx.gauss), 0.1)
      return { ok: true, row: { f, invf: 1000 / f, L: Lcm, fL: (f * Lcm) / 100, mass: p(prm, 'mass'), wire: String(prm.wire) } }
    },
  },
  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'invf'), y: num(r, 'L') }))
    const fit = linearFit(points)
    if (!fit) return null
    const last = rows[rows.length - 1]
    const T = tensionOf(num(last, 'mass'))
    const muSet = muOf(last.wire)
    const v = 20 * fit.slope // (cm/ms) × 2 → m/s: 2 × slope × 0.01/0.001
    const vErr = 20 * fit.slopeSE
    const mu = T / (v * v)
    const err = percentError(mu, muSet)
    return {
      x: { label: '1/f', unit: 'ms' },
      y: { label: 'Resonant length L', unit: 'cm' },
      points,
      fit,
      results: [
        { label: 'Wave speed on the wire (2 × slope)', symbol: 'v', value: v, uncertainty: vErr, unit: 'm s⁻¹', accepted: waveSpeed(T, muSet), acceptedLabel: '√(T/μ)', decimals: 1 },
        { label: 'Linear mass density μ = T/v²', symbol: '\\mu', value: mu * 1000, unit: 'g m⁻¹', accepted: muSet * 1000, acceptedLabel: 'Wire specification', decimals: 3 },
      ],
      calculations: [
        { label: 'Slope of L vs 1/f', tex: `\\text{slope} = ${sig(fit.slope, 4)}\\ \\mathrm{cm\\,ms^{-1}} = ${sig(fit.slope * 10, 4)}\\ \\mathrm{m\\,s^{-1}}` },
        { label: 'Wave speed', tex: `v = 2 \\times \\text{slope} = ${fixed(v, 1)}\\ \\mathrm{m\\,s^{-1}}` },
        { label: 'Tension', tex: `T = mg = ${num(last, 'mass')} \\times 9.81 = ${fixed(T, 2)}\\ \\mathrm N` },
        { label: 'Mass per unit length', tex: `\\mu = \\frac{T}{v^2} = \\frac{${fixed(T, 2)}}{${fixed(v, 1)}^2} = ${fixed(mu * 1000, 3)}\\ \\mathrm{g\\,m^{-1}}` },
        { label: 'Percentage error in μ', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings: [],
      conclusion: `The resonant length is proportional to 1/f (R² = ${fixed(fit.r2, 4)}), verifying the law of length f ∝ 1/L. The wave speed on the wire is ${fixed(v, 1)} m/s, giving μ = ${fixed(mu * 1000, 3)} g/m (specification ${fixed(muSet * 1000, 2)} g/m).`,
    }
  },
  viva,
  assistant,
}
