import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  {
    q: 'What are coherent sources?',
    options: [
      'Sources of equal intensity',
      'Sources with a constant phase difference and the same frequency',
      'Any two light bulbs',
      'Sources that emit white light',
    ],
    answer: 1,
    explanation: 'Interference is only stable if the phase difference between the sources stays constant; in Young’s experiment both slits are lit by one source.',
  },
  {
    q: 'If the distance to the screen D is doubled, the fringe width…',
    options: ['halves', 'doubles', 'stays the same', 'quadruples'],
    answer: 1,
    explanation: 'β = λD/d, so β ∝ D.',
  },
  {
    q: 'If the slit separation d is increased, the fringes…',
    options: ['become wider', 'become narrower', 'disappear', 'change colour'],
    answer: 1,
    explanation: 'β = λD/d ∝ 1/d: slits further apart produce more closely spaced fringes.',
  },
  {
    q: 'Red light is replaced by blue light. The fringe width…',
    options: ['increases', 'decreases', 'is unchanged', 'becomes zero'],
    answer: 1,
    explanation: 'Blue light has a shorter wavelength, and β ∝ λ.',
  },
  {
    q: 'What is the condition for a dark fringe?',
    options: [
      'Path difference = nλ',
      'Path difference = (2n + 1)λ/2',
      'Path difference = 0',
      'Path difference = 2nλ',
    ],
    answer: 1,
    explanation: 'An odd number of half-wavelengths means the waves arrive in antiphase and cancel.',
  },
  {
    q: 'What would you see if white light were used?',
    options: [
      'No fringes at all',
      'A white central fringe with a few coloured fringes on each side',
      'Only red fringes',
      'Equally spaced white and black fringes',
    ],
    answer: 1,
    explanation: 'Every wavelength has a bright fringe at the centre (zero path difference), but the other fringes of different colours are spaced differently and quickly overlap.',
  },
  {
    q: 'Why is the fringe width measured over 10 fringes?',
    options: [
      'To reduce the percentage error from the least count of the microscope',
      'Because single fringes are invisible',
      'To make the fringes brighter',
      'To avoid diffraction',
    ],
    answer: 0,
    explanation: 'The reading error (~0.01 mm) is fixed; spreading it over 10 fringes makes it ten times smaller relative to β.',
  },
  {
    q: 'Does the interference pattern violate conservation of energy?',
    options: [
      'Yes, energy is destroyed at dark fringes',
      'No, energy is redistributed from dark regions to bright regions',
      'Yes, energy is created at bright fringes',
      'Only for monochromatic light',
    ],
    answer: 1,
    explanation: 'Bright fringes have up to 4× the intensity of one slit and dark fringes zero: the average over the pattern equals the total from both slits.',
  },
]
