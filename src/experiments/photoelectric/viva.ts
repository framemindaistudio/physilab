import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  {
    q: 'What is the work function of a metal?',
    options: [
      'The energy of the incident photon',
      'The minimum energy needed to remove an electron from the metal surface',
      'The kinetic energy of the fastest electron',
      'The energy lost in collisions inside the metal',
    ],
    answer: 1,
    explanation: 'φ is the minimum energy that binds the least tightly held electrons to the surface.',
  },
  {
    q: 'If the intensity of light is doubled (frequency unchanged), the stopping potential…',
    options: ['doubles', 'halves', 'remains the same', 'becomes zero'],
    answer: 2,
    explanation: 'Intensity changes the number of photons, not their energy. V₀ depends only on hν − φ; only the saturation current doubles.',
  },
  {
    q: 'Light below the threshold frequency falls on the metal. What happens as the intensity is increased?',
    options: [
      'Electrons are eventually emitted',
      'No electrons are emitted at any intensity',
      'Electrons are emitted after a time delay',
      'The stopping potential becomes negative',
    ],
    answer: 1,
    explanation: 'Each photon acts on one electron. If hν < φ, no single photon can free an electron, however many photons arrive.',
  },
  {
    q: 'The slope of the graph of stopping potential V₀ against frequency ν equals…',
    options: ['h', 'h/e', 'e/h', 'φ/e'],
    answer: 1,
    explanation: 'V₀ = (h/e)ν − φ/e, so the slope is h/e. Multiply by e to get h.',
  },
  {
    q: 'The slope of the V₀–ν graph for two different metals is…',
    options: ['different, depending on φ', 'the same for all metals', 'zero for alkali metals', 'proportional to intensity'],
    answer: 1,
    explanation: 'The slope h/e is a universal constant. Different metals give parallel lines shifted by their work functions.',
  },
  {
    q: 'What is the energy of a photon of wavelength 400 nm?',
    options: ['1.55 eV', '3.10 eV', '4.96 eV', '6.20 eV'],
    answer: 1,
    explanation: 'E = 1240 eV nm / 400 nm ≈ 3.10 eV.',
  },
  {
    q: 'Which observation cannot be explained by the wave theory of light?',
    options: [
      'Interference',
      'Existence of a threshold frequency for emission',
      'Diffraction',
      'Polarisation',
    ],
    answer: 1,
    explanation: 'Wave theory lets energy accumulate from any frequency; the sharp threshold needs quantised photons.',
  },
  {
    q: 'Why does the photocurrent saturate at high positive anode potential?',
    options: [
      'The anode melts',
      'All emitted electrons are already being collected',
      'The photon energy increases',
      'The work function decreases',
    ],
    answer: 1,
    explanation: 'Once every photoelectron reaches the anode, raising V cannot increase the current further; only more photons (more intensity) can.',
    topic: 'Intensity and saturation current',
  },
]
