/**
 * Step-index optical fibre. Light entering within the acceptance cone is guided by total
 * internal reflection at the core–cladding boundary.
 *   NA = sin θ_a = √(n₁² − n₂²)          (launch from air)
 *   critical angle at the boundary: sin θ_c = n₂ / n₁
 * The light leaving the fibre spreads into the same cone, so on a screen a distance L from
 * the end the spot has diameter W = 2L tan θ_a.
 */
export interface Fibre {
  label: string
  n1: number
  n2: number
  /** Core diameter in metres (adds to the spot size). */
  core: number
}

export const FIBRES: Record<string, Fibre> = {
  'silica-mm': { label: 'Silica multimode (n₁ 1.480, n₂ 1.460)', n1: 1.48, n2: 1.46, core: 62.5e-6 },
  'silica-lowna': { label: 'Silica low-NA (n₁ 1.465, n₂ 1.455)', n1: 1.465, n2: 1.455, core: 50e-6 },
  plastic: { label: 'Plastic (PMMA, n₁ 1.492, n₂ 1.402)', n1: 1.492, n2: 1.402, core: 1e-3 },
}

export const numericalAperture = (f: Fibre) => Math.sqrt(f.n1 ** 2 - f.n2 ** 2)
export const acceptanceAngleDeg = (f: Fibre) => (Math.asin(Math.min(1, numericalAperture(f))) * 180) / Math.PI
export const criticalAngleDeg = (f: Fibre) => (Math.asin(f.n2 / f.n1) * 180) / Math.PI

/** Diameter of the output spot on a screen at distance L (m). */
export function spotDiameter(L: number, f: Fibre): number {
  return 2 * L * Math.tan((acceptanceAngleDeg(f) * Math.PI) / 180) + f.core
}
