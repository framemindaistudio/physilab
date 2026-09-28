import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  {
    q: 'At which launch angle is the range maximum on level ground (no air resistance)?',
    options: ['30°', '45°', '60°', '90°'],
    answer: 1,
    explanation: 'R = v₀² sin 2θ / g is largest when sin 2θ = 1, i.e. 2θ = 90°, θ = 45°.',
  },
  {
    q: 'Two projectiles are fired with the same speed at 30° and 60°. Their ranges are…',
    options: ['equal', 'in the ratio 1 : 2', 'in the ratio 1 : √3', 'in the ratio √3 : 1'],
    answer: 0,
    explanation: 'sin 60° = sin 120°, so complementary angles give the same range (but different heights and flight times).',
  },
  {
    q: 'At the highest point of the trajectory, the velocity of the projectile is…',
    options: ['zero', 'vertical', 'horizontal, equal to v₀ cos θ', 'equal to v₀'],
    answer: 2,
    explanation: 'The vertical component is zero at the top; the horizontal component v₀ cos θ never changes without drag.',
  },
  {
    q: 'What is the acceleration of a projectile at the highest point?',
    options: ['zero', 'g, directed downward', 'g, directed along the velocity', 'depends on the angle'],
    answer: 1,
    explanation: 'Gravity acts throughout the flight. The acceleration is always g downward, even when the vertical velocity is momentarily zero.',
  },
  {
    q: 'If the launch speed is doubled at the same angle, the range becomes…',
    options: ['twice as large', 'four times as large', 'half as large', 'unchanged'],
    answer: 1,
    explanation: 'R ∝ v₀², so doubling v₀ quadruples R.',
  },
  {
    q: 'Why does the trajectory become asymmetric when air resistance is included?',
    options: [
      'Gravity increases during descent',
      'Drag removes kinetic energy, so the projectile descends more steeply than it rose',
      'The horizontal velocity increases',
      'It does not — drag only reduces the height',
    ],
    answer: 1,
    explanation: 'Drag continuously opposes motion. The horizontal speed falls throughout, so the descent covers less horizontal distance than the ascent.',
  },
  {
    q: 'Which graph gives a straight line whose slope is 1/g?',
    options: ['R against θ', 'R against v₀', 'R against v₀² sin 2θ', 'H against v₀'],
    answer: 2,
    explanation: 'R = (1/g)·v₀² sin 2θ, so R versus v₀² sin 2θ is a straight line through the origin with slope 1/g.',
  },
  {
    q: 'The time of flight on level ground depends on…',
    options: ['only the horizontal velocity', 'only the vertical component of the launch velocity (and g)', 'the mass of the projectile', 'the range'],
    answer: 1,
    explanation: 'T = 2v₀ sin θ / g: the vertical motion alone decides how long the projectile stays in the air.',
  },
]
