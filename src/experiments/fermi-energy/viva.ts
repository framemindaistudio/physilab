import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  { q: 'What is the Fermi energy?', options: ['The energy of the slowest electron', 'The energy of the highest filled state at absolute zero', 'The work function', 'The band gap'], answer: 1, explanation: 'At 0 K all states up to E_F are filled and all above are empty.', topic: 'Free electrons and the Fermi level' },
  { q: 'What is the value of the Fermi–Dirac function f(E) at E = E_F (T > 0)?', options: ['0', '1/2', '1', 'It depends on T'], answer: 1, explanation: 'f(E_F) = 1/(e⁰ + 1) = 1/2 at any temperature above zero.', topic: 'Free electrons and the Fermi level' },
  { q: 'Why does the resistance of a metal increase with temperature?', options: ['More electrons are created', 'Lattice vibrations increase, shortening the mean free path', 'The wire gets longer', 'The Fermi energy falls'], answer: 1, explanation: 'Phonon scattering grows with T, so λ ∝ 1/T and ρ ∝ T.', topic: 'Resistivity and temperature' },
  { q: 'The Fermi energy of copper is about…', options: ['0.03 eV', '1 eV', '7 eV', '100 eV'], answer: 2, explanation: 'About 7.0 eV — far larger than kT ≈ 0.026 eV at room temperature.' },
  { q: 'Which electrons take part in conduction?', options: ['All electrons equally', 'Only those near the Fermi level', 'Only core electrons', 'Only electrons at the bottom of the band'], answer: 1, explanation: 'Only states within ~kT of E_F have empty states nearby to move into.', topic: 'Free electrons and the Fermi level' },
  { q: 'Which principle forces electrons to fill states up to E_F?', options: ['Heisenberg’s uncertainty principle', 'Pauli exclusion principle', 'Conservation of charge', 'Lenz’s law'], answer: 1, explanation: 'No two electrons can occupy the same quantum state.', topic: 'Free electrons and the Fermi level' },
  { q: 'The Fermi velocity of copper is of the order of…', options: ['1 m/s', '10³ m/s', '10⁶ m/s', '3 × 10⁸ m/s'], answer: 2, explanation: 'v_F = √(2E_F/m) ≈ 1.6 × 10⁶ m/s — much faster than the drift velocity (~mm/s).' },
  { q: 'In this experiment E_F depends on the measured slope as…', options: ['E_F ∝ dR/dT', 'E_F ∝ (dR/dT)²', 'E_F ∝ 1/(dR/dT)', 'independent of it'], answer: 1, explanation: 'v_F ∝ dρ/dT and E_F = ½mv_F², so E_F ∝ (dR/dT)²: a 1% error in the slope gives 2% in E_F.', topic: 'Resistivity and temperature' },
]
