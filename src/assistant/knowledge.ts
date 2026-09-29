import { EXPERIMENTS } from '@/experiments/registry'
import type { ExperimentModule } from '@/types/experiment'
import { CREDIT } from '@/components/layout/CreditFooter'
import { Bm25Index, type SearchDoc } from './search'

/**
 * The knowledge base behind Ask PHYSILAB. It is built from the experiments' own content
 * (theory, procedure, precautions, model notes, viva explanations) plus a few help entries,
 * so answers always agree with what the rest of the app says.
 */
export type DocKind = 'theory' | 'aim' | 'procedure' | 'precautions' | 'model' | 'viva' | 'help' | 'glossary'

export interface KnowledgeDoc extends SearchDoc {
  kind: DocKind
  experimentId?: string
  paragraphs: string[]
  formulas: string[]
  source: { label: string; to: string }
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const theoryAnchor = (heading: string) => `theory-${slugify(heading)}`

function experimentDocs(m: ExperimentModule): KnowledgeDoc[] {
  const base = `/experiments/${m.id}`
  const docs: KnowledgeDoc[] = [
    {
      id: `${m.id}:aim`,
      kind: 'aim',
      experimentId: m.id,
      title: `${m.title}: aim and objectives`,
      text: [m.aim, ...m.objectives, m.summary].join(' '),
      keywords: [m.title, 'aim', 'objective', 'purpose'],
      paragraphs: [m.aim, `Objectives: ${m.objectives.join(' ')}`],
      formulas: [],
      source: { label: `${m.title} › Aim`, to: base },
    },
  ]
  for (const s of m.theory) {
    docs.push({
      id: `${m.id}:theory:${slugify(s.heading)}`,
      kind: 'theory',
      experimentId: m.id,
      title: s.heading,
      text: [...s.body, ...(s.formulas ?? []).map((f) => f.caption ?? '')].join(' '),
      keywords: [m.title],
      paragraphs: s.body,
      formulas: (s.formulas ?? []).map((f) => f.tex),
      source: { label: `${m.title} › ${s.heading}`, to: `${base}#${theoryAnchor(s.heading)}` },
    })
  }
  docs.push(
    {
      id: `${m.id}:procedure`,
      kind: 'procedure',
      experimentId: m.id,
      title: `How to do the ${m.title} experiment`,
      text: m.procedure.join(' '),
      keywords: [m.title, 'procedure', 'steps', 'method', 'perform'],
      paragraphs: m.procedure.map((p, i) => `${i + 1}. ${p}`),
      formulas: [],
      source: { label: `${m.title} › Procedure`, to: base },
    },
    {
      id: `${m.id}:precautions`,
      kind: 'precautions',
      experimentId: m.id,
      title: `Precautions for ${m.title}`,
      text: m.precautions.join(' '),
      keywords: [m.title, 'precaution', 'care', 'error', 'avoid'],
      paragraphs: m.precautions.map((p) => `• ${p}`),
      formulas: [],
      source: { label: `${m.title} › Precautions`, to: base },
    },
    {
      id: `${m.id}:model`,
      kind: 'model',
      experimentId: m.id,
      title: `How the ${m.title} simulation is built`,
      text: [m.model.method, ...m.model.assumptions, ...m.model.equations.map((e) => e.caption)].join(' '),
      keywords: [m.title, 'simulation', 'model', 'assumption', 'numerical method'],
      paragraphs: [m.model.method, `Assumptions: ${m.model.assumptions.join(' ')}`],
      formulas: m.model.equations.map((e) => e.tex),
      source: { label: `${m.title} › How this simulation is built`, to: base },
    },
  )
  m.viva.forEach((q, i) => {
    docs.push({
      id: `${m.id}:viva:${i}`,
      kind: 'viva',
      experimentId: m.id,
      title: q.q,
      text: `${q.options[q.answer]} ${q.explanation}`,
      keywords: [m.title],
      paragraphs: [`Answer: ${q.options[q.answer]}.`, q.explanation],
      formulas: [],
      source: { label: `${m.title} › Viva`, to: `${base}/viva` },
    })
  })
  return docs
}

const help = (id: string, title: string, paragraphs: string[], keywords: string[], to: string, label: string): KnowledgeDoc => ({
  id: `help:${id}`,
  kind: 'help',
  title,
  text: paragraphs.join(' '),
  keywords,
  paragraphs,
  formulas: [],
  source: { label, to },
})

const HELP: KnowledgeDoc[] = [
  help(
    'reading',
    'How do I take a reading?',
    [
      'Open an experiment and go to its Lab bench. Set the controls on the right, then press the orange button (for example “Time 10 oscillations” or “Record reading”).',
      'Each press adds a row to the observation table. Change the setting you are investigating between readings.',
    ],
    ['take reading', 'measure', 'record', 'observation', 'table', 'button'],
    '/experiments',
    'Experiments',
  ),
  help(
    'analysis',
    'How do I get the graph and the result?',
    [
      'Open the Analysis stage of the experiment. It plots your readings, draws the best-fit line and works out the result with its uncertainty and percentage error.',
      'You need at least two readings for a preview and the experiment’s minimum number (usually 5 or 6) for a reliable result.',
    ],
    ['graph', 'plot', 'result', 'calculate', 'slope', 'analysis'],
    '/experiments',
    'Experiments',
  ),
  help(
    'noise',
    'What is “Instrument error”?',
    [
      'A switch on every lab bench. When it is on, readings include realistic errors — stopwatch reaction time, meter least count and noise — just like a real laboratory.',
      'Switch it off to see ideal values from the model.',
    ],
    ['instrument error', 'noise', 'realistic', 'least count', 'reaction time', 'ideal'],
    '/lab',
    'Virtual Lab',
  ),
  help(
    'delete',
    'How do I delete a wrong reading?',
    ['Press ✕ at the end of its row in the observation table (on the lab bench or in My Lab Notebook). “Clear table” removes every reading for that experiment.', 'The Lab Assistant also points out readings that lie far from the best-fit line.'],
    ['delete', 'remove', 'wrong', 'mistake', 'clear', 'outlier'],
    '/notebook',
    'My Lab Notebook',
  ),
  help(
    'pdf',
    'How do I download my lab report as a PDF?',
    ['Open the Report stage of an experiment, type your name, and press “Download PDF”. In the print dialog choose “Save as PDF”.'],
    ['pdf', 'report', 'print', 'download', 'record'],
    '/experiments',
    'Experiments',
  ),
  help(
    'csv',
    'How do I export my readings to Excel?',
    ['Press “Export CSV” under the observation table, or “CSV” in My Lab Notebook. The file opens in Excel or Google Sheets.'],
    ['csv', 'excel', 'export', 'spreadsheet', 'download', 'readings'],
    '/notebook',
    'My Lab Notebook',
  ),
  help(
    'vlab',
    'What is the Virtual Lab?',
    ['An open bench where you can switch between all the apparatus freely, without the guided stages. Readings taken there go into the same notebook.'],
    ['virtual lab', 'free', 'sandbox', 'open bench', 'play'],
    '/lab',
    'Virtual Lab',
  ),
  help(
    'assistant',
    'What does the Lab Assistant do?',
    [
      'It is a rule-based coach on the Lab bench and Analysis pages. It checks your readings against clear rules — spread of values, straightness of the graph, outliers, the intercept, the error in your result — and suggests the next reading to take.',
      'Every suggestion comes from an explicit rule and your own data; nothing is invented.',
    ],
    ['lab assistant', 'suggestion', 'advice', 'hint', 'ai', 'rule'],
    '/lab',
    'Virtual Lab',
  ),
  help(
    'chatbot',
    'How does Ask PHYSILAB work?',
    [
      'It searches PHYSILAB’s own theory, procedures and viva explanations for the passage that best matches your question (keyword ranking, not a language model), and it can work out a few quantities such as a pendulum’s period or a photon’s energy.',
      'It only knows what is in PHYSILAB, so for anything else ask your lab instructor.',
    ],
    ['chatbot', 'ask', 'ai', 'bot', 'how work', 'you'],
    '/about',
    'About',
  ),
  help(
    'viva-help',
    'How does the viva work?',
    [
      'Each experiment has an eight-question viva. Questions you got wrong last time come first, and after a wrong answer PHYSILAB points to the theory section to revise.',
      'Your best score is shown on the Dashboard and the Viva page.',
    ],
    ['viva', 'quiz', 'score', 'adaptive', 'questions', 'revise'],
    '/viva',
    'Viva',
  ),
  help(
    'complete',
    'When does an experiment count as complete?',
    ['Once you have taken enough readings, opened the Analysis, and taken the viva. The Progress page shows a tick for each stage.'],
    ['complete', 'completed', 'finish', 'progress', 'done'],
    '/progress',
    'Progress',
  ),
  help(
    'data',
    'Where is my work saved?',
    ['In this browser’s local storage. Nothing is sent to a server. Clearing site data or using a different browser starts a fresh notebook.'],
    ['save', 'saved', 'data', 'storage', 'lost', 'account', 'login'],
    '/about',
    'About',
  ),
  help(
    'guide',
    'How do I get help with a page?',
    ['Press “Page guide” in the sidebar (or ? at the top on a phone) for a short tour of the page you are on.'],
    ['guide', 'tour', 'help', 'how use', 'tutorial'],
    '/about',
    'About',
  ),
  help('theme', 'How do I switch to dark mode?', ['Use the sun / monitor / moon switch at the bottom of the sidebar (in the menu on a phone).'], ['dark', 'light', 'theme', 'mode', 'night'], '/about', 'About'),
  help(
    'credit',
    'Who made PHYSILAB?',
    [`PHYSILAB was made by ${CREDIT.name} (${CREDIT.role}) as an interactive virtual physics laboratory for engineering education.`],
    ['who made', 'author', 'creator', 'developer', 'built', 'made', CREDIT.name],
    '/about',
    'About',
  ),
  help(
    'list',
    'Which experiments are available?',
    [EXPERIMENTS.map((m) => `${m.number} ${m.title}`).join(' · '), 'More experiments are planned in every area.'],
    ['experiments', 'available', 'list', 'which'],
    '/experiments',
    'Experiments',
  ),
  help(
    'real',
    'Are the readings real or fake?',
    [
      'They are computed, not made up: the animation, readings, graph and result of each experiment all come from one physics model. For example, the pendulum’s equation of motion is integrated and a reading is taken by counting swings, like a stopwatch.',
      'Each experiment’s Aim & theory page explains exactly how its simulation is built.',
    ],
    ['real', 'fake', 'accurate', 'simulation', 'random', 'genuine'],
    '/about',
    'About',
  ),
]

const term = (id: string, title: string, text: string, formulas: string[], keywords: string[], experimentId: string, label: string): KnowledgeDoc => ({
  id: `glossary:${id}`,
  kind: 'glossary',
  experimentId,
  title,
  text,
  keywords,
  paragraphs: [text],
  formulas,
  source: { label, to: `/experiments/${experimentId}` },
})

/** Short definitions for “what is …?” questions. */
const GLOSSARY: KnowledgeDoc[] = [
  term('g', 'Acceleration due to gravity (g)', 'The acceleration of a freely falling body near the Earth’s surface, about 9.81 m s⁻². PHYSILAB measures it with the simple pendulum (from the slope of T² against L) and with projectile motion.', ['g = \\frac{4\\pi^2}{\\text{slope}}'], ['g', 'gravity', 'acceleration', 'free fall'], 'pendulum', 'Simple Pendulum'),
  term('period', 'Time period (T)', 'The time taken for one complete oscillation. For a simple pendulum it depends only on the length and g, not on the mass, and hardly on the amplitude if the swing is small.', ['T = 2\\pi\\sqrt{L/g}'], ['time period', 'period', 'oscillation'], 'pendulum', 'Simple Pendulum'),
  term('range', 'Range of a projectile (R)', 'The horizontal distance travelled before landing. On level ground without air resistance it is largest at a launch angle of 45°, and complementary angles (e.g. 30° and 60°) give the same range.', ['R = \\frac{v_0^2\\sin 2\\theta}{g}'], ['range', 'maximum range', 'max range', '45 degrees', 'projectile'], 'projectile', 'Projectile Motion'),
  term('resistance', 'Resistance (R)', 'The ratio of the potential difference across a conductor to the current through it, measured in ohms (Ω). For an ohmic conductor at constant temperature it is constant.', ['R = \\frac{V}{I}', 'R = \\frac{\\rho L}{A}'], ['resistance', 'ohm', 'resistivity'], 'ohms-law', "Ohm's Law"),
  term('emf', 'Induced EMF (ε)', 'The voltage produced in a coil when the magnetic flux linked with it changes. Its size equals the rate of change of flux linkage (Faraday’s law) and its direction opposes the change (Lenz’s law).', ['\\varepsilon = -N\\frac{d\\Phi}{dt}'], ['emf', 'induced emf', 'electromotive force', 'induction'], 'faraday', "Faraday's Law of Induction"),
  term('flux', 'Magnetic flux (Φ)', 'A measure of how much magnetic field passes through a surface, in webers (1 Wb = 1 T m²). For N turns the flux linkage is NΦ.', ['\\Phi = \\int \\vec B\\cdot d\\vec A'], ['flux', 'magnetic flux', 'weber', 'flux linkage'], 'faraday', "Faraday's Law of Induction"),
  term('lenz', 'Lenz’s law', 'The induced current always flows in the direction that opposes the change in magnetic flux that produced it. It is a consequence of conservation of energy, and it is the reason for the minus sign in Faraday’s law.', ['\\varepsilon = -N\\frac{d\\Phi}{dt}'], ['lenz', 'lenz law', 'direction', 'oppose', 'minus sign'], 'faraday', "Faraday's Law of Induction"),
  term('coherent', 'Coherent sources', 'Two sources with the same frequency and a constant phase difference. Only coherent sources give a steady interference pattern, which is why both slits are lit from one source.', [], ['coherent', 'coherence', 'phase'], 'double-slit', "Young's Double-Slit"),
  term('planck', 'Planck’s constant (h)', 'The constant linking a photon’s energy to its frequency, h = 6.626 × 10⁻³⁴ J s. In the photoelectric experiment it is found from the slope of stopping potential against frequency: h = e × slope.', ['E = h\\nu', 'h = e \\times \\text{slope}'], ['planck', 'planck constant', 'h'], 'photoelectric', 'Photoelectric Effect'),
  term('threshold', 'Threshold frequency (ν₀)', 'The lowest frequency of light that can eject electrons from a metal: ν₀ = φ/h. Below it no electrons are emitted, however bright the light.', ['\\nu_0 = \\frac{\\phi}{h}'], ['threshold', 'threshold frequency', 'threshold wavelength', 'cut-off'], 'photoelectric', 'Photoelectric Effect'),
  term('least-count', 'Least count', 'The smallest change an instrument can measure — 0.01 s for the stopwatch, 0.01 mm for the travelling microscope, 0.01 V for the voltmeter. Measuring many fringes or oscillations and dividing reduces its effect.', [], ['least count', 'resolution', 'precision', 'instrument'], 'double-slit', "Young's Double-Slit"),
  term('r2', 'R² (goodness of fit)', 'How closely the points follow the best-fit straight line: 1 means a perfect line. PHYSILAB shows R² on every straight-line graph; above about 0.99 is a good straight line.', ['R^2 = 1 - \\frac{\\sum (y - \\hat y)^2}{\\sum (y - \\bar y)^2}'], ['r2', 'r squared', 'goodness of fit', 'correlation', 'straight line', 'best fit'], 'pendulum', 'Analysis'),
  term('percent-error', 'Percentage error', 'How far a measured value is from the accepted value, as a percentage of the accepted value.', ['\\%\\,\\text{error} = \\frac{|\\text{measured} - \\text{accepted}|}{\\text{accepted}} \\times 100'], ['percentage error', 'percent error', 'accuracy', 'error'], 'pendulum', 'Analysis'),
]

export const KNOWLEDGE: KnowledgeDoc[] = [...EXPERIMENTS.flatMap(experimentDocs), ...GLOSSARY, ...HELP]

export const INDEX = new Bm25Index(KNOWLEDGE)

export const docById = (id: string) => KNOWLEDGE.find((d) => d.id === id)

/** Words that name an experiment, so a question can be steered to it. */
export const EXPERIMENT_ALIASES: Record<string, string[]> = {
  pendulum: ['pendulum', 'bob', 'oscillation', 'swing'],
  projectile: ['projectile', 'launch', 'trajectory', 'cannon', 'thrown'],
  'ohms-law': ['ohm', 'resistor', 'resistance', 'diode', 'lamp', 'filament', 'ammeter', 'voltmeter'],
  faraday: ['faraday', 'induction', 'induc', 'coil', 'magnet', 'lenz', 'flux', 'emf'],
  'double-slit': ['young', 'slit', 'fringe', 'interference', 'beta'],
  photoelectric: ['photoelectric', 'photon', 'stopp', 'work', 'photocell', 'cathode'],
  'newtons-rings': ['newton', 'ring', 'plano', 'convex', 'air film'],
  'diffraction-grating': ['grating', 'spectrometer', 'mercury', 'spectrum', 'order'],
  'malus-law': ['malus', 'polaris', 'polariz', 'polaroid', 'analyser', 'analyzer'],
  sonometer: ['sonometer', 'string', 'wire', 'tuning', 'fork', 'rider', 'tension'],
  'rc-circuit': ['capacitor', 'capacitance', 'discharge', 'time constant', 'rc'],
  'planck-led': ['led', 'planck', 'threshold voltage'],
  'band-gap': ['band gap', 'bandgap', 'forbidden', 'saturation current', 'germanium', 'silicon'],
  'hall-effect': ['hall', 'carrier concentration', 'lorentz'],
  'fermi-energy': ['fermi', 'free electron', 'fermi velocity', 'fermi dirac'],
  'laser-wavelength': ['laser'],
  'optical-fiber': ['fibre', 'fiber', 'numerical aperture', 'acceptance', 'total internal reflection'],
  'four-probe': ['four probe', 'four-probe', 'probe', 'resistivity'],
  'lcr-resonance': ['lcr', 'resonance', 'quality factor', 'bandwidth', 'reactance'],
  'black-box': ['black box', 'blackbox', 'passive', 'identify', 'component'],
  photodiode: ['photodiode', 'responsivity', 'quantum efficiency', 'dark current'],
  'dielectric-constant': ['dielectric', 'permittivity', 'polarisation'],
}

/** Theory section to revise for a viva question: its explicit topic, else the best keyword match. */
export function revisionFor(m: ExperimentModule, q: { q: string; explanation: string; topic?: string }): { heading: string; anchor: string } | null {
  if (q.topic) {
    const s = m.theory.find((t) => t.heading === q.topic)
    if (s) return { heading: s.heading, anchor: theoryAnchor(s.heading) }
  }
  return bestTheorySection(m, `${q.q} ${q.explanation}`)
}

/** Best theory section of one experiment for a piece of text (used by the adaptive viva). */
export function bestTheorySection(m: ExperimentModule, text: string): { heading: string; anchor: string } | null {
  const hit = INDEX.search(text, { filter: (d) => d.kind === 'theory' && d.experimentId === m.id })[0]
  if (!hit) return null
  const section = m.theory.find((s) => `${m.id}:theory:${slugify(s.heading)}` === hit.doc.id)
  return section ? { heading: section.heading, anchor: theoryAnchor(section.heading) } : null
}
