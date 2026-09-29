import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  { q: 'The impedance of a box stays the same at every frequency. The box contains…', options: ['an inductor', 'a capacitor', 'a resistor', 'nothing'], answer: 2, explanation: 'Only a resistor has an impedance independent of frequency.', topic: 'How R, L and C respond to AC' },
  { q: 'The impedance doubles when the frequency doubles. The component is…', options: ['a resistor', 'an inductor', 'a capacitor', 'a diode'], answer: 1, explanation: 'X_L = 2πfL is proportional to f.', topic: 'How R, L and C respond to AC' },
  { q: 'The impedance halves when the frequency doubles. The component is…', options: ['a resistor', 'an inductor', 'a capacitor', 'a battery'], answer: 2, explanation: 'X_C = 1/(2πfC) is inversely proportional to f.', topic: 'How R, L and C respond to AC' },
  { q: 'In a purely capacitive circuit, the current…', options: ['lags the voltage by 90°', 'leads the voltage by 90°', 'is in phase with the voltage', 'is zero'], answer: 1, explanation: 'Current flows to charge the capacitor before the voltage builds up: I leads V by 90°.', topic: 'How R, L and C respond to AC' },
  { q: 'Which component blocks direct current completely?', options: ['Resistor', 'Inductor', 'Capacitor', 'Wire'], answer: 2, explanation: 'At f = 0, X_C is infinite.' },
  { q: 'The slope of Z against f for an inductor equals…', options: ['L', '2πL', '1/(2πL)', 'L/2π'], answer: 1, explanation: 'Z = 2πfL, so the slope is 2πL.', topic: 'Identifying the component and its value' },
  { q: 'A capacitor has Z = 72 Ω at 1000 Hz. Its capacitance is about…', options: ['0.22 µF', '2.2 µF', '22 µF', '220 µF'], answer: 1, explanation: 'C = 1/(2π × 1000 × 72) ≈ 2.2 µF.', topic: 'Identifying the component and its value' },
  { q: 'Why does a real inductor show a small impedance even at very low frequency?', options: ['Its capacitance', 'The resistance of its winding wire', 'Magnetic saturation', 'It does not'], answer: 1, explanation: 'The copper winding has resistance r, so Z = √(r² + (2πfL)²) ≥ r.' },
]
