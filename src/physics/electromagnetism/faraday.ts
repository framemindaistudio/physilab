import { MU_0 } from '../constants'

/**
 * A bar magnet (magnetic dipole, moment m) moves along the axis of a flat circular
 * coil of N turns and radius a at constant speed v.
 *
 * Exact flux of a point dipole through a coaxial loop, magnet at axial distance z:
 *   Φ(z) = μ₀ m a² / (2 (a² + z²)^{3/2})
 * Faraday's law with z = z₀ + vt:
 *   ε = −N dΦ/dt = −N (dΦ/dz)(dz/dt) = 3 μ₀ m a² N v z / (2 (a² + z²)^{5/2})
 * `polarity` = +1 when the north pole leads, −1 when the south pole leads.
 */
export function flux(z: number, m: number, a: number, polarity = 1): number {
  return (polarity * MU_0 * m * a * a) / (2 * Math.pow(a * a + z * z, 1.5))
}

export function dFluxDz(z: number, m: number, a: number, polarity = 1): number {
  return (-polarity * 3 * MU_0 * m * a * a * z) / (2 * Math.pow(a * a + z * z, 2.5))
}

export function emf(z: number, v: number, N: number, m: number, a: number, polarity = 1): number {
  return -N * dFluxDz(z, m, a, polarity) * v
}

/** Largest |dΦ/dz| occurs at z = ±a/2: 3μ₀m / (4 (5/4)^{5/2} a²). */
export function maxFluxGradient(m: number, a: number): number {
  return (3 * MU_0 * m) / (4 * Math.pow(1.25, 2.5) * a * a)
}

/** Peak flux, magnet at the coil centre: Φ_max = μ₀ m / (2a). */
export function maxFlux(m: number, a: number): number {
  return (MU_0 * m) / (2 * a)
}

/** Axial field of the dipole at distance z: B = μ₀ m / (2π z³). */
export function axialField(z: number, m: number): number {
  return (MU_0 * m) / (2 * Math.PI * Math.abs(z) ** 3)
}

export const PASS_HALF_LENGTH = 0.25 // m — magnet travels from −0.25 m to +0.25 m

export interface PassRecord {
  t: number[]
  z: number[]
  phi: number[]
  emf: number[]
}

/** Sample one full pass of the magnet through the coil. */
export function simulatePass(v: number, N: number, m: number, a: number, polarity: number, samples = 4000): PassRecord {
  const duration = (2 * PASS_HALF_LENGTH) / v
  const rec: PassRecord = { t: [], z: [], phi: [], emf: [] }
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * duration
    const z = -PASS_HALF_LENGTH + v * t
    rec.t.push(t)
    rec.z.push(z)
    rec.phi.push(flux(z, m, a, polarity))
    rec.emf.push(emf(z, v, N, m, a, polarity))
  }
  return rec
}
