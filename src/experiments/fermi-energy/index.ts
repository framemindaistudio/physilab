import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { fermiEnergyFromSlope, fermiVelocity, METALS, resistivity, resistivitySlope } from '@/physics/modern/fermi'
import { leastCount } from '@/utils/random'
import { linearFit, percentError } from '@/utils/stats'
import { fixed, sig, texSci } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'
import { assistant } from './assistant'
import { WIRE_AREA, WIRE_LENGTH } from './model'

export const fermiEnergy: ExperimentModule = {
  id: 'fermi-energy',
  number: '15',
  title: 'Fermi Energy of a Conductor',
  category: 'modern',
  tagline: 'Warm a copper coil and read the energy of its fastest electrons from dR/dT.',
  summary: 'Measure the resistance of a metal wire at different temperatures and use the free-electron model to find its Fermi velocity and Fermi energy.',
  difficulty: 'Advanced',
  durationMin: 30,
  aim: 'To determine the Fermi energy of a metal (copper) from the variation of its resistance with temperature.',
  objectives: [
    'Measure the resistance of a metal wire from about 30 °C to 90 °C.',
    'Show that R increases linearly with temperature.',
    'Relate the slope dR/dT to the Fermi velocity using the free-electron model.',
    'Calculate the Fermi energy E_F = ½ m v_F².',
  ],
  apparatusList: ['Copper wire coil (10 m, Ø 0.20 mm)', 'Water/oil bath with heater', 'Thermometer', 'Digital ohmmeter / Wheatstone bridge (least count 0.001 Ω)'],
  theory: [
    {
      heading: 'Free electrons and the Fermi level',
      body: [
        'In a metal the valence electrons are free to move through the lattice. Because electrons obey the Pauli exclusion principle, they fill the available energy states one by one; at absolute zero every state is filled up to the Fermi energy E_F and every state above it is empty.',
        'At a temperature T only electrons within about kT of E_F can change their state. These electrons, moving at the Fermi velocity v_F, carry the current and are scattered by lattice vibrations.',
      ],
      formulas: [
        { tex: 'f(E) = \\frac{1}{e^{(E-E_F)/kT} + 1}', caption: 'Fermi–Dirac occupation probability' },
        { tex: 'E_F = \\tfrac12 m v_F^2', caption: 'Fermi energy and Fermi velocity' },
      ],
    },
    {
      heading: 'Resistivity and temperature',
      body: [
        'In the free-electron (Drude–Sommerfeld) model the resistivity depends on the Fermi velocity and the mean free path λ between collisions. Above room temperature λ is limited by lattice vibrations and is inversely proportional to T, so ρ rises linearly with temperature.',
        'The slope of R against T therefore measures v_F. With the given electron density n and mean free path λ₀ at T₀ = 300 K, the Fermi energy follows.',
      ],
      formulas: [
        { tex: '\\rho = \\frac{m v_F}{n e^2 \\lambda}, \\qquad \\lambda = \\lambda_0\\frac{T_0}{T}', caption: 'Free-electron resistivity' },
        { tex: '\\frac{d\\rho}{dT} = \\frac{A}{L}\\frac{dR}{dT}, \\qquad v_F = \\frac{n e^2 \\lambda_0 T_0}{m}\\,\\frac{d\\rho}{dT}', caption: 'Fermi velocity from the slope' },
      ],
    },
  ],
  variables: [
    { symbol: 'T', name: 'Temperature', unit: '°C', role: 'independent' },
    { symbol: 'R', name: 'Resistance of the wire', unit: 'Ω', role: 'dependent' },
    { symbol: 'L,\\ A', name: 'Length and cross-section of the wire', unit: 'm, m²', role: 'constant' },
    { symbol: 'n,\\ \\lambda_0', name: 'Electron density; mean free path at 300 K', unit: 'm⁻³, nm', role: 'constant' },
  ],
  procedure: [
    'Choose the metal and keep it fixed.',
    'Set the bath temperature (start near 30 °C) and press “Read resistance”.',
    'Raise the temperature in steps of about 10 °C up to 90 °C, recording R each time.',
    'In Analysis, plot R against T. From the slope find dρ/dT, then v_F and E_F.',
  ],
  precautions: ['Stir the bath and wait for a steady temperature before each reading.', 'Keep the measuring current small to avoid self-heating.', 'Keep the whole coil immersed.'],
  model: {
    equations: [
      { tex: 'R(T) = \\frac{L}{A}\\cdot\\frac{m v_F}{n e^2 \\lambda_0 T_0}\\,T', caption: 'Resistance from the free-electron model (T in kelvin)' },
    ],
    assumptions: ['Given data: Cu n = 8.47×10²⁸ m⁻³, λ(300 K) = 39 nm; Ag 5.86×10²⁸, 53 nm; Al 18.1×10²⁸, 15 nm.', 'Residual (impurity) resistance neglected.', 'Instrument error (when enabled): 0.02% gain and ±0.5 mΩ noise, least count 1 mΩ.'],
    method: 'The ohmmeter reads R(T) from the model; the Fermi–Dirac curve is drawn for the bath temperature. The analysis inverts the same relation to recover E_F from your slope.',
  },
  parameters: [
    { kind: 'select', key: 'metal', label: 'Metal', default: 'copper', options: Object.entries(METALS).map(([value, mm]) => ({ value, label: mm.label })) },
    { kind: 'range', key: 'temperature', label: 'Bath temperature', unit: '°C', min: 30, max: 90, step: 1, default: 30 },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const m = METALS[String(prm.metal)] ?? METALS.copper
    const T = p(prm, 'temperature') + 273.15
    return [
      { label: 'Resistance', value: fixed((resistivity(T, m) * WIRE_LENGTH) / WIRE_AREA, 3), unit: 'Ω', tone: 'live' },
      { label: 'Resistivity ρ', value: fixed(resistivity(T, m) * 1e8, 3), unit: '×10⁻⁸ Ω m', tone: 'theory' },
      { label: 'Fermi velocity', value: fixed(fermiVelocity(m.ef) / 1e6, 3), unit: '×10⁶ m/s', tone: 'theory' },
      { label: 'Expected dR/dT', value: fixed((resistivitySlope(m) * WIRE_LENGTH) / WIRE_AREA * 1000, 2), unit: 'mΩ/K', tone: 'theory' },
    ]
  },
  observation: {
    columns: [
      { key: 'T_C', label: 'T', unit: '°C', decimals: 0 },
      { key: 'T_K', label: 'T', unit: 'K', decimals: 2 },
      { key: 'R', label: 'R', unit: 'Ω', decimals: 3 },
    ],
    measureLabel: 'Read resistance',
    hint: 'Keep the metal fixed; read R from 30 °C to 90 °C in steps of about 10 °C.',
    minTrials: 6,
    controlKeys: ['metal'],
    measure: (prm, ctx) => {
      const m = METALS[String(prm.metal)] ?? METALS.copper
      const Tc = p(prm, 'temperature')
      const R0 = (resistivity(Tc + 273.15, m) * WIRE_LENGTH) / WIRE_AREA
      const R = leastCount(withNoise(R0 * (1 + (ctx.noise ? 0.0002 * ctx.gauss() : 0)), 0.0005, ctx.noise, ctx.gauss), 0.001)
      return { ok: true, row: { T_C: Tc, T_K: Tc + 273.15, R, metal: String(prm.metal) } }
    },
  },
  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'T_C'), y: num(r, 'R') }))
    const fit = linearFit(points)
    if (!fit) return null
    const m = METALS[String(rows[rows.length - 1].metal)] ?? METALS.copper
    const drhoDT = (fit.slope * WIRE_AREA) / WIRE_LENGTH
    const ef = fermiEnergyFromSlope(drhoDT, m)
    const efErr = ef * 2 * (fit.slopeSE / fit.slope) // E_F ∝ slope²
    const vF = Math.sqrt((2 * ef * 1.602176634e-19) / 9.1093837015e-31)
    const err = percentError(ef, m.ef)
    return {
      x: { label: 'Temperature T', unit: '°C' },
      y: { label: 'Resistance R', unit: 'Ω' },
      points,
      fit,
      results: [
        { label: `Fermi energy of ${m.label}`, symbol: 'E_F', value: ef, uncertainty: efErr, unit: 'eV', accepted: m.ef, acceptedLabel: 'Free-electron value', decimals: 2 },
        { label: 'Fermi velocity', symbol: 'v_F', value: vF / 1e6, unit: '×10⁶ m s⁻¹', accepted: fermiVelocity(m.ef) / 1e6, decimals: 3 },
      ],
      calculations: [
        { label: 'Slope of R vs T', tex: `\\frac{dR}{dT} = ${sig(fit.slope * 1000, 4)}\\ \\mathrm{m\\Omega\\,K^{-1}}` },
        { label: 'Slope of resistivity', tex: `\\frac{d\\rho}{dT} = \\frac{A}{L}\\frac{dR}{dT} = ${texSci(drhoDT, 4)}\\ \\Omega\\,\\mathrm{m\\,K^{-1}}` },
        { label: 'Fermi velocity', tex: `v_F = \\frac{n e^2 \\lambda_0 T_0}{m}\\frac{d\\rho}{dT} = ${texSci(vF, 4)}\\ \\mathrm{m\\,s^{-1}}` },
        { label: 'Fermi energy', tex: `E_F = \\tfrac12 m v_F^2 = ${fixed(ef, 3)}\\ \\mathrm{eV}` },
        { label: 'Percentage error', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings: [],
      conclusion: `The resistance of the wire rises linearly with temperature (R² = ${fixed(fit.r2, 4)}), as expected when lattice vibrations limit the electrons’ mean free path. The slope gives v_F = ${(vF / 1e6).toFixed(2)} × 10⁶ m/s and a Fermi energy of ${fixed(ef, 2)} eV for ${m.label} (free-electron value ${m.ef} eV).`,
    }
  },
  viva,
  assistant,
}
