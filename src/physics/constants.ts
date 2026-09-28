/** CODATA 2018 exact / recommended values (SI). */
export const PLANCK_H = 6.62607015e-34 // J·s
export const ELEMENTARY_E = 1.602176634e-19 // C
export const SPEED_C = 299792458 // m/s
export const MU_0 = 1.25663706212e-6 // N/A²
export const ELECTRON_MASS = 9.1093837015e-31 // kg
export const BOLTZMANN_K = 1.380649e-23 // J/K

/** hc in eV·nm, so E(eV) = HC_EV_NM / λ(nm). */
export const HC_EV_NM = (PLANCK_H * SPEED_C) / ELEMENTARY_E / 1e-9

/** Surface gravity (m/s²) for the "location" control. */
export const GRAVITY: Record<string, { g: number; label: string }> = {
  earth: { g: 9.81, label: 'Earth' },
  moon: { g: 1.62, label: 'Moon' },
  mars: { g: 3.72, label: 'Mars' },
  jupiter: { g: 24.79, label: 'Jupiter' },
}

export const GRAVITY_OPTIONS = Object.entries(GRAVITY).map(([value, v]) => ({
  value,
  label: `${v.label} (${v.g} m/s²)`,
}))

export function gravityOf(location: unknown): number {
  return GRAVITY[String(location)]?.g ?? 9.81
}
