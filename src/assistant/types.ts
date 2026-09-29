import type { AnalysisOutput, ExperimentModule, ObservationRow, Params } from '@/types/experiment'

/** How urgent a piece of advice is. Shown in this order: warn, tip, info, good. */
export type AdviceLevel = 'warn' | 'tip' | 'info' | 'good'

export type AdviceAction =
  /** Change bench settings (only offered on the lab bench). */
  | { kind: 'setParams'; label: string; params: Params }
  /** Delete one reading, e.g. an outlier (asks for confirmation). */
  | { kind: 'removeRow'; label: string; rowId: string }
  | { kind: 'link'; label: string; to: string }

export interface Advice {
  /** Stable id so the same advice is not listed twice. */
  id: string
  level: AdviceLevel
  title: string
  detail?: string
  action?: AdviceAction
}

export interface AssistantContext {
  module: ExperimentModule
  /** Every reading in the notebook. */
  rows: ObservationRow[]
  /** Readings that share the latest reading's controlled settings (the ones on the graph). */
  used: ObservationRow[]
  /** Readings taken under other controlled settings. */
  excluded: ObservationRow[]
  analysis: AnalysisOutput | null
  /** Current bench settings. */
  params: Params
  noise: boolean
  where: 'bench' | 'analysis'
  /** Bench only: the current fixed settings differ from the latest reading's, so a new series has begun. */
  newSeries: boolean
}

/** Per-experiment knowledge for the rule-based Lab Assistant. */
export interface AssistantConfig {
  /** The setting to vary between readings, and the observation column that records it. */
  sweep: {
    param: string
    row: string
    /** Symbol used in messages, e.g. "L". */
    label: string
    unit: string
    /** Useful range for the sweep; defaults to the slider's full range. */
    range?: (p: Params) => [number, number]
  }
  /** Parameters stored under a different observation column name, e.g. { turns: 'N' }. */
  rowKeys?: Record<string, string>
  /** Theory predicts a straight line through the origin, so a large intercept means a systematic error. */
  throughOrigin?: boolean
  interceptCause?: string
  /** Likely reasons when the result is far from the accepted value. */
  errorCauses?: string[]
  /** Experiment-specific checks. */
  rules?: (ctx: AssistantContext) => Advice[]
}
