import { ELEMENTARY_E } from '../constants'

/**
 * Hall effect in a rectangular slab of thickness t carrying current I in a perpendicular field B.
 * Carriers are pushed sideways until the Hall field balances the magnetic force:
 *   V_H = I B / (n q t),   R_H = 1/(n q)
 * q = −e for electrons (n-type), +e for holes (p-type), so the sign of V_H gives the carrier type.
 */
export interface Sample {
  label: string
  /** Carrier density in m⁻³. */
  n: number
  /** +1 for holes (p-type), −1 for electrons (n-type). */
  sign: 1 | -1
  /** Thickness in metres. */
  t: number
}

export const SAMPLES: Record<string, Sample> = {
  'n-ge': { label: 'n-type Germanium', n: 1.0e22, sign: -1, t: 0.5e-3 },
  'p-ge': { label: 'p-type Germanium', n: 2.0e22, sign: 1, t: 0.5e-3 },
  'n-si': { label: 'n-type Silicon', n: 5.0e21, sign: -1, t: 0.5e-3 },
}

export function hallVoltage(Iamp: number, Btesla: number, s: Sample): number {
  return (s.sign * Iamp * Btesla) / (s.n * ELEMENTARY_E * s.t)
}

export const hallCoefficient = (s: Sample) => s.sign / (s.n * ELEMENTARY_E)
