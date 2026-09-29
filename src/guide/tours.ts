import { getExperiment } from '@/experiments/registry'

/**
 * Page guides, one per section. They open only when the student presses "Page guide".
 *
 * A step's `target` names an element marked `data-guide="<target>"` in the page.
 * Steps whose target is not on screen (e.g. desktop-only controls on a phone) are left out,
 * so every guide adapts to the layout. A step without a target is shown centred.
 */
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
  /** Shown when none of the guide's targets are on screen (e.g. nothing to analyse yet). */
  fallback?: { title: string; body: string }
}

export const TOURS: Record<string, Tour> = {
  home: {
    id: 'home',
    label: 'Home',
    steps: [
      {
        target: 'home-demo',
        title: 'A live experiment',
        body: () =>
          prefersReducedMotion()
            ? 'The real photoelectric apparatus from Experiment 06, shown still because your device is set to reduce motion.'
            : 'The real photoelectric apparatus from Experiment 06. Electrons (blue dots) leave the sodium plate only while the light is short enough in wavelength.',
      },
      {
        target: 'home-cta',
        title: 'Two ways in',
        body: 'Explore Experiments walks you through an experiment step by step. Enter Virtual Lab lets you play with any apparatus.',
      },
      {
        target: 'home-experiments',
        title: 'Pick an experiment',
        body: 'Each card opens an experiment. The bar fills as you finish its stages.',
      },
    ],
  },

  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    steps: [
      { target: 'dash-name', title: 'Your name', body: 'Type your name here — it is printed on your lab reports.' },
      { target: 'dash-stats', title: 'At a glance', body: 'Experiments completed, lab time, viva score and readings taken.' },
      { target: 'dash-continue', title: 'What next', body: 'Your suggested next step. Press Continue to jump straight there.' },
    ],
  },

  experiments: {
    id: 'experiments',
    label: 'Experiments',
    steps: [
      { target: 'exp-filters', title: 'Filter', body: 'Show experiments from one area only.' },
      { target: 'exp-grid', title: 'Open one', body: 'Click a card to start that experiment.' },
    ],
  },

  'experiment-theory': {
    id: 'experiment-theory',
    label: 'Aim & theory',
    steps: [
      {
        target: 'stage-nav',
        title: 'Five stages',
        body: 'Aim & theory → Lab bench → Analysis → Viva → Report. A tick shows each stage you have finished.',
      },
      { target: 'theory-section', title: 'Theory', body: 'Read the theory and formulae before you take readings.' },
      {
        target: 'theory-model',
        title: 'How it is simulated',
        body: 'The equations behind the apparatus — handy when an examiner asks where your numbers come from.',
      },
    ],
  },

  'experiment-lab': {
    id: 'experiment-lab',
    label: 'Lab bench',
    steps: [
      { target: 'bench-apparatus', title: 'Apparatus', body: 'Press Start to run the simulation. Reset starts it again.' },
      { target: 'bench-params', title: 'Settings', body: 'Change the experimental conditions with these controls.' },
      { target: 'bench-measure', title: 'Take a reading', body: 'Records a measurement at the current settings. Change a setting between readings.' },
      { target: 'lab-assistant', title: 'Lab Assistant', body: 'Checks your readings as you go and suggests what to do next.' },
    ],
  },

  'experiment-analysis': {
    id: 'experiment-analysis',
    label: 'Analysis',
    fallback: {
      title: 'Nothing to analyse yet',
      body: 'Take at least two readings on the Lab bench, then come back for the graph and result.',
    },
    steps: [
      {
        target: 'analysis-graph',
        title: 'Your graph',
        body: 'Orange points are your readings. For straight-line relationships the blue line is the best fit; for a lamp or diode it just joins the points.',
      },
      { target: 'analysis-results', title: 'Your result', body: 'Compared with the accepted value where there is one. Green means within 2%.' },
      { target: 'analysis-calcs', title: 'Calculations', body: 'Every step with your numbers filled in, ready for your record.' },
    ],
  },

  'experiment-viva': {
    id: 'experiment-viva',
    label: 'Viva',
    fallback: {
      title: 'Viva complete',
      body: 'Your score is saved. Press Try again to retake it — questions you missed come first.',
    },
    steps: [
      {
        target: 'viva-question',
        title: 'Viva',
        body: 'Questions you missed last time come first. A wrong answer shows which theory to revise.',
      },
      { target: 'viva-options', title: 'Answer', body: 'Pick one option, then press Submit answer.' },
    ],
  },

  'experiment-report': {
    id: 'experiment-report',
    label: 'Report',
    steps: [
      { target: 'report-name', title: 'Your name', body: 'The name printed on the report.' },
      { target: 'report-pdf', title: 'Save as PDF', body: 'Opens the print dialog — choose “Save as PDF”.' },
    ],
  },

  'virtual-lab': {
    id: 'virtual-lab',
    label: 'Virtual Lab',
    steps: [
      { target: 'vlab-picker', title: 'Choose apparatus', body: 'Switch between experiments freely.' },
      { target: 'bench-measure', title: 'Readings are kept', body: 'Readings taken here go into the same notebook as the guided experiment.' },
      { target: 'vlab-analyse', title: 'Analyse', body: 'Jump to the graph and result for these readings.' },
    ],
  },

  theory: {
    id: 'theory',
    label: 'Theory',
    steps: [{ target: 'theory-search', title: 'Search', body: 'Type a word such as “period” or “flux” to filter every experiment’s theory.' }],
  },

  notebook: {
    id: 'notebook',
    label: 'Lab Notebook',
    fallback: {
      title: 'Your notebook is empty',
      body: 'Readings appear here, grouped by experiment, as soon as you record them on a lab bench.',
    },
    steps: [
      { target: 'notebook-card', title: 'One notebook per experiment', body: 'All your readings for an experiment, with the current result.' },
      { target: 'notebook-actions', title: 'Actions', body: 'Add a reading, open the graph, or download the table as CSV.' },
    ],
  },

  viva: {
    id: 'viva',
    label: 'Viva',
    steps: [{ target: 'viva-cards', title: 'Viva practice', body: 'One set per experiment. The bar shows your best score.' }],
  },

  progress: {
    id: 'progress',
    label: 'Progress',
    steps: [
      { target: 'progress-overall', title: 'Overall', body: 'How far you are through every experiment and area.' },
      { target: 'progress-table', title: 'Stage by stage', body: 'A tick for each finished stage, with readings, best viva score and time.' },
    ],
  },

  about: {
    id: 'about',
    label: 'About',
    steps: [{ target: 'about-chain', title: 'How experiments are built', body: 'Each experiment is defined from formula to expected result before anything is drawn.' }],
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
