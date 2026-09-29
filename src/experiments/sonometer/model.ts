export const G = 9.81

/** Wires with their linear mass density μ in kg/m. */
export const WIRES: Record<string, { label: string; mu: number }> = {
  thin: { label: 'Thin steel (0.60 g/m)', mu: 0.6e-3 },
  medium: { label: 'Medium steel (1.20 g/m)', mu: 1.2e-3 },
  thick: { label: 'Thick steel (2.50 g/m)', mu: 2.5e-3 },
}

export const FORKS = ['256', '288', '320', '341.3', '384', '426.7', '480', '512']

/** Sharpness of the string's resonance (quality factor). */
export const Q = 30

export const tensionOf = (massKg: number) => massKg * G
export const muOf = (wire: unknown) => (WIRES[String(wire)] ?? WIRES.medium).mu
