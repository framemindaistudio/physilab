import { bisect } from '../numerics'
import { BOLTZMANN_K, ELEMENTARY_E } from '../constants'

/**
 * DC circuit: a variable supply (EMF Vs, internal resistance r) drives a device
 * through an ammeter; a voltmeter reads the potential difference across the device.
 *
 *  • resistor  — ohmic, V = IR
 *  • lamp      — tungsten filament whose resistance rises with dissipated power,
 *                R = R₀(1 + κP), P = V²/R  →  R = ½(R₀ + √(R₀² + 4R₀κV²))
 *  • diode     — Shockley equation I = I_s(e^{V/nV_T} − 1), with a 100 Ω series resistor
 */
export type Device = 'resistor' | 'lamp' | 'diode'

export const SUPPLY_R_INT = 0.5 // Ω
export const LAMP_R0 = 2.0 // Ω (cold filament)
export const LAMP_KAPPA = 5.0 // 1/W
export const DIODE_IS = 4e-9 // A
export const DIODE_N = 1.9
export const DIODE_SERIES_R = 100 // Ω
export const ROOM_T = 300 // K

export const thermalVoltage = (T = ROOM_T) => (BOLTZMANN_K * T) / ELEMENTARY_E

export function lampResistance(V: number): number {
  return (LAMP_R0 + Math.sqrt(LAMP_R0 * LAMP_R0 + 4 * LAMP_R0 * LAMP_KAPPA * V * V)) / 2
}

export function diodeCurrent(V: number): number {
  return DIODE_IS * (Math.exp(V / (DIODE_N * thermalVoltage())) - 1)
}

export interface CircuitSolution {
  /** Voltage across the device (V). */
  V: number
  /** Current through the device (A). */
  I: number
  /** Device resistance V/I at this operating point (Ω). */
  R: number
  /** Power dissipated in the device (W). */
  P: number
}

export function solveCircuit(Vs: number, device: Device, R: number): CircuitSolution {
  if (Vs <= 0) {
    return { V: 0, I: 0, R: device === 'resistor' ? R : device === 'lamp' ? LAMP_R0 : Infinity, P: 0 }
  }
  let V: number
  let I: number
  if (device === 'resistor') {
    I = Vs / (R + SUPPLY_R_INT)
    V = I * R
  } else if (device === 'lamp') {
    // Vs = V + I·r with I = V/R(V): monotonic in V.
    V = bisect((v) => v + (v / lampResistance(v)) * SUPPLY_R_INT - Vs, 0, Vs)
    I = V / lampResistance(V)
  } else {
    const rs = DIODE_SERIES_R + SUPPLY_R_INT
    V = bisect((v) => v + diodeCurrent(v) * rs - Vs, 0, Math.min(Vs, 2))
    I = diodeCurrent(V)
  }
  return { V, I, R: I > 0 ? V / I : Infinity, P: V * I }
}
