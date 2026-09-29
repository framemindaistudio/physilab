import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  { q: 'State the law of length for a vibrating string.', options: ['f ∝ L', 'f ∝ 1/L at constant T and μ', 'f ∝ L²', 'f is independent of L'], answer: 1, explanation: 'f = (1/2L)√(T/μ): halving the length doubles the frequency.', topic: 'Laws of vibrating strings and resonance' },
  { q: 'If the tension is made four times larger, the fundamental frequency…', options: ['doubles', 'quadruples', 'halves', 'is unchanged'], answer: 0, explanation: 'f ∝ √T, so 4× the tension gives 2× the frequency.', topic: 'Laws of vibrating strings and resonance' },
  { q: 'What does the paper rider show?', options: ['The tension', 'Resonance — it is thrown off when the wire vibrates strongly', 'The node positions', 'The frequency'], answer: 1, explanation: 'At resonance the amplitude at the middle of the wire is largest and the rider falls off.' },
  { q: 'In the fundamental mode, the vibrating length is…', options: ['λ/4', 'λ/2', 'λ', '2λ'], answer: 1, explanation: 'There is a node at each bridge and one antinode in between: L = λ/2.', topic: 'Transverse waves on a stretched string' },
  { q: 'The speed of a transverse wave on a string depends on…', options: ['frequency only', 'tension and mass per unit length', 'amplitude', 'length of the string'], answer: 1, explanation: 'v = √(T/μ).', topic: 'Transverse waves on a stretched string' },
  { q: 'Why is the tuning fork’s stem pressed on the sonometer box?', options: ['To stop it vibrating', 'The box and wire are forced to vibrate at the fork’s frequency', 'To measure its frequency', 'To increase the tension'], answer: 1, explanation: 'The box transmits the forced vibration to the bridges and wire.' },
  { q: 'For a wire with v = 150 m/s, the resonant length for a 300 Hz fork is…', options: ['12.5 cm', '25 cm', '50 cm', '1 m'], answer: 1, explanation: 'L = v/(2f) = 150/600 = 0.25 m.', topic: 'Laws of vibrating strings and resonance' },
  { q: 'A thicker wire of the same material (larger μ) at the same tension needs…', options: ['a longer vibrating length', 'a shorter vibrating length', 'the same length', 'more forks'], answer: 1, explanation: 'Larger μ lowers v = √(T/μ), so L = v/(2f) is shorter for the same fork.' },
]
