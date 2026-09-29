import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  { q: 'State Malus’s law.', options: ['I = I₀ cos θ', 'I = I₀ cos²θ', 'I = I₀ sin θ', 'I = I₀ / cos θ'], answer: 1, explanation: 'The analyser passes the field component E₀ cos θ; intensity ∝ E², giving I₀ cos²θ.', topic: 'Malus’s law' },
  { q: 'What is the transmitted intensity when the polariser and analyser are crossed?', options: ['I₀', 'I₀/2', 'Zero', '2I₀'], answer: 2, explanation: 'At θ = 90°, cos²θ = 0 — this is called extinction.', topic: 'Malus’s law' },
  { q: 'At θ = 45°, the transmitted intensity is…', options: ['I₀', 'I₀/2', 'I₀/√2', 'I₀/4'], answer: 1, explanation: 'cos²45° = 1/2.', topic: 'Malus’s law' },
  { q: 'What fraction of unpolarised light passes through one ideal polariser?', options: ['All', 'Half', 'A quarter', 'None'], answer: 1, explanation: 'Averaging cos²θ over all random field directions gives 1/2.', topic: 'Polarised light' },
  { q: 'Polarisation shows that light waves are…', options: ['longitudinal', 'transverse', 'stationary', 'not waves'], answer: 1, explanation: 'Only transverse waves have a direction of oscillation perpendicular to travel that can be selected.', topic: 'Polarised light' },
  { q: 'Which graph gives a straight line through the origin?', options: ['I against θ', 'I against cos θ', 'I against cos²θ', 'I against sin θ'], answer: 2, explanation: 'I = I₀cos²θ is linear in cos²θ with slope I₀.', topic: 'Malus’s law' },
  { q: 'Can sound waves in air be polarised?', options: ['Yes', 'No, because they are longitudinal', 'Only at high frequency', 'Only in water'], answer: 1, explanation: 'Sound in air is a longitudinal wave, so it has no transverse direction to select.' },
  { q: 'A third polariser at 45° is inserted between two crossed polarisers. The light that emerges is…', options: ['zero', 'I₀/4 of the polarised light', 'I₀/2', 'I₀'], answer: 1, explanation: 'cos²45° × cos²45° = 1/4: the middle polariser rotates the plane so some light gets through.' },
]
