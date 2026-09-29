import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { componentImpedance } from '@/physics/electromagnetism/lcr'
import { leastCount } from '@/utils/random'
import { linearFit, mean, percentError, stdDev } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'
import { BOXES, KIND_NAME, SOURCE_V } from './model'

export const blackBox: ExperimentModule = {
  id: 'black-box',
  number: '20',
  title: 'Identify the Components in a Black Box',
  category: 'electromagnetism',
  tagline: 'Is it a resistor, an inductor or a capacitor? Let its impedance tell you.',
  summary: 'Measure the impedance of each sealed box at several frequencies. How Z changes with f identifies the component, and the slope gives its value.',
  difficulty: 'Intermediate',
  durationMin: 25,
  aim: 'To identify the passive component (R, L or C) inside a black box and estimate its value from its AC behaviour.',
  objectives: [
    'Measure the current through each box for a fixed AC voltage at different frequencies.',
    'Calculate the impedance Z = V/I at each frequency.',
    'Identify the component from how Z varies with f (and from the phase of the current).',
    'Estimate the value of R, L or C.',
  ],
  apparatusList: ['Three sealed boxes A, B, C', 'Signal generator (5 V rms, 50–2000 Hz)', 'AC milliammeter and voltmeter', 'Dual-trace oscilloscope'],
  theory: [
    {
      heading: 'How R, L and C respond to AC',
      body: [
        'A resistor opposes current equally at all frequencies, and its current is in phase with the voltage.',
        'An inductor’s opposition, its reactance, grows in proportion to frequency, and its current lags the voltage by 90°. A capacitor’s reactance is inversely proportional to frequency, and its current leads the voltage by 90°. (A capacitor also blocks DC completely.)',
      ],
      formulas: [
        { tex: 'Z_R = R', caption: 'Independent of f; in phase' },
        { tex: 'Z_L = 2\\pi f L', caption: 'Proportional to f; current lags' },
        { tex: 'Z_C = \\frac{1}{2\\pi f C}', caption: 'Proportional to 1/f; current leads' },
      ],
    },
    {
      heading: 'Identifying the component and its value',
      body: [
        'Plot Z against f. A flat line means a resistor (value = Z). A straight line through the origin means an inductor, with slope 2πL. If Z falls with f, plot Z against 1/f: a straight line through the origin means a capacitor, with slope 1/(2πC).',
      ],
      formulas: [
        { tex: 'L = \\frac{\\text{slope of } Z \\text{ vs } f}{2\\pi}', caption: 'Inductance' },
        { tex: 'C = \\frac{1}{2\\pi\\times\\text{slope of } Z \\text{ vs } 1/f}', caption: 'Capacitance' },
      ],
    },
  ],
  variables: [
    { symbol: 'f', name: 'Frequency', unit: 'Hz', role: 'independent' },
    { symbol: 'Z', name: 'Impedance V/I', unit: 'Ω', role: 'dependent' },
    { symbol: 'V', name: 'Supply voltage (rms)', unit: 'V', role: 'controlled' },
  ],
  procedure: [
    'Choose a box. Press Start and look at the oscilloscope: is the current in phase with, ahead of, or behind the voltage?',
    'Set a frequency and press “Measure impedance”. Repeat at five or more frequencies between 50 Hz and 2000 Hz.',
    'Open Analysis: PHYSILAB tests which law your readings follow and gives the component and its value.',
    'Repeat for the other two boxes.',
  ],
  precautions: ['Keep the supply voltage constant.', 'Use a wide range of frequencies so the trend is clear.', 'Do not open the boxes!'],
  model: {
    equations: [{ tex: 'Z = R,\\quad \\sqrt{r^2 + (2\\pi fL)^2},\\quad \\frac{1}{2\\pi fC}', caption: 'The inductor has a small winding resistance r' }],
    assumptions: ['Each box holds one ideal component (the inductor includes 12 Ω of winding resistance).', 'Instrument error (when enabled): 0.3% meter noise, least count 0.01 mA.'],
    method: 'The meters read V/Z from the hidden component’s impedance. The analysis compares three models — Z constant, Z ∝ f and Z ∝ 1/f — on your readings, picks the best fit and extracts the value from its slope.',
  },
  parameters: [
    {
      kind: 'select',
      key: 'box',
      label: 'Black box',
      default: 'A',
      options: [
        { value: 'A', label: 'Box A' },
        { value: 'B', label: 'Box B' },
        { value: 'C', label: 'Box C' },
      ],
    },
    { kind: 'range', key: 'frequency', label: 'Frequency f', unit: 'Hz', min: 50, max: 2000, step: 10, default: 100 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const comp = BOXES[String(prm.box)] ?? BOXES.A
    const { Z } = componentImpedance(comp, p(prm, 'frequency'))
    return [
      { label: 'Current', value: fixed((SOURCE_V / Z) * 1000, 2), unit: 'mA', tone: 'live' },
      { label: 'Impedance V/I', value: fixed(Z, 1), unit: 'Ω', tone: 'live' },
      { label: 'Supply voltage', value: fixed(SOURCE_V, 2), unit: 'V rms', tone: 'theory' },
      { label: 'Angular frequency ω', value: fixed(2 * Math.PI * p(prm, 'frequency'), 0), unit: 'rad/s', tone: 'theory' },
    ]
  },
  observation: {
    columns: [
      { key: 'f', label: 'f', unit: 'Hz', decimals: 0 },
      { key: 'I', label: 'I', unit: 'mA', decimals: 2 },
      { key: 'Z', label: 'Z = V/I', unit: 'Ω', decimals: 1 },
      { key: 'invf', label: '1/f', unit: 'ms', decimals: 3 },
    ],
    measureLabel: 'Measure impedance',
    hint: 'One box at a time; measure at five or more frequencies from 50 to 2000 Hz.',
    minTrials: 5,
    controlKeys: ['box'],
    measure: (prm, ctx) => {
      const comp = BOXES[String(prm.box)] ?? BOXES.A
      const f = p(prm, 'frequency')
      const { Z } = componentImpedance(comp, f)
      const mA = leastCount(withNoise((SOURCE_V / Z) * 1000 * (1 + (ctx.noise ? 0.003 * ctx.gauss() : 0)), 0.005, ctx.noise, ctx.gauss), 0.01)
      if (mA <= 0) return { ok: false, error: 'The current is too small to read at this frequency.' }
      return { ok: true, row: { f, I: mA, Z: (SOURCE_V / mA) * 1000, invf: 1000 / f, box: String(prm.box) } }
    },
  },
  analyze: (rows) => {
    if (rows.length < 3) return null
    const box = String(rows[rows.length - 1].box)
    const truth = BOXES[box] ?? BOXES.A
    const Zs = rows.map((r) => num(r, 'Z'))
    const cv = stdDev(Zs) / mean(Zs)
    const fitF = linearFit(rows.map((r) => ({ x: num(r, 'f'), y: num(r, 'Z') })))
    const fitInv = linearFit(rows.map((r) => ({ x: num(r, 'invf'), y: num(r, 'Z') })))
    if (!fitF || !fitInv) return null
    let kind: 'R' | 'L' | 'C'
    if (cv < 0.03) kind = 'R'
    else kind = fitF.slope > 0 && fitF.r2 >= fitInv.r2 ? 'L' : 'C'
    const name = KIND_NAME[kind]
    const correct = kind === truth.kind
    if (kind === 'R') {
      const R = mean(Zs)
      return {
        x: { label: 'Frequency f', unit: 'Hz' },
        y: { label: 'Impedance Z', unit: 'Ω' },
        points: rows.map((r) => ({ x: num(r, 'f'), y: num(r, 'Z') })),
        // A flat line has no meaningful slope or R², so the points are simply joined.
        connectPoints: true,
        results: [{ label: `Box ${box}: ${name} — resistance`, symbol: 'R', value: R, uncertainty: stdDev(Zs) / Math.sqrt(Zs.length), unit: 'Ω', accepted: truth.kind === 'R' ? truth.R : undefined, acceptedLabel: 'Revealed value', decimals: 1 }],
        calculations: [
          { label: 'Spread of Z with frequency', tex: `\\frac{\\sigma_Z}{\\bar Z} = ${fixed(cv * 100, 2)}\\% \\ (<3\\%\\Rightarrow \\text{independent of } f)` },
          { label: 'Resistance', tex: `R = \\bar Z = ${fixed(R, 1)}\\ \\Omega` },
        ],
        warnings: correct ? [] : ['The readings do not match a single ideal component well — take more readings over a wider frequency range.'],
        conclusion: `Box ${box} has the same impedance at every frequency (spread ${fixed(cv * 100, 1)}%) and the current is in phase with the voltage, so it contains a resistor of about ${fixed(R, 0)} Ω.`,
      }
    }
    if (kind === 'L') {
      const L = fitF.slope / (2 * Math.PI)
      return {
        x: { label: 'Frequency f', unit: 'Hz' },
        y: { label: 'Impedance Z', unit: 'Ω' },
        points: rows.map((r) => ({ x: num(r, 'f'), y: num(r, 'Z') })),
        fit: fitF,
        results: [{ label: `Box ${box}: ${name} — inductance`, symbol: 'L', value: L * 1000, uncertainty: (fitF.slopeSE / (2 * Math.PI)) * 1000, unit: 'mH', accepted: truth.kind === 'L' ? truth.L * 1000 : undefined, acceptedLabel: 'Revealed value', decimals: 1 }],
        calculations: [
          { label: 'Which law fits?', tex: `R^2(Z\\text{ vs }f) = ${fixed(fitF.r2, 4)} \\ > \\ R^2(Z\\text{ vs }1/f) = ${fixed(fitInv.r2, 4)}` },
          { label: 'Slope of Z vs f', tex: `\\text{slope} = 2\\pi L = ${sig(fitF.slope, 4)}\\ \\Omega\\,\\mathrm{s}` },
          { label: 'Inductance', tex: `L = \\frac{\\text{slope}}{2\\pi} = ${fixed(L * 1000, 1)}\\ \\mathrm{mH}` },
        ],
        warnings: correct ? [] : ['The identification is uncertain — measure over a wider frequency range.'],
        conclusion: `The impedance of box ${box} rises in proportion to frequency (R² = ${fixed(fitF.r2, 4)}) and the current lags the voltage: it contains an inductor of about ${fixed(L * 1000, 0)} mH.`,
      }
    }
    // x is 1/f in ms, so Z = (1/2πC)·(x/1000): the slope per ms is 1/(2πC·1000).
    const K = fitInv.slope * 1000 // Ω·Hz
    const C = 1 / (2 * Math.PI * K)
    return {
      x: { label: '1/f', unit: 'ms' },
      y: { label: 'Impedance Z', unit: 'Ω' },
      points: rows.map((r) => ({ x: num(r, 'invf'), y: num(r, 'Z') })),
      fit: fitInv,
      results: [{ label: `Box ${box}: ${name} — capacitance`, symbol: 'C', value: C * 1e6, uncertainty: C * 1e6 * (fitInv.slopeSE / fitInv.slope), unit: 'µF', accepted: truth.kind === 'C' ? truth.C * 1e6 : undefined, acceptedLabel: 'Revealed value', decimals: 3 }],
      calculations: [
        { label: 'Which law fits?', tex: `R^2(Z\\text{ vs }1/f) = ${fixed(fitInv.r2, 4)} \\ > \\ R^2(Z\\text{ vs }f) = ${fixed(fitF.r2, 4)}` },
        { label: 'Slope of Z vs 1/f', tex: `\\text{slope} = \\frac{1}{2\\pi C} = ${sig(K, 4)}\\ \\Omega\\,\\mathrm{Hz}` },
        { label: 'Capacitance', tex: `C = \\frac{1}{2\\pi\\times\\text{slope}} = ${fixed(C * 1e6, 3)}\\ \\mu\\mathrm F` },
        ...(truth.kind === 'C' ? [{ label: 'Percentage error', tex: `${fixed(percentError(C, truth.C), 2)}\\%` }] : []),
      ],
      warnings: correct ? [] : ['The identification is uncertain — measure over a wider frequency range.'],
      conclusion: `The impedance of box ${box} is inversely proportional to frequency (R² = ${fixed(fitInv.r2, 4)} against 1/f) and the current leads the voltage: it contains a capacitor of about ${fixed(C * 1e6, 2)} µF.`,
    }
  },
  viva,
  assistant,
}
