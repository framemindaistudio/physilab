import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  { q: 'In which bias is a photodiode normally operated?', options: ['Forward bias', 'Reverse bias', 'Zero bias only', 'Breakdown'], answer: 1, explanation: 'Reverse bias widens the depletion region, speeding up the response and making the current proportional to light.', topic: 'Photodiode operation' },
  { q: 'What is responsivity?', options: ['Response time', 'Photocurrent produced per watt of incident light (A/W)', 'The dark current', 'The band gap'], answer: 1, explanation: 'ℛ = I_ph/P.', topic: 'Responsivity and quantum efficiency' },
  { q: 'In reverse bias, the photocurrent depends mainly on…', options: ['the bias voltage', 'the light power', 'the temperature only', 'the series resistor'], answer: 1, explanation: 'The I–V curves are flat in reverse bias; their level is set by P.', topic: 'Photodiode operation' },
  { q: 'What is dark current?', options: ['Current in the dark due to thermally generated carriers', 'Current in bright light', 'The forward current', 'Current through the LED'], answer: 0, explanation: 'Even without light, a small reverse current flows from thermally generated electron–hole pairs.' },
  { q: 'A photodiode with η = 1 at 1240 nm would have a responsivity of…', options: ['0.5 A/W', '1 A/W', '1240 A/W', '0.001 A/W'], answer: 1, explanation: 'ℛ = ηλ(nm)/1240 = 1 A/W.', topic: 'Responsivity and quantum efficiency' },
  { q: 'Why does a silicon photodiode not respond to light beyond about 1100 nm?', options: ['The light is too bright', 'Photon energy falls below the silicon band gap (1.12 eV)', 'The glass window blocks it', 'Reverse bias prevents it'], answer: 1, explanation: 'hc/λ < E_g means the photon cannot create an electron–hole pair.' },
  { q: 'Quantum efficiency is…', options: ['the number of electrons per incident photon', 'the power per photon', 'the current per volt', 'always 100%'], answer: 0, explanation: 'η = electrons collected / photons incident.', topic: 'Responsivity and quantum efficiency' },
  { q: 'Name one use of photodiodes.', options: ['Lighting a room', 'Optical fibre receivers, light meters and solar sensors', 'Rectifying mains AC', 'Storing charge'], answer: 1, explanation: 'Photodiodes convert light signals to electrical signals in communication links and sensors.' },
]
