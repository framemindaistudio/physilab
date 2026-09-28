import { Link } from 'react-router-dom'
import { ArrowRight, Download, NotebookPen } from 'lucide-react'
import { EXPERIMENTS } from '@/experiments/registry'
import { lab, useLab } from '@/store/labStore'
import { ObservationTable, exportCsv } from '@/components/experiment/ObservationTable'
import { computeAnalysis } from '@/components/experiment/useAnalysis'
import { ButtonLink, Button } from '@/components/ui/Button'
import { EmptyState, PageHeader } from '@/components/ui/misc'
import { fixed, formatDate } from '@/utils/format'

export default function Notebook() {
  const state = useLab()
  const withRows = EXPERIMENTS.filter((m) => (state.experiments[m.id]?.rows.length ?? 0) > 0)

  return (
    <div>
      <PageHeader eyebrow="My Lab Notebook" title="Lab notebook">
        Every reading you have recorded, one notebook per experiment. Readings are saved in this browser.
      </PageHeader>

      {withRows.length === 0 ? (
        <EmptyState
          icon={<NotebookPen size={28} />}
          title="Your notebook is empty"
          action={
            <ButtonLink to="/experiments/pendulum/lab" variant="primary">
              Start with the simple pendulum
            </ButtonLink>
          }
        >
          Readings appear here as soon as you record them on a lab bench.
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {withRows.map((m) => {
            const r = state.experiments[m.id]
            const a = computeAnalysis(m, r.rows)
            const main = a.result?.results[0]
            return (
              <section key={m.id} className="panel p-5 sm:p-6" aria-labelledby={`nb-${m.id}`}>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="readout text-xs text-ink-3">
                      Experiment {m.number} · {r.rows.length} readings · last {formatDate(r.rows[r.rows.length - 1].createdAt)}
                    </p>
                    <h2 id={`nb-${m.id}`} className="font-display text-xl font-semibold tracking-tight">
                      {m.title}
                    </h2>
                    {main && Number.isFinite(main.value) && (
                      <p className="mt-1 text-sm text-ink-2">
                        Current result: {main.label.toLowerCase()} ={' '}
                        <span className="readout text-ink">
                          {fixed(main.value, main.decimals ?? 3)} {main.unit}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" onClick={() => exportCsv(m, r.rows)}>
                      <Download size={14} /> CSV
                    </Button>
                    <ButtonLink size="sm" to={`/experiments/${m.id}/lab`}>
                      Add reading
                    </ButtonLink>
                    <ButtonLink size="sm" variant="primary" to={`/experiments/${m.id}/analysis`}>
                      Calculate & graph <ArrowRight size={14} />
                    </ButtonLink>
                  </div>
                </div>
                <ObservationTable module={m} rows={r.rows} onRemove={(id) => lab.removeRow(m.id, id)} onClear={() => lab.clearRows(m.id)} />
              </section>
            )
          })}
          <p className="text-center text-sm text-ink-3">
            Looking for another experiment?{' '}
            <Link to="/experiments" className="text-prussian hover:underline">
              Browse the catalogue
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
