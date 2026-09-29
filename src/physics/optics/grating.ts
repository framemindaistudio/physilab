/**
 * Plane transmission diffraction grating on a spectrometer (normal incidence).
 * Grating equation: d sin θ = nλ, with d = 1/N (N lines per metre).
 */
export interface SpectralLine {
  label: string
  nm: number
}

/** Mercury lamp lines commonly used in the lab. */
export const MERCURY_LINES: Record<string, SpectralLine> = {
  violet: { label: 'Violet', nm: 404.66 },
  blue: { label: 'Blue', nm: 435.83 },
  green: { label: 'Green', nm: 546.07 },
  yellow1: { label: 'Yellow 1', nm: 576.96 },
  yellow2: { label: 'Yellow 2', nm: 579.07 },
}

/** Diffraction angle in degrees, or NaN if that order does not exist (sin θ > 1). */
export function diffractionAngle(order: number, lambdaNm: number, linesPerMm: number): number {
  const d = 1e-3 / linesPerMm
  const s = (order * lambdaNm * 1e-9) / d
  return Math.abs(s) > 1 ? NaN : (Math.asin(s) * 180) / Math.PI
}

export function maxOrder(lambdaNm: number, linesPerMm: number): number {
  const d = 1e-3 / linesPerMm
  return Math.floor(d / (lambdaNm * 1e-9))
}
