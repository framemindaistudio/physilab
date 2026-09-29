import { HC_EV_NM } from '../constants'

/**
 * Light-emitting diode. An electron crossing the junction gives up roughly the band-gap
 * energy as one photon: eV_th ≈ hc/λ. Above threshold the I–V curve is steep and almost
 * straight (limited by the series resistance), so V_th is found by extrapolating that line to I = 0.
 *
 * Model: I = (V − V_th)/r_s for V well above threshold, smoothly joined to zero below it:
 *   I = (s/r_s)·ln(1 + e^{(V − V_th)/s})   (softplus, s = rounding of the knee)
 */
export interface Led {
  label: string
  nm: number
}

export const LEDS: Record<string, Led> = {
  infrared: { label: 'Infrared', nm: 940 },
  red: { label: 'Red', nm: 630 },
  amber: { label: 'Amber', nm: 590 },
  green: { label: 'Green', nm: 525 },
  blue: { label: 'Blue', nm: 470 },
  violet: { label: 'Violet', nm: 405 },
}

export const LED_SERIES_R = 25 // Ω, internal series resistance of the LED
const KNEE = 0.035 // V, rounding of the knee

/** Threshold voltage set by the photon energy. */
export const thresholdVoltage = (nm: number) => HC_EV_NM / nm

export function ledCurrent(V: number, nm: number): number {
  const x = (V - thresholdVoltage(nm)) / KNEE
  const soft = x > 30 ? x : Math.log1p(Math.exp(x))
  return (KNEE / LED_SERIES_R) * soft
}
