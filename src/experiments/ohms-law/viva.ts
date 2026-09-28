import type { VivaQuestion } from '@/types/experiment'

export const viva: VivaQuestion[] = [
  {
    q: 'State Ohm’s law.',
    options: [
      'Current is inversely proportional to voltage',
      'At constant temperature, the current through a conductor is directly proportional to the potential difference across it',
      'Resistance is proportional to current',
      'Power is proportional to the square of current',
    ],
    answer: 1,
    explanation: 'V ∝ I (V = IR) holds when physical conditions, especially temperature, stay constant.',
  },
  {
    q: 'How is the ammeter connected in the circuit, and why?',
    options: [
      'In parallel, because it has high resistance',
      'In series, because it must carry the whole current and has very low resistance',
      'In parallel, because it has low resistance',
      'In series, because it has very high resistance',
    ],
    answer: 1,
    explanation: 'An ammeter measures the current flowing through it, so it goes in series. Its low resistance barely disturbs the circuit.',
  },
  {
    q: 'Why is the voltmeter connected in parallel with the resistor?',
    options: [
      'To measure the potential difference across it without drawing significant current',
      'To increase the current',
      'To protect the ammeter',
      'Because it has very low resistance',
    ],
    answer: 0,
    explanation: 'A voltmeter measures the potential difference between two points; its very high resistance means it draws almost no current.',
  },
  {
    q: 'The slope of an I–V graph for an ohmic conductor equals…',
    options: ['R', '1/R', 'R²', 'the power dissipated'],
    answer: 1,
    explanation: 'I = V/R, so the gradient ΔI/ΔV = 1/R. (A V–I graph would have slope R.)',
  },
  {
    q: 'Why does the I–V graph of a filament lamp curve?',
    options: [
      'The voltmeter becomes inaccurate at high voltage',
      'The filament’s temperature, and hence its resistance, increases with current',
      'The lamp stores charge',
      'Tungsten is a semiconductor',
    ],
    answer: 1,
    explanation: 'More power heats the filament; hotter metal has more lattice vibration, so the resistivity rises and V/I increases.',
  },
  {
    q: 'The knee voltage of a silicon diode is approximately…',
    options: ['0.1 V', '0.3 V', '0.7 V', '5 V'],
    answer: 2,
    explanation: 'Silicon diodes start conducting appreciably at ≈ 0.6–0.7 V; germanium at ≈ 0.3 V.',
  },
  {
    q: 'What is the SI unit of resistivity?',
    options: ['Ω', 'Ω m', 'Ω m⁻¹', 'S m⁻¹'],
    answer: 1,
    explanation: 'ρ = RA/L has units Ω·m²/m = Ω m.',
  },
  {
    q: 'A resistor carries 50 mA when 2.35 V is applied. Its resistance is…',
    options: ['4.7 Ω', '47 Ω', '470 Ω', '0.047 Ω'],
    answer: 1,
    explanation: 'R = V/I = 2.35 / 0.050 = 47 Ω.',
  },
]
