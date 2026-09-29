import { HC_EV_NM } from '../constants'

/**
 * Silicon photodiode.
 *   I(V, P) = I_s (e^{V/nV_T} − 1) − I_ph,     I_ph = ℛ · P
 * Responsivity ℛ = η e λ / (h c) = η λ / 1239.84 (A/W, λ in nm), with quantum efficiency η.
 * In reverse bias the current is almost independent of V and equals −(I_ph + I_dark).
 */
export interface Source {
  label: string
  nm: number
  /** Quantum efficiency of the photodiode at this wavelength. */
  eta: number
}

export const SOURCES: Record<string, Source> = {
  red: { label: 'Red LED 650 nm', nm: 650, eta: 0.62 },
  nir: { label: 'Near-IR 850 nm', nm: 850, eta: 0.8 },
  ir: { label: 'Infrared 940 nm', nm: 940, eta: 0.72 },
}

export const DARK_CURRENT = 2e-9 // A
const N_IDEAL = 1.05
const VT = 0.02585

export const responsivity = (s: Source) => (s.eta * s.nm) / HC_EV_NM

/** Diode current (A, positive = forward) at bias V (volts) and optical power P (watts). */
export function photodiodeCurrent(V: number, Pw: number, s: Source): number {
  return DARK_CURRENT * (Math.exp(Math.min(V, 0.7) / (N_IDEAL * VT)) - 1) - responsivity(s) * Pw
}
