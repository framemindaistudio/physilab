import type { Component } from '@/physics/electromagnetism/lcr'

/** RMS output of the signal generator (V). */
export const SOURCE_V = 5

/** What is really inside each box. Not shown in the interface until the analysis identifies it. */
export const BOXES: Record<string, Component> = {
  A: { kind: 'C', C: 2.2e-6 },
  B: { kind: 'R', R: 330 },
  C: { kind: 'L', L: 0.15, r: 12 },
}

export const KIND_NAME = { R: 'Resistor', L: 'Inductor', C: 'Capacitor' } as const
