import { useMemo } from 'react'
import type { AnalysisOutput, ExperimentModule, ObservationRow } from '@/types/experiment'

export interface AnalysisState {
  /** Rows that share the control settings of the latest reading. */
  used: ObservationRow[]
  /** Rows taken under different control settings (e.g. a different device). */
  excluded: ObservationRow[]
  result: AnalysisOutput | null
  ready: boolean
}

export function selectRows(m: ExperimentModule, rows: ObservationRow[]): { used: ObservationRow[]; excluded: ObservationRow[] } {
  if (!rows.length) return { used: [], excluded: [] }
  const ref = rows[rows.length - 1].values
  const matches = (r: ObservationRow) => m.observation.controlKeys.every((k) => String(r.values[k]) === String(ref[k]))
  return { used: rows.filter(matches), excluded: rows.filter((r) => !matches(r)) }
}

export function computeAnalysis(m: ExperimentModule, rows: ObservationRow[]): AnalysisState {
  const { used, excluded } = selectRows(m, rows)
  let result: AnalysisOutput | null = null
  if (used.length >= 2) {
    try {
      result = m.analyze(used.map((r) => r.values))
    } catch {
      result = null
    }
  }
  return { used, excluded, result, ready: used.length >= m.observation.minTrials && !!result }
}

export function useAnalysis(m: ExperimentModule, rows: ObservationRow[]): AnalysisState {
  return useMemo(() => computeAnalysis(m, rows), [m, rows])
}
