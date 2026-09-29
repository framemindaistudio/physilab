import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { ledCurrent, LEDS, thresholdVoltage } from '@/physics/modern/led'
import { ELEMENTARY_E, PLANCK_H, SPEED_C } from '@/physics/constants'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig, texSci } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'

export const planckLed: ExperimentModule = {
  id: 'planck-led',
  number: '12',
  title: "Planck's Constant using LEDs",
  category: 'modern',
  tagline: 'Every colour of LED switches on at its own voltage — and that gives h.',
  summary: 'Find the threshold voltage of LEDs of different colours from their I–V curves, plot it against 1/λ, and obtain Planck’s constant from the slope.',
  difficulty: 'Intermediate',
  durationMin: 25,
  aim: 'To determine Planck’s constant using light-emitting diodes of different wavelengths.',
  objectives: [
    'Plot the I–V characteristic of LEDs of different colours.',
    'Find each LED’s threshold (knee) voltage by extrapolating the linear part of the curve to zero current.',
    'Show that the threshold voltage is proportional to 1/λ.',
    'Determine Planck’s constant from the slope.',
  ],
  apparatusList: ['LEDs: infrared, red, amber, green, blue, violet (known peak wavelengths)', 'Variable DC supply 0–4 V', 'Voltmeter and milliammeter', 'Protective resistor'],
  theory: [
    {
      heading: 'Light from a p–n junction',
      body: [
        'In a forward-biased LED, electrons cross the junction and fall from the conduction band into holes in the valence band. Each such recombination can release one photon whose energy is about the band gap.',
        'Electrons only flow in quantity once the applied voltage gives each of them roughly that much energy. So an LED of shorter wavelength (higher photon energy) needs a higher voltage to light up.',
      ],
      formulas: [
        { tex: 'E = h\\nu = \\frac{hc}{\\lambda}', caption: 'Photon energy' },
        { tex: 'eV_{\\text{th}} \\approx \\frac{hc}{\\lambda}', caption: 'Threshold condition' },
      ],
    },
    {
      heading: 'Threshold voltage and h',
      body: [
        'Above threshold the current rises steeply and almost linearly. Extending this straight part back to I = 0 gives the threshold voltage V_th for each LED.',
        'Plotting V_th against 1/λ gives a straight line through the origin with slope hc/e, so h = e × slope / c.',
      ],
      formulas: [
        { tex: 'V_{\\text{th}} = \\frac{hc}{e}\\cdot\\frac{1}{\\lambda}', caption: 'Linear form' },
        { tex: 'h = \\frac{e\\times\\text{slope}}{c}', caption: 'Planck’s constant from the graph' },
      ],
    },
  ],
  variables: [
    { symbol: '1/\\lambda', name: 'Reciprocal of wavelength', unit: 'µm⁻¹', role: 'independent' },
    { symbol: 'V_{\\text{th}}', name: 'Threshold voltage', unit: 'V', role: 'dependent' },
    { symbol: 'h', name: 'Planck’s constant', unit: 'J s', role: 'constant' },
  ],
  procedure: [
    'Choose an LED and press Start. Raise the supply voltage slowly and watch the current and the I–V curve.',
    'Press “Find threshold voltage”: several readings on the steep part of the curve are fitted and extended to I = 0.',
    'Repeat for every LED colour (at least five).',
    'In Analysis, plot V_th against 1/λ and calculate h from the slope.',
  ],
  precautions: ['Always keep a protective resistor in series with the LED.', 'Do not exceed the LED’s rated current.', 'Use only the steep, straight part of the curve for extrapolation.'],
  model: {
    equations: [
      { tex: 'I = \\frac{s}{r_s}\\ln\\!\\left(1 + e^{(V - V_{\\text{th}})/s}\\right),\\ V_{\\text{th}} = \\frac{hc}{e\\lambda}', caption: 'Smoothed LED characteristic (r_s = 25 Ω, s = 35 mV)' },
    ],
    assumptions: ['Threshold set exactly by the peak photon energy; real LEDs deviate by ~0.1 V.', 'Instrument error (when enabled): ±5 mV and ±0.05 mA meter noise, least counts 0.01 V and 0.01 mA.'],
    method: 'A reading samples the noisy I–V curve at eight voltages on its steep part (4–16 mA), fits a straight line and finds where it crosses I = 0 — the same extrapolation done by hand on graph paper.',
  },
  parameters: [
    { kind: 'select', key: 'led', label: 'LED', default: 'red', options: Object.entries(LEDS).map(([value, l]) => ({ value, label: `${l.label} (${l.nm} nm)` })) },
    { kind: 'range', key: 'voltage', label: 'Supply voltage V', unit: 'V', min: 0, max: 4, step: 0.01, default: 2 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const led = LEDS[String(prm.led)] ?? LEDS.red
    return [
      { label: 'Photon energy hc/λ', value: fixed(1239.84 / led.nm, 3), unit: 'eV', tone: 'theory' },
      { label: 'Expected threshold', value: fixed(thresholdVoltage(led.nm), 3), unit: 'V', tone: 'theory' },
      { label: '1/λ', value: fixed(1000 / led.nm, 4), unit: 'µm⁻¹', tone: 'theory' },
      { label: 'Current', value: fixed(ledCurrent(p(prm, 'voltage'), led.nm) * 1000, 2), unit: 'mA', tone: 'live' },
    ]
  },
  observation: {
    columns: [
      { key: 'lambda', label: 'λ', unit: 'nm', decimals: 0 },
      { key: 'inv', label: '1/λ', unit: 'µm⁻¹', decimals: 4 },
      { key: 'Vth', label: 'V_th', unit: 'V', decimals: 3 },
    ],
    measureLabel: 'Find threshold voltage',
    hint: 'Measure the threshold of at least five different LEDs.',
    minTrials: 5,
    controlKeys: [],
    measure: (prm, ctx) => {
      const key = String(prm.led)
      const led = LEDS[key] ?? LEDS.red
      const V0 = thresholdVoltage(led.nm)
      // Sample the steep part (≈4–16 mA) and extrapolate the straight line to I = 0.
      const pts: { x: number; y: number }[] = []
      for (let k = 0; k < 8; k++) {
        const V = leastCount(withNoise(V0 + 0.1 + k * 0.045, 0.005, ctx.noise, ctx.gauss), 0.01)
        const I = leastCount(withNoise(ledCurrent(V, led.nm) * 1000, 0.05, ctx.noise, ctx.gauss), 0.01)
        pts.push({ x: V, y: I })
      }
      const fit = linearFit(pts)
      if (!fit || fit.slope <= 0) return { ok: false, error: 'Could not fit the steep part of the curve. Try again.' }
      const Vth = -fit.intercept / fit.slope
      return { ok: true, row: { led: key, lambda: led.nm, inv: 1000 / led.nm, Vth } }
    },
  },
  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'inv'), y: num(r, 'Vth') }))
    const fit = linearFit(points)
    if (!fit) return null
    const slopeSI = fit.slope * 1e-6 // V·µm → V·m
    const h = (slopeSI * ELEMENTARY_E) / SPEED_C
    const hErr = (fit.slopeSE * 1e-6 * ELEMENTARY_E) / SPEED_C
    const err = percentError(h, PLANCK_H)
    return {
      x: { label: '1/λ', unit: 'µm⁻¹' },
      y: { label: 'Threshold voltage V_th', unit: 'V' },
      points,
      fit,
      results: [{ label: 'Planck’s constant (e × slope / c)', symbol: 'h', value: h * 1e34, uncertainty: hErr * 1e34, unit: '×10⁻³⁴ J s', accepted: PLANCK_H * 1e34, acceptedLabel: 'CODATA', decimals: 3 }],
      calculations: [
        { label: 'Slope of V_th vs 1/λ', tex: `\\text{slope} = \\frac{hc}{e} = ${sig(fit.slope, 4)}\\ \\mathrm{V\\,\\mu m} = ${texSci(slopeSI, 4)}\\ \\mathrm{V\\,m}` },
        { label: 'Planck’s constant', tex: `h = \\frac{e\\times\\text{slope}}{c} = \\frac{(1.602\\times10^{-19})(${texSci(slopeSI, 4)})}{2.998\\times10^{8}} = ${texSci(h, 4)}\\ \\mathrm{J\\,s}` },
        { label: 'Intercept (ideally zero)', tex: `c = ${fixed(fit.intercept, 3)}\\ \\mathrm V` },
        { label: 'Percentage error', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings: [],
      conclusion: `The threshold voltage is proportional to 1/λ (R² = ${fixed(fit.r2, 4)}): higher-energy photons need a higher voltage. The slope gives h = ${fixed(h * 1e34, 2)} × 10⁻³⁴ J s, ${fixed(err, 1)}% from the accepted 6.626 × 10⁻³⁴ J s.`,
    }
  },
  viva,
  assistant,
}
