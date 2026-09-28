import type { ExperimentModule } from '@/types/experiment'
import type { ExperimentRecord } from './labStore'

export type StageId = 'theory' | 'lab' | 'analysis' | 'viva' | 'report'

export const STAGES: { id: StageId; label: string }[] = [
  { id: 'theory', label: 'Aim & theory' },
  { id: 'lab', label: 'Lab bench' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'viva', label: 'Viva' },
  { id: 'report', label: 'Report' },
]

export function stageStatus(m: ExperimentModule, r: ExperimentRecord): Record<StageId, boolean> {
  return {
    theory: !!r.theoryViewed,
    lab: r.rows.length >= m.observation.minTrials,
    analysis: !!r.analysisViewed && r.rows.length >= m.observation.minTrials,
    viva: r.vivaAttempts.length > 0,
    report: !!r.reportViewed,
  }
}

export function stageFraction(m: ExperimentModule, r: ExperimentRecord): number {
  const s = stageStatus(m, r)
  return Object.values(s).filter(Boolean).length / STAGES.length
}

/** An experiment counts as performed once readings, analysis and viva are all done. */
export function isCompleted(m: ExperimentModule, r: ExperimentRecord): boolean {
  const s = stageStatus(m, r)
  return s.lab && s.analysis && s.viva
}

export function bestViva(r: ExperimentRecord): number | undefined {
  if (!r.vivaAttempts.length) return undefined
  return Math.max(...r.vivaAttempts.map((a) => a.score / a.total))
}
