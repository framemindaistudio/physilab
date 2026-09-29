import { BOLTZMANN_K, ELEMENTARY_E } from '../constants'

/**
 * Reverse saturation current of a p–n junction:
 *   I_s = C T³ e^{−E_g / kT}
 * Taking logs: ln(I_s/T³) = ln C − (E_g/k)(1/T), a straight line against 1/T whose
 * slope gives the band gap: E_g = −k × slope.
 */
export interface Material {
  label: string
  /** Band gap in eV at room temperature. */
  eg: number
  /** Prefactor C in A K⁻³ chosen for a realistic reverse current. */
  C: number
}

export const MATERIALS: Record<string, Material> = {
  silicon: { label: 'Silicon (Si)', eg: 1.12, C: 232 },
  germanium: { label: 'Germanium (Ge)', eg: 0.66, C: 4.5e-3 },
}

export const K_EV = BOLTZMANN_K / ELEMENTARY_E // eV/K

export function saturationCurrent(Tkelvin: number, m: Material): number {
  return m.C * Tkelvin ** 3 * Math.exp(-m.eg / (K_EV * Tkelvin))
}
