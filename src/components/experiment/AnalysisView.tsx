import { useEffect } from 'react'
import { AlertTriangle, FlaskConical } from 'lucide-react'
import type { ExperimentModule } from '@/types/experiment'
import { lab, useExperimentRecord } from '@/store/labStore'
import { fixed, sig } from '@/utils/format'
import { FitChart } from '@/components/charts/FitChart'
import { Formula } from '@/components/ui/Formula'
import { EmptyState, SectionTitle } from '@/components/ui/misc'
import { ButtonLink } from '@/components/ui/Button'
import { ObservationTable } from './ObservationTable'
import { ResultCard } from './ResultCard'
import { useAnalysis } from './useAnalysis'
import { defaultParams } from './LabBench'
import { LabAssistantPanel } from '@/components/assistant/LabAssistantPanel'

export function AnalysisView({ module: m }: { module: ExperimentModule }) {
  const record = useExperimentRecord(m.id)
  const { used, excluded, result, ready } = useAnalysis(m, record.rows)

  useEffect(() => {
    if (ready) lab.mark(m.id, 'analysisViewed')
  }, [ready, m.id])

  if (!result) {
    return (
      <EmptyState
        icon={<FlaskConical size={28} />}
        title={record.rows.length === 0 ? 'No readings to analyse yet' : 'Not enough readings for a graph yet'}
        action={
          <ButtonLink to={`/experiments/${m.id}/lab`} variant="primary">
            Go to the lab bench
          </ButtonLink>
        }
      >
        Take at least {m.observation.minTrials} readings with different values of the independent variable, then come back to
        plot the graph and compute the result.
      </EmptyState>
    )
  }

  const { fit } = result
  return (
    <div className="space-y-6">
      {!ready && (
        <div className="flex items-start gap-2.5 rounded-lg border border-sodium/40 bg-sodium-soft px-4 py-3 text-sm text-ink">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-sodium-strong" />
          <span>
            This is a preview from {used.length} reading{used.length === 1 ? '' : 's'}. Take at least {m.observation.minTrials} for a reliable result.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section data-guide="analysis-graph" className="panel p-4 sm:p-5">
          <SectionTitle
            aside={
              fit && (
                <span className="readout text-xs text-ink-3">
                  n = {fit.n} · R² = {fixed(fit.r2, 4)}
                </span>
              )
            }
          >
            Graph: {result.y.label} vs {result.x.label}
          </SectionTitle>
          <div className="graph-paper rounded-lg border border-line bg-panel p-2">
            <FitChart analysis={result} />
          </div>
          {fit && (
            <p className="mt-3 text-center text-sm text-ink-2">
              Best-fit line: <Formula tex={`y = (${sig(fit.slope, 5)} \\pm ${sig(fit.slopeSE, 2)})\\,x ${fit.intercept >= 0 ? '+' : '-'} ${sig(Math.abs(fit.intercept), 3)}`} />
            </p>
          )}
        </section>

        <section data-guide="analysis-results" className="space-y-3">
          <p className="eyebrow">Result</p>
          {result.results.map((r) => (
            <ResultCard key={r.label} r={r} />
          ))}
        </section>
      </div>

      <LabAssistantPanel module={m} where="analysis" params={{ ...defaultParams(m), ...(record.params ?? {}) }} />

      {result.warnings.length > 0 && (
        <div className="space-y-2">
          {result.warnings.map((w) => (
            <div key={w} className="flex items-start gap-2.5 rounded-lg border border-sodium/40 bg-sodium-soft px-4 py-3 text-sm text-ink">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-sodium-strong" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <section data-guide="analysis-calcs" className="panel p-5 sm:p-6">
        <SectionTitle>Calculations</SectionTitle>
        <ol className="divide-y divide-line">
          {result.calculations.map((c, i) => (
            <li key={c.label} className="grid gap-1 py-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center sm:gap-4">
              <p className="text-sm text-ink-2">
                <span className="readout mr-2 text-ink-3">{i + 1}.</span>
                {c.label}
              </p>
              <div className="overflow-x-auto text-ink">
                <Formula tex={c.tex} block />
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section data-guide="analysis-conclusion" className="rounded-[10px] border border-prussian/30 bg-prussian-soft/60 p-5 sm:p-6">
        <p className="eyebrow mb-2 text-prussian">Conclusion</p>
        <p className="max-w-[75ch] text-[15.5px] leading-relaxed text-ink">{result.conclusion}</p>
      </section>

      <section className="panel p-4 sm:p-5">
        <SectionTitle aside={excluded.length > 0 && <span className="text-xs text-ink-3">{excluded.length} readings under other settings are not graphed</span>}>
          Readings used
        </SectionTitle>
        <ObservationTable module={m} rows={record.rows} compact />
      </section>
    </div>
  )
}
