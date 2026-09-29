import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  { q: 'What is the dielectric constant of a material?', options: ['Its resistance', 'The factor by which it increases the capacitance compared with vacuum (ε/ε₀)', 'Its breakdown voltage', 'Its density'], answer: 1, explanation: 'κ = C_dielectric / C_vacuum = ε/ε₀.', topic: 'Dielectrics increase capacitance' },
  { q: 'Why does a dielectric increase capacitance?', options: ['It conducts electricity', 'Its dipoles align and partly cancel the field, so more charge is stored at the same voltage', 'It makes the plates larger', 'It heats up'], answer: 1, explanation: 'Polarisation reduces the field for a given charge, lowering V = Q/C for the same Q.', topic: 'Dielectrics increase capacitance' },
  { q: 'The time constant of the circuit is…', options: ['R/C', 'RC', '1/RC', 'C/R'], answer: 1, explanation: 'τ = RC.', topic: 'Charging and discharging through a resistor' },
  { q: 'While charging, the voltage after one time constant is…', options: ['37% of V₀', '50% of V₀', '63% of V₀', 'V₀'], answer: 2, explanation: 'V = V₀(1 − e⁻¹) ≈ 0.63 V₀.', topic: 'Charging and discharging through a resistor' },
  { q: 'Which graph is a straight line during charging?', options: ['V against t', 'ln(V₀ − V) against t', 'ln V against t', 'V against 1/t'], answer: 1, explanation: 'V₀ − V = V₀e^(−t/RC), so ln(V₀ − V) is linear in t.', topic: 'Charging and discharging through a resistor' },
  { q: 'If the dielectric is replaced by one with twice the dielectric constant, the time constant…', options: ['halves', 'doubles', 'is unchanged', 'quadruples'], answer: 1, explanation: 'C ∝ κ, so τ = RC doubles.' },
  { q: 'What is the dielectric constant of vacuum?', options: ['0', '1', '8.85', 'infinite'], answer: 1, explanation: 'By definition κ = 1 for vacuum (air ≈ 1.0006).' },
  { q: 'Why is a very large resistance (MΩ) used here?', options: ['To protect the capacitor', 'To make τ = RC long enough to time with a stopwatch', 'To increase the voltage', 'To polarise the dielectric'], answer: 1, explanation: 'With µF capacitors, MΩ resistors give time constants of seconds to tens of seconds.' },
]
