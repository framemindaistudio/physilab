import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  { q: 'What is the Hall effect?', options: ['Heating of a conductor by current', 'A transverse voltage across a current-carrying conductor in a perpendicular magnetic field', 'Emission of electrons by light', 'A change of resistance with temperature'], answer: 1, explanation: 'The Lorentz force pushes carriers to one side, creating the Hall voltage.', topic: 'Magnetic force on moving charges' },
  { q: 'The Hall voltage is proportional to…', options: ['I/B', 'I·B', 'B/I', 'I only'], answer: 1, explanation: 'V_H = IB/(nqt).', topic: 'Hall voltage, coefficient and carriers' },
  { q: 'A negative Hall coefficient means the majority carriers are…', options: ['holes', 'electrons', 'protons', 'ions'], answer: 1, explanation: 'R_H = 1/(nq) takes the sign of the carrier charge.', topic: 'Hall voltage, coefficient and carriers' },
  { q: 'Why is the Hall voltage much larger in semiconductors than in metals?', options: ['Semiconductors are thicker', 'They have far fewer carriers, and V_H ∝ 1/n', 'Metals are not magnetic', 'Semiconductors carry more current'], answer: 1, explanation: 'With fewer carriers each must drift faster for the same current, so the magnetic force — and V_H — is larger.', topic: 'Hall voltage, coefficient and carriers' },
  { q: 'At equilibrium, the Hall field E_H satisfies…', options: ['E_H = v/B', 'E_H = vB', 'E_H = B/v', 'E_H = 0'], answer: 1, explanation: 'qE_H = qvB balances the magnetic force.', topic: 'Magnetic force on moving charges' },
  { q: 'What is the unit of the Hall coefficient?', options: ['Ω m', 'm³ C⁻¹', 'V A⁻¹', 'T m'], answer: 1, explanation: 'R_H = 1/(nq): (m⁻³·C)⁻¹ = m³/C.' },
  { q: 'If the magnetic field is reversed, the Hall voltage…', options: ['doubles', 'reverses sign', 'is unchanged', 'becomes zero'], answer: 1, explanation: 'The Lorentz force reverses, so carriers pile up on the other face.' },
  { q: 'Name a practical use of the Hall effect.', options: ['LED lighting', 'Measuring magnetic fields (Hall probes) and sensing position/speed', 'Solar cells', 'Batteries'], answer: 1, explanation: 'Hall sensors measure B directly and are used in gaussmeters, phones and car speed sensors.' },
]
