/**
 * Malus's law: plane-polarised light of intensity I₀ passing through an analyser whose
 * transmission axis makes angle θ with the polarisation gives I = I₀ cos²θ.
 * A small unpolarised background (stray light) adds a constant term.
 */
export function transmitted(I0: number, thetaDeg: number, background = 0): number {
  const c = Math.cos((thetaDeg * Math.PI) / 180)
  return I0 * c * c + background
}
