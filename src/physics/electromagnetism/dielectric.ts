/**
 * Parallel-plate (rolled-film) capacitor filled with a dielectric of relative permittivity κ:
 *   C = κ ε₀ A / d
 * Its charge and discharge through R follow V = V₀(1 − e^{−t/RC}) and V = V₀e^{−t/RC}
 * (see rc.ts); measuring τ = RC gives C and hence κ = C d / (ε₀ A).
 */
export const EPSILON_0 = 8.8541878128e-12 // F/m

export const DIELECTRICS: Record<string, { label: string; k: number }> = {
  polypropylene: { label: 'Polypropylene', k: 2.2 },
  polystyrene: { label: 'Polystyrene', k: 2.6 },
  polyester: { label: 'Polyester (PET)', k: 3.3 },
  paper: { label: 'Impregnated paper', k: 3.7 },
  mica: { label: 'Mica', k: 5.4 },
}

/** Rolled film capacitor: effective plate area and film thickness. */
export const PLATE_AREA = 2.0 // m²
export const FILM_THICKNESS = 20e-6 // m

export const capacitance = (k: number, A = PLATE_AREA, d = FILM_THICKNESS) => (k * EPSILON_0 * A) / d
