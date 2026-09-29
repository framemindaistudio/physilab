import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  { q: 'Why does a blue LED need a higher voltage than a red one?', options: ['It is brighter', 'Blue photons have more energy (E = hc/λ), so each electron must be given more energy', 'Blue LEDs have more resistance', 'It does not'], answer: 1, explanation: 'Shorter wavelength means higher photon energy and a larger band gap, so the threshold voltage is higher.', topic: 'Light from a p–n junction' },
  { q: 'The slope of V_th against 1/λ equals…', options: ['h', 'hc/e', 'e/hc', 'hc'], answer: 1, explanation: 'eV_th = hc/λ → V_th = (hc/e)(1/λ).', topic: 'Threshold voltage and h' },
  { q: 'How is the threshold voltage found from an I–V curve?', options: ['Where I is maximum', 'By extrapolating the straight, steep part of the curve back to I = 0', 'Where V = 0', 'At 1 mA exactly'], answer: 1, explanation: 'The linear region reflects the series resistance; its intercept with the V-axis gives the turn-on voltage.', topic: 'Threshold voltage and h' },
  { q: 'What is the photon energy of a 620 nm red LED?', options: ['1 eV', '2 eV', '3 eV', '4 eV'], answer: 1, explanation: 'E = 1240 eV nm / 620 nm = 2.0 eV.', topic: 'Light from a p–n junction' },
  { q: 'In an LED, light is produced when…', options: ['the filament glows', 'electrons recombine with holes across the band gap', 'current is reversed', 'the LED heats up'], answer: 1, explanation: 'Each recombination releases roughly the band-gap energy as a photon.', topic: 'Light from a p–n junction' },
  { q: 'Why must an LED be used with a series resistor?', options: ['To make it brighter', 'Above threshold the current rises very steeply and could destroy it', 'To change its colour', 'It must not'], answer: 1, explanation: 'The resistor limits the current once the LED starts conducting.' },
  { q: 'Which LED in the set has the lowest threshold voltage?', options: ['Violet', 'Blue', 'Green', 'Infrared'], answer: 3, explanation: 'Infrared has the longest wavelength and lowest photon energy (about 1.3 V).' },
  { q: 'This experiment and the photoelectric effect both show that…', options: ['light is only a wave', 'light energy comes in quanta of hν', 'electrons have no charge', 'h depends on the metal'], answer: 1, explanation: 'Both link a voltage to the energy hc/λ of a single photon.' },
]
