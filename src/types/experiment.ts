import type { ComponentType } from 'react'

/**
 * The PHYSILAB experiment contract.
 *
 * Every experiment is a single `ExperimentModule`. The shared pages (theory, lab bench,
 * notebook, analysis, viva, report) are driven entirely by this object, so adding
 * experiment 07 means writing one new module — nothing in the shell changes.
 *
 * The rule the whole platform is built around: the animation (`Apparatus`), the readings
 * (`observation.measure`) and the analysis (`analyze`) must all call the same physics
 * functions in `src/physics`. Nothing is animated or tabulated from made-up numbers.
 */

export type CategoryId =
  | 'mechanics'
  | 'optics'
  | 'electromagnetism'
  | 'waves'
  | 'modern'
  | 'semiconductor'

export type ParamValue = number | string | boolean
export type Params = Record<string, ParamValue>

interface ParameterBase {
  key: string
  label: string
  hint?: string
  /** Hide a control when it has no effect for the current configuration. */
  visible?: (p: Params) => boolean
}

export interface RangeParameter extends ParameterBase {
  kind: 'range'
  min: number
  max: number
  step: number
  default: number
  unit?: string
  /** Number of decimals to show. Defaults to decimals of `step`. */
  decimals?: number
}

export interface SelectParameter extends ParameterBase {
  kind: 'select'
  options: { value: string; label: string }[]
  default: string
}

export interface ToggleParameter extends ParameterBase {
  kind: 'toggle'
  default: boolean
}

export type ParameterDef = RangeParameter | SelectParameter | ToggleParameter

export interface Column {
  key: string
  /** Plain-text label, e.g. "T²". */
  label: string
  unit?: string
  decimals?: number
}

export type Cell = number | string
export type Row = Record<string, Cell>

export interface ObservationRow {
  id: string
  createdAt: string
  values: Row
}

export interface MeasureContext {
  /** Apply realistic instrument error (reaction time, least count, meter flicker). */
  noise: boolean
  /** Standard normal random number generator. */
  gauss: () => number
}

export type MeasureResult = { ok: true; row: Row } | { ok: false; error: string }

export interface Readout {
  label: string
  value: string
  unit?: string
  /** 'theory' = computed from formulas; 'live' = read off the running simulation. */
  tone?: 'theory' | 'live'
}

export interface ApparatusProps {
  params: Params
  running: boolean
  /** Playback rate (0.1 = slow motion). */
  speed: number
  /** Changes whenever the student presses Reset. */
  resetKey: number
  /** Let the apparatus stop the clock itself (e.g. the projectile has landed). */
  onStop?: () => void
}

export interface LinearFit {
  slope: number
  intercept: number
  r2: number
  slopeSE: number
  interceptSE: number
  n: number
}

export interface ResultItem {
  label: string
  /** KaTeX symbol, e.g. "g". */
  symbol: string
  value: number
  unit: string
  uncertainty?: number
  accepted?: number
  acceptedLabel?: string
  decimals?: number
}

export interface CalcStep {
  label: string
  tex: string
}

export interface AnalysisOutput {
  x: { label: string; unit: string }
  y: { label: string; unit: string }
  points: { x: number; y: number }[]
  fit?: LinearFit
  /** Join the points in x order (for curved, non-linear characteristics). */
  connectPoints?: boolean
  results: ResultItem[]
  calculations: CalcStep[]
  warnings: string[]
  conclusion: string
}

export interface TheorySection {
  heading: string
  body: string[]
  formulas?: { tex: string; caption?: string }[]
}

export interface VariableDef {
  symbol: string
  name: string
  unit: string
  role: 'independent' | 'dependent' | 'controlled' | 'constant'
}

export interface VivaQuestion {
  q: string
  options: string[]
  answer: number
  explanation: string
}

export interface ExperimentModule {
  id: string
  number: string
  title: string
  category: CategoryId
  tagline: string
  summary: string
  difficulty: 'Introductory' | 'Intermediate' | 'Advanced'
  durationMin: number

  aim: string
  objectives: string[]
  apparatusList: string[]
  theory: TheorySection[]
  variables: VariableDef[]
  procedure: string[]
  precautions: string[]
  /** "How this simulation is built": the defensible physics disclosure. */
  model: {
    equations: { tex: string; caption: string }[]
    assumptions: string[]
    method: string
  }

  parameters: ParameterDef[]
  Apparatus: ComponentType<ApparatusProps>
  readouts: (p: Params) => Readout[]

  observation: {
    columns: Column[]
    measure: (p: Params, ctx: MeasureContext) => MeasureResult
    measureLabel: string
    hint: string
    minTrials: number
    /**
     * Parameters that must be held constant for rows to belong on one graph.
     * The analysis uses rows matching the latest reading and reports the rest.
     */
    controlKeys: string[]
  }

  analyze: (rows: Row[]) => AnalysisOutput | null
  viva: VivaQuestion[]
}

export interface PlannedExperiment {
  title: string
  category: CategoryId
}
