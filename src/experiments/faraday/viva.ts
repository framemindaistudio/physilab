import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  {
    q: 'State Faraday’s law of electromagnetic induction.',
    options: [
      'The induced EMF is proportional to the magnetic field',
      'The induced EMF equals the rate of change of magnetic flux linkage',
      'The induced current is proportional to the resistance',
      'The flux through a closed surface is zero',
    ],
    answer: 1,
    explanation: 'ε = −N dΦ/dt: the EMF equals the rate of change of flux linkage NΦ.',
  },
  {
    q: 'What does the negative sign in ε = −N dΦ/dt represent?',
    options: ['The EMF is always negative', 'Lenz’s law: the induced current opposes the change in flux', 'Energy is lost as heat', 'The coil has negative resistance'],
    answer: 1,
    explanation: 'Lenz’s law — a consequence of energy conservation. The induced current creates a field opposing the change that produced it.',
  },
  {
    q: 'If the magnet is moved twice as fast through the coil, the peak EMF…',
    options: ['halves', 'stays the same', 'doubles', 'quadruples'],
    answer: 2,
    explanation: 'ε = −N v dΦ/dz. Doubling v doubles the rate of change of flux and so the EMF (the pulse also lasts half as long).',
  },
  {
    q: 'Why does the EMF change sign as the magnet passes through the coil?',
    options: [
      'The magnet’s poles reverse',
      'The flux increases while the magnet approaches and decreases while it leaves',
      'The galvanometer is centre-zero',
      'The coil’s resistance changes',
    ],
    answer: 1,
    explanation: 'dΦ/dt is positive on approach and negative on exit, so ε reverses. The two lobes have equal area.',
  },
  {
    q: 'A north pole is pushed towards one face of a coil. That face of the coil becomes…',
    options: ['a north pole', 'a south pole', 'neutral', 'alternately north and south'],
    answer: 0,
    explanation: 'To oppose the approach, the coil repels the magnet: the near face becomes a north pole.',
  },
  {
    q: 'What is the SI unit of magnetic flux?',
    options: ['tesla', 'weber', 'henry', 'gauss'],
    answer: 1,
    explanation: 'Flux is measured in webers: 1 Wb = 1 T m² = 1 V s.',
  },
  {
    q: 'What is the total ∫ε dt for a magnet passing completely through the coil?',
    options: ['NΦ_max', '2NΦ_max', 'zero', 'depends on the speed'],
    answer: 2,
    explanation: 'The flux linkage starts and ends at ≈ 0, so the net change — and the net area under ε(t) — is zero.',
  },
  {
    q: 'Which device works on the principle demonstrated here?',
    options: ['Electric motor', 'AC generator', 'Galvanometer', 'Electrolytic cell'],
    answer: 1,
    explanation: 'A generator rotates a coil in a magnetic field, continuously changing the flux linkage and inducing an alternating EMF.',
  },
]
