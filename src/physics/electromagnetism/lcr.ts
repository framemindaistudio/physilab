/**
 * AC circuits.
 * Series LCR driven at frequency f by an rms voltage V:
 *   X_L = 2πfL,  X_C = 1/(2πfC),  Z = √(R² + (X_L − X_C)²),  I = V/Z
 *   resonance f₀ = 1/(2π√LC),  Q = f₀/Δf = (1/R)√(L/C)
 * Phase of the current relative to the voltage: φ = −atan((X_L − X_C)/R).
 */
export const reactanceL = (f: number, L: number) => 2 * Math.PI * f * L
export const reactanceC = (f: number, C: number) => 1 / (2 * Math.PI * f * C)

export function seriesImpedance(f: number, R: number, L: number, C: number): number {
  return Math.hypot(R, reactanceL(f, L) - reactanceC(f, C))
}

export const seriesCurrent = (V: number, f: number, R: number, L: number, C: number) => V / seriesImpedance(f, R, L, C)

/** Phase of the current relative to the applied voltage (radians; positive = current leads). */
export const seriesPhase = (f: number, R: number, L: number, C: number) => -Math.atan((reactanceL(f, L) - reactanceC(f, C)) / R)

export const resonantFrequency = (L: number, C: number) => 1 / (2 * Math.PI * Math.sqrt(L * C))
export const qualityFactor = (R: number, L: number, C: number) => Math.sqrt(L / C) / R

/** A single hidden component inside a "black box". */
export type Component = { kind: 'R'; R: number } | { kind: 'L'; L: number; r: number } | { kind: 'C'; C: number }

export function componentImpedance(c: Component, f: number): { Z: number; phase: number } {
  if (c.kind === 'R') return { Z: c.R, phase: 0 }
  if (c.kind === 'L') {
    const X = reactanceL(f, c.L)
    return { Z: Math.hypot(c.r, X), phase: -Math.atan(X / c.r) }
  }
  return { Z: reactanceC(f, c.C), phase: Math.PI / 2 }
}
