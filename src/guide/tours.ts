/**
 * First-time guides, one per section of the app.
 *
 * A step's `target` names an element marked `data-guide="<target>"` in the page.
 * Steps whose target is not on screen (e.g. desktop-only controls on a phone) are left out,
 * so every guide adapts to the layout. A step without a target is shown centred.
 */
import { getExperiment } from '@/experiments/registry'

export interface GuideStep {
  target?: string
  title: string
  /** Text, or a function when the wording depends on the device (e.g. reduced motion). */
  body: string | (() => string)
}

export const stepBody = (s: GuideStep) => (typeof s.body === 'function' ? s.body() : s.body)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export interface Tour {
  id: string
  /** Section name shown in the guide header. */
  label: string
  steps: GuideStep[]
  /**
   * Start automatically only once this target exists — e.g. the analysis guide waits until
   * there is a graph to explain. Until then the guide is not marked as seen.
   */
  readyTarget?: string
  /** Shown when the guide is replayed but none of its targets are on screen. */
  fallback?: { title: string; body: string }
}

export const WELCOME_ID = 'welcome'

export const TOURS: Record<string, Tour> = {
  welcome: {
    id: 'welcome',
    label: 'Welcome',
    steps: [
      {
        title: 'Welcome to PHYSILAB',
        body: 'A virtual lab for Engineering Physics: you set up apparatus, take readings, plot graphs, work out results and practise the viva. This short guide shows you around. Each section also has its own guide the first time you open it.',
      },
      {
        target: 'nav',
        title: 'Find your way around',
        body: 'Every section is here: your Dashboard, the Experiments catalogue, the free-play Virtual Lab, the Theory formula sheet, your Lab Notebook, Viva practice and your Progress.',
      },
      {
        target: 'theme',
        title: 'Light or dark',
        body: 'Switch between a graph-paper light theme and a darkroom dark theme, or follow your device setting.',
      },
      {
        target: 'guide-button',
        title: 'Replay a guide any time',
        body: 'Press the Page guide button (?) to see the guide for whatever page you are on. You can switch first-time guides off or reset them on the About page.',
      },
    ],
  },

  home: {
    id: 'home',
    label: 'Home',
    steps: [
      {
        target: 'home-demo',
        title: 'A live experiment, not a picture',
        body: () =>
          prefersReducedMotion()
            ? 'This is the real photoelectric apparatus from Experiment 06, shown as a still frame because your device is set to reduce motion: ultraviolet light on a sodium plate, with the emitted electrons (blue dots) on their way to the anode. Open the Virtual Lab to change the wavelength yourself.'
            : 'This is the real photoelectric apparatus from Experiment 06. The light sweeps from ultraviolet to orange: electrons (blue dots) leave the sodium plate only while each photon carries more energy than the work function, and the I–V curve updates as it goes.',
      },
      {
        target: 'home-cta',
        title: 'Two ways in',
        body: 'Explore Experiments takes you through an experiment step by step. Enter Virtual Lab opens any apparatus for free experimenting.',
      },
      {
        target: 'home-experiments',
        title: 'The experiments',
        body: 'Each card opens an experiment. The bar underneath fills up as you complete its stages.',
      },
      {
        target: 'home-sequence',
        title: 'The same five stages every time',
        body: 'Aim & theory, Lab bench, Analysis, Viva and Report. Once you have done one experiment you know how to do them all.',
      },
      {
        target: 'home-rule',
        title: 'Every number is computed',
        body: 'Animations, readings and results all come from the same physics model, so you can explain any value in your viva.',
      },
    ],
  },

  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    steps: [
      {
        target: 'dash-name',
        title: 'Add your name',
        body: 'Click here and type your name. It is printed on your lab reports.',
      },
      {
        target: 'dash-stats',
        title: 'Your lab at a glance',
        body: 'Experiments completed, time spent at the bench, your average viva score and the number of readings you have taken.',
      },
      {
        target: 'dash-areas',
        title: 'Progress by area',
        body: 'How far you are through each area of the syllabus. Areas with experiments still being built are marked as planned.',
      },
      {
        target: 'dash-continue',
        title: 'What to do next',
        body: 'Suggests your next step: the next stage of the experiment you were working on, or the next experiment to start.',
      },
      {
        target: 'dash-list',
        title: 'Every experiment’s stages',
        body: 'Each green segment is a completed stage. Click a title to open that experiment.',
      },
    ],
  },

  experiments: {
    id: 'experiments',
    label: 'Experiments',
    steps: [
      {
        target: 'exp-filters',
        title: 'Filter by area',
        body: 'Show only Mechanics, Optics, Electricity & Magnetism and so on.',
      },
      {
        target: 'exp-grid',
        title: 'Choose an experiment',
        body: 'Open any card to start. The difficulty and time needed are shown inside. The bar shows how many of the five stages you have finished.',
      },
      {
        target: 'exp-planned',
        title: 'Coming next',
        body: 'Experiments planned for later phases. They will work exactly like the ones available now.',
      },
    ],
  },

  'experiment-theory': {
    id: 'experiment-theory',
    label: 'Aim & theory',
    steps: [
      {
        target: 'stage-nav',
        title: 'Five stages',
        body: 'Work through Aim & theory → Lab bench → Analysis → Viva → Report. A tick appears on each stage as you complete it, and you can jump between them at any time.',
      },
      {
        target: 'theory-aim',
        title: 'Aim and objectives',
        body: 'What the experiment sets out to find, and what you should be able to show by the end.',
      },
      {
        target: 'theory-section',
        title: 'Theory and formulae',
        body: 'The derivation in short steps, with every formula you will use. Read this before taking readings.',
      },
      {
        target: 'theory-variables',
        title: 'Variables',
        body: 'Which quantity you change (independent), which you measure (dependent) and which you keep fixed (controlled).',
      },
      {
        target: 'theory-model',
        title: 'How the simulation works',
        body: 'The exact equations, assumptions and numerical method behind the apparatus. Useful when an examiner asks where your numbers come from.',
      },
      {
        target: 'stage-next',
        title: 'On to the lab bench',
        body: 'When you are ready, continue to the Lab bench to set up the apparatus.',
      },
    ],
  },

  'experiment-lab': {
    id: 'experiment-lab',
    label: 'Lab bench',
    steps: [
      {
        target: 'bench-apparatus',
        title: 'The apparatus',
        body: 'A live simulation of the experiment. What you see is computed from the same model that produces your readings.',
      },
      {
        target: 'bench-controls',
        title: 'Run it',
        body: 'Start and pause the simulation, reset it to the beginning, and slow it down (0.1×) to watch fast events such as a magnet passing through a coil.',
      },
      {
        target: 'bench-params',
        title: 'Set the parameters',
        body: 'Drag the sliders or choose options to change the experimental conditions. The apparatus updates straight away.',
      },
      {
        target: 'bench-noise',
        title: 'Instrument error',
        body: 'When this is on, readings include realistic errors such as stopwatch reaction time and meter least count, just as on a real bench. Switch it off to see the ideal values.',
      },
      {
        target: 'bench-measure',
        title: 'Take a reading',
        body: 'Press this to record a measurement at the current settings. Change the independent variable between readings.',
      },
      {
        target: 'bench-readouts',
        title: 'Live readouts',
        body: 'Theoretical values for the current settings, so you can compare them with what you measure. Orange values are live meter readings.',
      },
      {
        target: 'bench-table',
        title: 'Observation table',
        body: 'Every reading is saved here and in your Lab Notebook. Delete a bad reading with ✕, or export the table as CSV. The bar shows how many readings you still need.',
      },
      {
        target: 'stage-nav',
        title: 'Then analyse',
        body: 'Once you have enough readings, open Analysis to plot the graph and calculate the result.',
      },
    ],
  },

  'experiment-analysis': {
    id: 'experiment-analysis',
    label: 'Analysis',
    readyTarget: 'analysis-graph',
    fallback: {
      title: 'Nothing to analyse yet',
      body: 'Take readings on the Lab bench first. The graph, calculations and result appear here as soon as you have at least two readings.',
    },
    steps: [
      {
        target: 'analysis-graph',
        title: 'Your graph',
        body: 'Orange points are your readings. When the relationship is a straight line, the blue line is the least-squares best fit, extended to x = 0 so you can read the intercept, and R² close to 1 means the points lie on a line. For non-linear devices, such as a lamp or a diode, the blue line simply joins the points.',
      },
      {
        target: 'analysis-results',
        title: 'The result',
        body: 'The quantities you set out to find. Values taken from a fitted line show their uncertainty, and where there is an accepted value yours is compared with it — the error badge is green below 2%, amber below 5% and red above.',
      },
      {
        target: 'analysis-calcs',
        title: 'Calculations',
        body: 'Every step from your readings to the result, with your numbers substituted in — ready to copy into your record.',
      },
      {
        target: 'analysis-conclusion',
        title: 'Conclusion',
        body: 'A conclusion written from your own data. It changes if you add or delete readings.',
      },
    ],
  },

  'experiment-viva': {
    id: 'experiment-viva',
    label: 'Viva',
    fallback: {
      title: 'Viva complete',
      body: 'Your score is saved. Each question is listed below with the right answer and an explanation. Press Try again to retake the viva — your best score is the one shown on the Dashboard and the Viva page.',
    },
    steps: [
      {
        target: 'viva-question',
        title: 'Viva questions',
        body: 'Questions of the kind an examiner asks about this experiment, one at a time.',
      },
      {
        target: 'viva-options',
        title: 'Pick an answer',
        body: 'Choose one option, then submit it. You will see straight away whether it was right, with an explanation.',
      },
      {
        target: 'viva-attempts',
        title: 'Your attempts',
        body: 'Your score is saved when you finish. Retake the viva as often as you like — your best score counts on the Dashboard.',
      },
    ],
  },

  'experiment-report': {
    id: 'experiment-report',
    label: 'Report',
    steps: [
      {
        target: 'report-name',
        title: 'Name on the report',
        body: 'Type the name to print on your lab record.',
      },
      {
        target: 'report-sheet',
        title: 'Your lab record',
        body: 'Aim, apparatus, theory, procedure, your observations, graph, calculations, result, conclusion and viva score — built from your own readings.',
      },
      {
        target: 'report-pdf',
        title: 'Save as PDF',
        body: 'Opens your browser’s print dialog. Choose “Save as PDF” as the destination to keep a copy or submit it.',
      },
    ],
  },

  'virtual-lab': {
    id: 'virtual-lab',
    label: 'Virtual Lab',
    steps: [
      {
        target: 'vlab-picker',
        title: 'Choose any apparatus',
        body: 'Switch freely between all the experiments — no set order, no stages.',
      },
      {
        target: 'bench-apparatus',
        title: 'Experiment freely',
        body: 'Start the simulation and change anything. Try extreme values to see where simple formulas stop working.',
      },
      {
        target: 'bench-params',
        title: 'Parameters',
        body: 'The same controls as on the guided lab bench.',
      },
      {
        target: 'bench-measure',
        title: 'Readings are kept',
        body: 'Readings you take here go into the same notebook as the guided experiment.',
      },
      {
        target: 'vlab-analyse',
        title: 'Analyse them',
        body: 'Jump straight to the graph and result for this experiment’s readings.',
      },
    ],
  },

  theory: {
    id: 'theory',
    label: 'Theory',
    steps: [
      {
        target: 'theory-search',
        title: 'Search the theory',
        body: 'Type a quantity or idea — “period”, “flux”, “fringe width” — to filter every experiment’s theory.',
      },
      {
        target: 'theory-page-section',
        title: 'Formula sheet',
        body: 'Each card is one topic with its key formulae. Open experiment takes you to the full theory and the apparatus.',
      },
    ],
  },

  notebook: {
    id: 'notebook',
    label: 'Lab Notebook',
    readyTarget: 'notebook-card',
    fallback: {
      title: 'Your notebook fills itself',
      body: 'Every reading you record on a lab bench appears here, grouped by experiment. Take a reading and come back.',
    },
    steps: [
      {
        target: 'notebook-card',
        title: 'One notebook per experiment',
        body: 'All the readings for one experiment, with the current result worked out from them.',
      },
      {
        target: 'notebook-actions',
        title: 'Add, calculate, export',
        body: 'Add reading returns to the lab bench. Calculate & graph opens the analysis. CSV downloads the table for a spreadsheet.',
      },
      {
        target: 'notebook-table',
        title: 'Edit your readings',
        body: 'Delete a reading with ✕, or clear the whole table. Readings taken under different settings are marked “not graphed”.',
      },
    ],
  },

  viva: {
    id: 'viva',
    label: 'Viva',
    steps: [
      {
        target: 'viva-cards',
        title: 'Viva practice',
        body: 'One question set per experiment. The bar shows your best score so far.',
      },
      {
        target: 'viva-start',
        title: 'Start a viva',
        body: 'Opens the questions for that experiment. You can retake it as often as you like.',
      },
    ],
  },

  progress: {
    id: 'progress',
    label: 'Progress',
    steps: [
      {
        target: 'progress-overall',
        title: 'Overall progress',
        body: 'Your progress across every experiment and area. An experiment is complete once you have enough readings, have viewed the analysis and have taken the viva.',
      },
      {
        target: 'progress-table',
        title: 'Stage by stage',
        body: 'A tick for every stage you have finished, with readings, best viva score and time for each experiment.',
      },
      {
        target: 'progress-reset',
        title: 'Start over',
        body: 'Clears all readings, viva scores and lab time. You will be asked to confirm, and it cannot be undone.',
      },
    ],
  },

  about: {
    id: 'about',
    label: 'About',
    steps: [
      {
        target: 'about-chain',
        title: 'How experiments are built',
        body: 'Each experiment is defined from its formula through to its expected result before anything is drawn on screen.',
      },
      {
        target: 'about-guides',
        title: 'Guide settings',
        body: 'Turn first-time guides on or off, or reset them so every section shows its guide again.',
      },
    ],
  },
}

