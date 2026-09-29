export const LASERS: Record<string, { label: string; nm: number }> = {
  hene: { label: 'He–Ne laser (red)', nm: 632.8 },
  diode: { label: 'Red diode laser', nm: 650 },
  green: { label: 'Green DPSS laser', nm: 532 },
  violet: { label: 'Violet diode laser', nm: 405 },
}

/** Half-width of the screen in metres (spots beyond this are off the screen). */
export const SCREEN_HALF = 0.6

/** Spot distance from the central maximum for order n (m), or NaN if it does not exist. */
export function spotPosition(n: number, nm: number, linesPerMm: number, D: number): number {
  const s = (n * nm * 1e-9 * linesPerMm) / 1e-3
  if (s >= 1) return NaN
  return D * Math.tan(Math.asin(s))
}
