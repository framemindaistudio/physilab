import type { CategoryId, PlannedExperiment } from '@/types/experiment'

export interface Category {
  id: CategoryId
  label: string
  blurb: string
}

export const CATEGORIES: Category[] = [
  { id: 'mechanics', label: 'Mechanics', blurb: 'Oscillations, motion and gravitation' },
  { id: 'optics', label: 'Optics', blurb: 'Interference, diffraction and polarisation' },
  { id: 'electromagnetism', label: 'Electricity & Magnetism', blurb: 'Circuits, fields and induction' },
  { id: 'waves', label: 'Waves & Acoustics', blurb: 'Standing waves, resonance and sound' },
  { id: 'modern', label: 'Modern Physics', blurb: 'Quanta, photons and electrons' },
  { id: 'semiconductor', label: 'Semiconductors', blurb: 'Junctions, band gaps and devices' },
]

export const categoryLabel = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.label ?? id

/** The roadmap: experiments that will reuse the same module contract. */
export const PLANNED: PlannedExperiment[] = [
  { title: 'Compound pendulum (bar pendulum)', category: 'mechanics' },
  { title: 'Moment of inertia — flywheel', category: 'mechanics' },
  { title: "Young's modulus — Searle's method", category: 'mechanics' },
  { title: 'Torsional pendulum — rigidity modulus', category: 'mechanics' },
  { title: 'Single-slit diffraction', category: 'optics' },
  { title: 'Air-wedge — thickness of a thin wire', category: 'optics' },
  { title: 'Magnetic field along the axis of a coil', category: 'electromagnetism' },
  { title: "Melde's experiment — standing waves", category: 'waves' },
  { title: 'Resonance column — speed of sound', category: 'waves' },
  { title: 'e/m by Thomson’s method', category: 'modern' },
  { title: 'Franck–Hertz experiment', category: 'modern' },
  { title: 'P–N junction diode characteristics', category: 'semiconductor' },
  { title: 'Zener diode as a voltage regulator', category: 'semiconductor' },
  { title: 'Solar cell I–V characteristics', category: 'semiconductor' },
  { title: 'Transistor characteristics (CE)', category: 'semiconductor' },
]
