import { useEffect } from 'react'
import { Link, NavLink, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Clock } from 'lucide-react'
import { getExperiment } from '@/experiments/registry'
import { categoryLabel } from '@/data/categories'
import { lab, useExperimentRecord } from '@/store/labStore'
import { STAGES, stageStatus, type StageId } from '@/store/progress'
import { useLabTimer } from '@/hooks/useLabTimer'
import { ButtonLink } from '@/components/ui/Button'
import { Tag } from '@/components/ui/misc'
import { TheoryView } from '@/components/experiment/TheoryView'
import { LabBench } from '@/components/experiment/LabBench'
import { AnalysisView } from '@/components/experiment/AnalysisView'
import { VivaQuiz } from '@/components/experiment/VivaQuiz'
import { LabReport } from '@/components/experiment/LabReport'
import { cn } from '@/utils/cn'
import NotFound from './NotFound'

export default function ExperimentPage() {
  const { id, stage } = useParams()
  const m = getExperiment(id)
  const record = useExperimentRecord(id ?? '')

  useLabTimer(m?.id ?? 'unknown')
  useEffect(() => {
    if (m) lab.visit(m.id)
  }, [m])
  useEffect(() => {
    if (m && (stage ?? 'theory') === 'theory') lab.mark(m.id, 'theoryViewed')
  }, [m, stage])
  useEffect(() => {
    // A #section link (e.g. from Ask PHYSILAB) scrolls itself; otherwise start each stage at the top.
    if (!window.location.hash) window.scrollTo({ top: 0 })
  }, [stage])

  if (!m) return <NotFound />
  const current = (stage ?? 'theory') as StageId
  const idx = STAGES.findIndex((s) => s.id === current)
  if (idx === -1) return <Navigate to={`/experiments/${m.id}`} replace />
  const status = stageStatus(m, record)
  const prev = STAGES[idx - 1]
  const next = STAGES[idx + 1]
  const href = (s: StageId) => (s === 'theory' ? `/experiments/${m.id}` : `/experiments/${m.id}/${s}`)

  return (
    <div>
      <div className="no-print">
        <Link to="/experiments" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
          <ArrowLeft size={14} /> All experiments
        </Link>
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="readout mt-1 hidden text-4xl font-medium text-ink-3 sm:block">{m.number}</span>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <Tag tone="prussian">{categoryLabel(m.category)}</Tag>
                <Tag>{m.difficulty}</Tag>
                <span className="inline-flex items-center gap-1 text-xs text-ink-3">
                  <Clock size={12} /> {m.durationMin} min
                </span>
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{m.title}</h1>
              <p className="mt-1 text-ink-2">{m.tagline}</p>
            </div>
          </div>
        </header>

        {/* The experiment sequence: theory → bench → analysis → viva → report */}
        <nav data-guide="stage-nav" aria-label="Experiment stages" className="mb-6 overflow-x-auto">
          <ol className="flex min-w-max gap-1 rounded-xl border border-line bg-panel p-1">
            {STAGES.map((s, i) => (
              <li key={s.id} className="flex-1">
                <NavLink
                  to={href(s.id)}
                  end
                  className={cn(
                    'flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors',
                    current === s.id ? 'bg-prussian text-[var(--paper)]' : 'text-ink-2 hover:bg-panel-2 hover:text-ink',
                  )}
                >
                  <span
                    className={cn(
                      'readout grid h-5 w-5 place-items-center rounded-full text-[11px]',
                      status[s.id] ? 'bg-ok text-[var(--paper)]' : current === s.id ? 'bg-[var(--paper)]/20' : 'border border-line',
                    )}
                  >
                    {status[s.id] ? <Check size={11} strokeWidth={3} /> : i + 1}
                  </span>
                  {s.label}
                </NavLink>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {current === 'theory' && <TheoryView module={m} />}
      {current === 'lab' && <LabBench key={m.id} module={m} />}
      {current === 'analysis' && <AnalysisView module={m} />}
      {current === 'viva' && <VivaQuiz key={m.id} module={m} />}
      {current === 'report' && <LabReport module={m} />}

      <div className="no-print mt-8 flex justify-between gap-3 border-t border-line pt-5">
        {prev ? (
          <ButtonLink to={href(prev.id)} variant="ghost">
            <ArrowLeft size={14} /> {prev.label}
          </ButtonLink>
        ) : (
          <span />
        )}
        {next && (
          <ButtonLink to={href(next.id)} variant="secondary" data-guide="stage-next">
            {next.label} <ArrowRight size={14} />
          </ButtonLink>
        )}
      </div>
    </div>
  )
}
