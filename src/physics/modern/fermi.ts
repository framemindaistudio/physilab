import { BOLTZMANN_K, ELECTRON_MASS, ELEMENTARY_E } from '../constants'

/**
 * Fermi energy from the temperature dependence of a metal's resistance (free-electron model).
 *
 * Drude–Sommerfeld resistivity:  ρ = m v_F / (n e² λ)
 * Above the Debye temperature, phonon scattering makes the mean free path λ ∝ 1/T,
 * i.e. λ·T = λ₀T₀ (a material constant). Then
 *   ρ(T) = [m v_F / (n e² λ₀T₀)] · T   →   dρ/dT = m v_F / (n e² λ₀T₀)
 * so the measured slope dR/dT gives the Fermi velocity, and E_F = ½ m v_F².
 */
export interface Metal {
  label: string
  /** Fermi energy in eV (free-electron value). */
  ef: number
  /** Free-electron density in m⁻³. */
  n: number
  /** Mean free path at 300 K in metres. */
  mfp300: number
}

export const METALS: Record<string, Metal> = {
  copper: { label: 'Copper (Cu)', ef: 7.0, n: 8.47e28, mfp300: 39e-9 },
  silver: { label: 'Silver (Ag)', ef: 5.49, n: 5.86e28, mfp300: 53e-9 },
  aluminium: { label: 'Aluminium (Al)', ef: 11.7, n: 18.1e28, mfp300: 15e-9 },
}

export const fermiVelocity = (efEv: number) => Math.sqrt((2 * efEv * ELEMENTARY_E) / ELECTRON_MASS)

/** dρ/dT in Ω m K⁻¹ predicted by the model. */
export function resistivitySlope(m: Metal): number {
  return (ELECTRON_MASS * fermiVelocity(m.ef)) / (m.n * ELEMENTARY_E ** 2 * m.mfp300 * 300)
}

export const resistivity = (Tkelvin: number, m: Metal) => resistivitySlope(m) * Tkelvin

/** Invert a measured dρ/dT back to the Fermi energy (eV). */
export function fermiEnergyFromSlope(drhoDT: number, m: Metal): number {
  const vF = (drhoDT * m.n * ELEMENTARY_E ** 2 * m.mfp300 * 300) / ELECTRON_MASS
  return (0.5 * ELECTRON_MASS * vF * vF) / ELEMENTARY_E
}

/** Fermi–Dirac occupation probability. */
export function fermiDirac(eEv: number, efEv: number, Tkelvin: number): number {
  const kT = (BOLTZMANN_K * Tkelvin) / ELEMENTARY_E
  return 1 / (Math.exp((eEv - efEv) / kT) + 1)
}
