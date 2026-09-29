import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  { q: 'What is the time constant of an RC circuit?', options: ['R/C', 'RC', 'C/R', '1/RC'], answer: 1, explanation: 'τ = RC has units of seconds: Ω × F = (V/A)(C/V) = C/A = s.', topic: 'Exponential decay' },
  { q: 'After one time constant, a discharging capacitor’s voltage has fallen to about…', options: ['0%', '37% of V₀', '50% of V₀', '63% of V₀'], answer: 1, explanation: 'V = V₀e⁻¹ ≈ 0.37 V₀.', topic: 'Exponential decay' },
  { q: 'Why do we plot ln V against t?', options: ['ln V is easier to measure', 'It turns the exponential into a straight line with slope −1/RC', 'To remove V₀', 'Because V is negative'], answer: 1, explanation: 'ln V = ln V₀ − t/RC is linear in t.', topic: 'Straight-line graph and τ' },
  { q: 'If the resistance is doubled, the discharge…', options: ['takes half as long', 'takes twice as long', 'is unchanged', 'stops'], answer: 1, explanation: 'τ = RC doubles, so every stage of the decay takes twice as long.', topic: 'Exponential decay' },
  { q: 'What is the half-life of the discharge?', options: ['τ/2', 'τ ln 2 ≈ 0.69τ', '2τ', 'τ'], answer: 1, explanation: 'Setting V = V₀/2 gives t = τ ln 2.', topic: 'Straight-line graph and τ' },
  { q: 'Why should the voltmeter have a very high resistance?', options: ['To measure faster', 'So it does not provide an extra discharge path that changes τ', 'To protect the capacitor', 'It does not matter'], answer: 1, explanation: 'A low-resistance meter in parallel would lower the effective R and speed up the discharge.' },
  { q: 'Energy stored in a capacitor is…', options: ['CV', '½CV²', 'CV²', 'Q/C'], answer: 1, explanation: 'E = ½CV² = Q²/2C.' },
  { q: 'Which quantity is the same at every instant in the series RC discharge loop?', options: ['Voltage across R and C are always different', 'The current through R and C', 'The charge on R', 'Nothing'], answer: 1, explanation: 'It is a single loop, so the same current flows through both, and V_R = V_C during discharge.' },
]
