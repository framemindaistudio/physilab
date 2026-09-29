import { K_EV } from './bandGap'

/**
 * Four-probe resistivity of an intrinsic semiconductor slab.
 * Current I flows between the outer probes; V is measured across the inner two (spacing s).
 *   ρ₀ = 2πs · V/I                        (semi-infinite sample)
 *   ρ  = ρ₀ / G₇(W/s),  G₇ = (2s/W) ln 2  (thin slab, W ≪ s)
 * Intrinsic conduction:  ρ = A · e^{E_g / 2kT}   →   ln ρ = ln A + (E_g/2k)(1/T)
 */
export interface Crystal {
  label: string
  eg: number
  /** Resistivity at 300 K in Ω m. */
  rho300: number
}

export const CRYSTALS: Record<string, Crystal> = {
  germanium: { label: 'Germanium (intrinsic)', eg: 0.66, rho300: 0.47 },
  insb: { label: 'Indium antimonide (InSb)', eg: 0.17, rho300: 0.0004 },
}

export const PROBE_SPACING = 2e-3 // m
export const THICKNESS = 0.5e-3 // m

export const g7 = (W = THICKNESS, s = PROBE_SPACING) => ((2 * s) / W) * Math.LN2

export function resistivity(Tkelvin: number, c: Crystal): number {
  return c.rho300 * Math.exp((c.eg / (2 * K_EV)) * (1 / Tkelvin - 1 / 300))
}

/** Voltage across the inner probes (V) for current I (A). */
export function probeVoltage(Iamp: number, Tkelvin: number, c: Crystal): number {
  return (resistivity(Tkelvin, c) * Iamp * g7()) / (2 * Math.PI * PROBE_SPACING)
}

export function resistivityFromReading(V: number, Iamp: number): number {
  return ((2 * Math.PI * PROBE_SPACING * V) / Iamp) / g7()
}
