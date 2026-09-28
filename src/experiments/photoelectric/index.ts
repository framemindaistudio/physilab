import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { frequency, METALS, photocurrent, photonEnergy, thresholdWavelength } from '@/physics/modern/photoelectric'
import { ELEMENTARY_E, PLANCK_H } from '@/physics/constants'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig, texSci } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'

export const photoelectric: ExperimentModule = {
  id: 'photoelectric',
  number: '06',
  title: 'Photoelectric Effect',
  category: 'modern',
  tagline: "Measure Planck's constant from the stopping potential.",
  summary:
    'Illuminate a metal with light of different frequencies, find the stopping potential for each, and extract Planck’s constant and the work function from V₀ against ν.',
  difficulty: 'Advanced',
  durationMin: 35,

  aim: 'To study the photoelectric effect, verify Einstein’s photoelectric equation, and determine Planck’s constant and the work function of the cathode metal.',
  objectives: [
    'Obtain the I–V characteristic of a photocell and identify saturation current and stopping potential.',
    'Show that the stopping potential depends on frequency but not on intensity.',
    'Plot stopping potential against frequency and determine h from the slope.',
    'Determine the work function φ and threshold frequency ν₀ from the intercept.',
  ],
  apparatusList: [
    'Vacuum photocell with interchangeable cathode',
    'Monochromatic source, 200–650 nm (mercury lamp + filters / tunable source)',
    'Variable DC supply −3 V to +5 V (anode potential)',
    'Micro-ammeter (least count 0.001 µA)',
    'Digital voltmeter (least count 0.01 V)',
  ],
  theory: [
    {
      heading: 'Light as photons',
      body: [
        'Classical wave theory predicted that brighter light of any colour should eventually eject electrons, with energy growing with intensity. Experiments showed otherwise: below a threshold frequency no electrons are emitted however bright the light, and above it the maximum electron energy depends only on frequency.',
        'Einstein (1905) explained this by treating light as a stream of photons of energy hν. One photon gives all its energy to one electron; the electron spends at least the work function φ escaping the metal and leaves with the rest as kinetic energy.',
      ],
      formulas: [
        { tex: 'E = h\\nu = \\frac{hc}{\\lambda}', caption: 'Photon energy' },
        { tex: 'K_{\\max} = h\\nu - \\phi', caption: 'Einstein’s photoelectric equation' },
      ],
    },
    {
      heading: 'Stopping potential',
      body: [
        'If the anode is made negative, electrons are repelled. The current falls as the retarding potential increases, and becomes zero at the stopping potential V₀, when even the fastest electrons are turned back.',
        'Rearranging gives a straight line: V₀ against ν has slope h/e and intercept −φ/e. The frequency where V₀ = 0 is the threshold frequency ν₀ = φ/h.',
      ],
      formulas: [
        { tex: 'eV_0 = K_{\\max} = h\\nu - \\phi', caption: 'Stopping potential' },
        { tex: 'V_0 = \\frac{h}{e}\\,\\nu - \\frac{\\phi}{e}', caption: 'Linear form used for the graph' },
        { tex: 'h = e \\times \\text{slope}, \\quad \\phi = -e \\times \\text{intercept}', caption: 'Results from the graph' },
      ],
    },
    {
      heading: 'Intensity and saturation current',
      body: [
        'More intense light means more photons per second, so more electrons per second and a larger saturation current. It does not change the energy of each photon, so V₀ is unchanged. Emission is also instantaneous — no time lag for energy to accumulate.',
      ],
    },
  ],
  variables: [
    { symbol: '\\nu', name: 'Frequency of light', unit: '10¹⁴ Hz', role: 'independent' },
    { symbol: 'V_0', name: 'Stopping potential', unit: 'V', role: 'dependent' },
    { symbol: '\\phi', name: 'Work function of cathode', unit: 'eV', role: 'controlled' },
    { symbol: 'I', name: 'Light intensity', unit: '%', role: 'controlled' },
  ],
  procedure: [
    'Choose a cathode metal and keep it fixed. Set the intensity to about 60%.',
    'Press Start. Sweep the anode potential from +5 V down to −3 V and watch the photocurrent and the I–V curve.',
    'Press “Find stopping potential”: the retarding voltage is increased in 0.01 V steps until the micro-ammeter reads zero.',
    'Repeat for at least five wavelengths (e.g. 254, 313, 365, 405, 436 nm) above the threshold.',
    'Change only the intensity at one wavelength and confirm that V₀ does not change.',
    'In Analysis, plot V₀ against ν; find h from the slope and φ from the intercept.',
  ],
  precautions: [
    'Shield the photocell from stray room light.',
    'Allow the lamp to stabilise before taking readings.',
    'Approach the stopping potential slowly and read the current at the most sensitive range.',
    'Use only wavelengths above the threshold; otherwise there is no current to stop.',
  ],
  model: {
    equations: [
      { tex: 'K_{\\max} = \\frac{hc}{\\lambda} - \\phi', caption: 'Photoelectron energy (hc = 1239.84 eV nm)' },
      { tex: 'I(V) = I_{\\text{sat}}\\cdot 0.7\\left(1 - \\frac{|V|}{V_0}\\right),\\ -V_0 < V < 0', caption: 'Retarding region: KE uniformly spread over [0, K_max]' },
    ],
    assumptions: [
      'Work functions: Cs 2.14, K 2.29, Na 2.36, Ca 2.87, Zn 4.33, Cu 4.65 eV. Anode work-function (contact potential) neglected.',
      'Saturation current ∝ intensity × λ (photon flux) × a yield rising from zero at threshold.',
      'Instrument error (when enabled): micro-ammeter noise σ = 0.002 µA, voltmeter judgement ±0.01 V.',
    ],
    method:
      'The ammeter, the I–V curve and the electron animation all use the same photocurrent function. A stopping-potential reading steps the anode voltage down from 0 V in 0.01 V increments and records the first voltage at which the (noisy, 0.001 µA resolution) ammeter reads zero — the way it is done on a real bench.',
  },

  parameters: [
    { kind: 'range', key: 'wavelength', label: 'Wavelength λ', unit: 'nm', min: 200, max: 650, step: 1, default: 405 },
    { kind: 'range', key: 'intensity', label: 'Intensity', unit: '%', min: 0, max: 100, step: 5, default: 60 },
    {
      kind: 'select',
      key: 'metal',
      label: 'Cathode metal',
      default: 'sodium',
      options: Object.entries(METALS).map(([value, m]) => ({ value, label: `${m.label} — φ = ${m.phi} eV` })),
    },
    { kind: 'range', key: 'voltage', label: 'Anode potential V', unit: 'V', min: -3, max: 5, step: 0.01, default: 1 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const lam = p(prm, 'wavelength')
    const metal = METALS[String(prm.metal)] ?? METALS.sodium
    return [
      { label: 'Frequency ν', value: fixed(frequency(lam) / 1e14, 3), unit: '×10¹⁴ Hz', tone: 'theory' },
      { label: 'Photon energy hν', value: fixed(photonEnergy(lam), 3), unit: 'eV', tone: 'theory' },
      { label: 'Threshold wavelength', value: fixed(thresholdWavelength(metal.phi), 0), unit: 'nm', tone: 'theory' },
      { label: 'Photocurrent', value: fixed(photocurrent(p(prm, 'voltage'), lam, p(prm, 'intensity'), metal.phi), 3), unit: 'µA', tone: 'live' },
    ]
  },

  observation: {
    columns: [
      { key: 'lambda', label: 'λ', unit: 'nm', decimals: 0 },
      { key: 'nu', label: 'ν', unit: '×10¹⁴ Hz', decimals: 3 },
      { key: 'intensity', label: 'Intensity', unit: '%', decimals: 0 },
      { key: 'Isat', label: 'I at +5 V', unit: 'µA', decimals: 3 },
      { key: 'V0', label: 'V₀', unit: 'V', decimals: 2 },
    ],
    measureLabel: 'Find stopping potential',
    hint: 'Use at least five wavelengths shorter than the threshold. Keep the same cathode metal.',
    minTrials: 5,
    controlKeys: ['metal'],
    measure: (prm, ctx) => {
      const lam = p(prm, 'wavelength')
      const inten = p(prm, 'intensity')
      const metal = METALS[String(prm.metal)] ?? METALS.sodium
      if (inten === 0) return { ok: false, error: 'The lamp is off (intensity 0%). Increase the intensity.' }
      const read = (V: number) => Math.max(0, leastCount(withNoise(photocurrent(V, lam, inten, metal.phi), 0.002, ctx.noise, ctx.gauss), 0.001))
      // Emission is decided by the physics, not by meter noise around zero.
      if (photocurrent(5, lam, inten, metal.phi) === 0)
        return {
          ok: false,
          error: `No photocurrent at any voltage: ${lam} nm photons carry ${fixed(photonEnergy(lam), 2)} eV, less than φ = ${metal.phi} eV. Use a wavelength shorter than ${fixed(thresholdWavelength(metal.phi), 0)} nm.`,
        }
      const Isat = read(5)
      let V = 0
      while (V > -10 && read(V) > 0) V = Math.round((V - 0.01) * 100) / 100
      const V0 = Math.max(0, leastCount(withNoise(-V, 0.01, ctx.noise, ctx.gauss), 0.01))
      return {
        ok: true,
        row: { metal: String(prm.metal), lambda: lam, nu: frequency(lam) / 1e14, intensity: inten, Isat, V0 },
      }
    },
  },

  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'nu'), y: num(r, 'V0') }))
    const fit = linearFit(points)
    if (!fit) return null
    const metalKey = String(rows[rows.length - 1].metal)
    const metal = METALS[metalKey] ?? METALS.sodium
    const hExp = (fit.slope * ELEMENTARY_E) / 1e14
    const hErr = (fit.slopeSE * ELEMENTARY_E) / 1e14
    const phiExp = -fit.intercept
    const phiErr = fit.interceptSE
    const nu0 = -fit.intercept / fit.slope
    const err = percentError(hExp, PLANCK_H)
    const warnings: string[] = []
    const intensities = new Set(rows.map((r) => num(r, 'intensity')))
    if (intensities.size > 1) warnings.push('Readings were taken at different intensities. That is fine — V₀ does not depend on intensity — but the saturation currents are not comparable.')
    return {
      x: { label: 'Frequency ν', unit: '×10¹⁴ Hz' },
      y: { label: 'Stopping potential V₀', unit: 'V' },
      points,
      fit,
      results: [
        { label: 'Planck’s constant (e × slope)', symbol: 'h', value: hExp * 1e34, uncertainty: hErr * 1e34, unit: '×10⁻³⁴ J s', accepted: PLANCK_H * 1e34, acceptedLabel: 'CODATA', decimals: 3 },
        { label: `Work function of ${metal.label}`, symbol: '\\phi', value: phiExp, uncertainty: phiErr, unit: 'eV', accepted: metal.phi, acceptedLabel: 'Tabulated', decimals: 3 },
        { label: 'Threshold frequency', symbol: '\\nu_0', value: nu0, unit: '×10¹⁴ Hz', accepted: (metal.phi * ELEMENTARY_E) / PLANCK_H / 1e14, decimals: 3 },
      ],
      calculations: [
        { label: 'Slope of V₀ vs ν', tex: `\\text{slope} = \\frac{\\Delta V_0}{\\Delta\\nu} = ${sig(fit.slope, 4)}\\ \\mathrm{V}/(10^{14}\\,\\mathrm{Hz}) = ${texSci(fit.slope / 1e14, 4)}\\ \\mathrm{V\\,s}` },
        { label: 'Planck’s constant', tex: `h = e\\times\\text{slope} = (1.602\\times10^{-19})(${texSci(fit.slope / 1e14, 4)}) = ${texSci(hExp, 4)}\\ \\mathrm{J\\,s}` },
        { label: 'Work function', tex: `\\phi = -e\\times\\text{intercept} = ${fixed(phiExp, 3)}\\ \\mathrm{eV}` },
        { label: 'Threshold frequency', tex: `\\nu_0 = \\frac{\\phi}{h} = -\\frac{\\text{intercept}}{\\text{slope}} = ${fixed(nu0, 3)}\\times10^{14}\\ \\mathrm{Hz}\\ (\\lambda_0 = ${fixed(2997.92458 / nu0, 0)}\\ \\mathrm{nm})` },
        { label: 'Percentage error in h', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings,
      conclusion: `The stopping potential increases linearly with frequency (R² = ${fixed(fit.r2, 4)}), verifying Einstein’s equation eV₀ = hν − φ. The slope gives h = ${fixed(hExp * 1e34, 2)} × 10⁻³⁴ J s (${fixed(err, 1)}% from 6.626 × 10⁻³⁴ J s) and the intercept gives φ = ${fixed(phiExp, 2)} eV for ${metal.label} (tabulated ${metal.phi} eV).`,
    }
  },
  viva,
}

