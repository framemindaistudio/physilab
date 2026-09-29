import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  { q: 'At resonance in a series LCR circuit…', options: ['X_L > X_C', 'X_L = X_C and the impedance equals R', 'the current is zero', 'the impedance is maximum'], answer: 1, explanation: 'The reactances cancel, Z = R is minimum and I = V/R is maximum.', topic: 'Impedance of a series LCR circuit' },
  { q: 'The resonant frequency of a series LCR circuit is…', options: ['2π√(LC)', '1/(2π√(LC))', '1/(2πRC)', 'R/L'], answer: 1, explanation: 'Setting 2πfL = 1/(2πfC) gives f₀ = 1/(2π√LC).', topic: 'Impedance of a series LCR circuit' },
  { q: 'What happens to the resonant frequency if C is made four times larger?', options: ['doubles', 'halves', 'quadruples', 'unchanged'], answer: 1, explanation: 'f₀ ∝ 1/√C.', topic: 'Impedance of a series LCR circuit' },
  { q: 'The half-power frequencies are where the current falls to…', options: ['I_max/2', 'I_max/√2', 'zero', 'I_max/4'], answer: 1, explanation: 'Power ∝ I², so half power means I = I_max/√2.', topic: 'Bandwidth and quality factor' },
  { q: 'Increasing the resistance R makes the resonance curve…', options: ['sharper', 'broader and lower', 'shift to higher f', 'unchanged'], answer: 1, explanation: 'Q = (1/R)√(L/C) falls, so the peak is lower (V/R) and broader.', topic: 'Bandwidth and quality factor' },
  { q: 'Below resonance, the series LCR circuit behaves as…', options: ['inductive', 'capacitive', 'purely resistive', 'open circuit'], answer: 1, explanation: 'At low f, X_C > X_L, so the circuit is capacitive and the current leads the voltage.' },
  { q: 'What is the phase difference between current and voltage at resonance?', options: ['90°', '45°', '0°', '180°'], answer: 2, explanation: 'Z = R is purely resistive, so current and voltage are in phase.', topic: 'Impedance of a series LCR circuit' },
  { q: 'Where is series resonance used?', options: ['In batteries', 'Tuning circuits in radio receivers', 'In fuses', 'In transformers only'], answer: 1, explanation: 'A tuned LCR circuit passes a narrow band around f₀ and rejects other stations.' },
]
