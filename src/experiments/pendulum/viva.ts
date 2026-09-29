import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  {
    q: 'What happens to the time period when the length of the pendulum is increased?',
    options: ['It decreases', 'It increases', 'It remains constant', 'It becomes zero'],
    answer: 1,
    explanation: 'T = 2π√(L/g), so T grows as the square root of L. Quadrupling L doubles T.',
  },
  {
    q: 'If the mass of the bob is doubled, the time period will…',
    options: ['double', 'halve', 'remain the same', 'increase by √2'],
    answer: 2,
    explanation: 'Mass cancels from the equation of motion (mL θ̈ = −mg sin θ). The period depends only on L and g.',
  },
  {
    q: 'Why do we plot T² against L instead of T against L?',
    options: [
      'T² is easier to measure',
      'It turns the relation into a straight line whose slope gives g',
      'It removes the effect of mass',
      'It makes the graph pass through the maximum reading',
    ],
    answer: 1,
    explanation: 'T² = (4π²/g) L is linear in L. A straight line lets us average all readings through its slope: g = 4π²/slope.',
  },
  {
    q: 'Why is the amplitude kept small?',
    options: [
      'So the bob does not hit the stand',
      'Because sin θ ≈ θ only for small angles, making the motion simple harmonic',
      'To reduce air resistance to zero',
      'Because the string stretches at large angles',
    ],
    answer: 1,
    explanation: 'The formula T = 2π√(L/g) relies on sin θ ≈ θ. At larger amplitudes the true period is longer, T ≈ T₀(1 + θ₀²/16).',
  },
  {
    q: 'What is the effective length of a simple pendulum?',
    options: [
      'Length of the string only',
      'Distance from the point of suspension to the centre of gravity of the bob',
      'Distance from the suspension to the bottom of the bob',
      'Length of string plus the diameter of the bob',
    ],
    answer: 1,
    explanation: 'L is measured from the pivot to the centre of mass of the bob: string length plus the radius of the bob.',
  },
  {
    q: 'A “seconds pendulum” has a period of 2 s on Earth. Its length is about…',
    options: ['0.25 m', '0.50 m', '0.99 m', '1.99 m'],
    answer: 2,
    explanation: 'L = gT²/4π² = 9.81 × 4 / 39.48 ≈ 0.994 m.',
    topic: 'Period and the T²–L graph',
  },
  {
    q: 'The same pendulum is taken to the Moon (g ≈ g_Earth/6). Its period becomes…',
    options: ['6 times longer', '√6 ≈ 2.45 times longer', '6 times shorter', 'unchanged'],
    answer: 1,
    explanation: 'T ∝ 1/√g. Reducing g by a factor 6 increases T by √6 ≈ 2.45.',
    topic: 'Period and the T²–L graph',
  },
  {
    q: 'Why do we time 10 or 20 oscillations rather than one?',
    options: [
      'The first oscillation is always irregular',
      'It spreads the fixed reaction-time error over many periods, reducing the error in T',
      'The stopwatch cannot measure short intervals',
      'It increases the amplitude',
    ],
    answer: 1,
    explanation: 'Reaction time adds a roughly fixed error (≈0.1 s) to each timing. Dividing a 20 s reading by 10 cuts its effect on T by a factor of 10.',
    topic: 'Period and the T²–L graph',
  },
]
