/**
 * Discharge of a capacitor C through a resistor R:
 *   V(t) = V₀ e^{−t/RC},   I(t) = (V₀/R) e^{−t/RC}
 * Taking logs: ln V = ln V₀ − t/τ with τ = RC, so ln V against t is a straight line of slope −1/τ.
 */
export const timeConstant = (Rohm: number, Cfarad: number) => Rohm * Cfarad

export function dischargeVoltage(t: number, V0: number, Rohm: number, Cfarad: number): number {
  return V0 * Math.exp(-t / timeConstant(Rohm, Cfarad))
}

export function chargeVoltage(t: number, V0: number, Rohm: number, Cfarad: number): number {
  return V0 * (1 - Math.exp(-t / timeConstant(Rohm, Cfarad)))
}
