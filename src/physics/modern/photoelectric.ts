import { HC_EV_NM, SPEED_C } from '../constants'

/**
 * Photoelectric effect (Einstein, 1905):
 *   E_photon = hc/λ,   KE_max = E_photon − φ,   eV₀ = KE_max
 * Photocurrent model for anode potential V:
 *   • no emission when E_photon ≤ φ, whatever the intensity
 *   • saturation current ∝ photon flux ∝ intensity × λ, times a yield that rises from threshold
 *   • retarding region (V < 0): emitted KE is spread uniformly over [0, KE_max], so the
 *     collected fraction falls linearly to zero at V = −V₀
 *   • accelerating region (V > 0): collection efficiency rises from 0.7 toward 1
 */
export interface Metal {
  label: string
  /** Work function in eV. */
  phi: number
}

export const METALS: Record<string, Metal> = {
  cesium: { label: 'Caesium (Cs)', phi: 2.14 },
  potassium: { label: 'Potassium (K)', phi: 2.29 },
  sodium: { label: 'Sodium (Na)', phi: 2.36 },
  calcium: { label: 'Calcium (Ca)', phi: 2.87 },
  zinc: { label: 'Zinc (Zn)', phi: 4.33 },
  copper: { label: 'Copper (Cu)', phi: 4.65 },
}

export const photonEnergy = (lambdaNm: number) => HC_EV_NM / lambdaNm
export const frequency = (lambdaNm: number) => SPEED_C / (lambdaNm * 1e-9)
export const thresholdWavelength = (phi: number) => HC_EV_NM / phi

export function maxKineticEnergy(lambdaNm: number, phi: number): number {
  return Math.max(0, photonEnergy(lambdaNm) - phi)
}

/** Saturation photocurrent in µA. */
export function saturationCurrent(lambdaNm: number, intensityPct: number, phi: number): number {
  const E = photonEnergy(lambdaNm)
  if (E <= phi) return 0
  const yieldFactor = Math.min(1, (E - phi) / 1.0)
  return 12 * (intensityPct / 100) * (lambdaNm / 400) * yieldFactor
}

/** Photocurrent in µA at anode potential V (volts). */
export function photocurrent(V: number, lambdaNm: number, intensityPct: number, phi: number): number {
  const Isat = saturationCurrent(lambdaNm, intensityPct, phi)
  if (Isat === 0) return 0
  const V0 = maxKineticEnergy(lambdaNm, phi)
  if (V >= 0) return Isat * (1 - 0.3 * Math.exp(-V / 0.4))
  if (-V >= V0) return 0
  return Isat * 0.7 * (1 + V / V0)
}