const STAGE_IDS = ['theory', 'lab', 'analysis', 'viva', 'report']

/**
 * Map a route to the guide for that section, mirroring the routes in App.tsx.
 * Routes that render the 404 page (extra segments, unknown experiments) have no guide.
 * The router matches the first segment case-insensitively; ids and stages are matched exactly.
 */
export function sectionForPath(pathname: string): string | null {
  const seg = pathname.split('/').filter(Boolean)
  if (seg.length === 0) return 'home'
  switch (seg[0].toLowerCase()) {
    case 'dashboard':
      return seg.length === 1 ? 'dashboard' : null
    case 'experiments': {
      if (seg.length === 1) return 'experiments'
      if (seg.length > 3 || !getExperiment(seg[1])) return null
      const stage = seg[2] ?? 'theory'
      return STAGE_IDS.includes(stage) ? `experiment-${stage}` : null
    }
    case 'lab':
      // /lab/<anything> shows the bench (unknown ids fall back to the first experiment).
      return seg.length <= 2 ? 'virtual-lab' : null
    case 'theory':
    case 'notebook':
    case 'viva':
    case 'progress':
    case 'about':
      return seg.length === 1 ? seg[0].toLowerCase() : null
    default:
      return null
  }
}

export const targetSelector = (name: string) => `[data-guide~="${name}"]`

/** The first matching element that is actually laid out (so hidden desktop/mobile variants are ignored). */
export function findTarget(name: string): HTMLElement | null {
  const els = document.querySelectorAll<HTMLElement>(targetSelector(name))
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return el
  }
  return null
}
