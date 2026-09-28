import { useEffect, type ReactNode } from 'react'
import { FileDown } from 'lucide-react'
import type { ExperimentModule } from '@/types/experiment'
import { lab, useExperimentRecord, useLab } from '@/store/labStore'
import { bestViva } from '@/store/progress'
import { categoryLabel } from '@/data/categories'
import { fixed, formatDate, formatDuration, sig } from '@/utils/format'
import { Button } from '@/components/ui/Button'
import { Formula } from '@/components/ui/Formula'
import { FitChart } from '@/components/charts/FitChart'
import { CREDIT } from '@/components/layout/CreditFooter'
import { ObservationTable } from './ObservationTable'
import { useAnalysis } from './useAnalysis'

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="print-avoid-break border-t border-line pt-5">
      <h2 className="mb-2 font-display text-base font-semibold uppercase tracking-wide text-ink">{title}</h2>
      {children}
    </section>
  )
}

export function LabReport({ module: m }: { module: ExperimentModule }) {
  const record = useExperimentRecord(m.id)
  const { studentName } = useLab()
  const { used, result } = useAnalysis(m, record.rows)
  const best = bestViva(record)
  const lastViva = record.vivaAttempts[record.vivaAttempts.length - 1]

  useEffect(() => {
    lab.mark(m.id, 'reportViewed')
  }, [m.id])

  return (
    <div>
      <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-3">
        <div data-guide="report-name">
          <label htmlFor="student-name" className="mb-1 block text-xs text-ink-3">
            Name on the report
          </label>
          <input
            id="student-name"
            value={studentName}
            onChange={(e) => lab.setStudentName(e.target.value)}
            placeholder="Your name"
            className="h-9 w-64 rounded-lg border border-line bg-panel px-3 text-sm"
          />
        </div>
        <div data-guide="report-pdf" className="text-right">
          <Button variant="primary" onClick={() => window.print()}>
            <FileDown size={16} /> Download PDF
          </Button>
          <p className="mt-1 text-xs text-ink-3">Opens the print dialog — choose “Save as PDF”.</p>
        </div>
      </div>

      <article data-guide="report-sheet" className="print-sheet panel mx-auto max-w-[820px] space-y-5 p-6 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-4 pb-1">
          <div>
            <p className="font-display text-xl font-extrabold tracking-tight text-prussian">PHYSILAB</p>
            <p className="text-xs text-ink-3">Virtual Physics Laboratory · Laboratory record</p>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-3 text-xs">
            <dt className="text-ink-3">Student</dt>
            <dd className="text-ink">{studentName || '—'}</dd>
            <dt className="text-ink-3">Date</dt>
            <dd className="text-ink">{formatDate(new Date().toISOString())}</dd>
            <dt className="text-ink-3">Time at bench</dt>
            <dd className="text-ink">{formatDuration(record.timeSpentMs)}</dd>
          </dl>
        </header>

        <div>
          <p className="eyebrow">
            Experiment {m.number} · {categoryLabel(m.category)}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{m.title}</h1>
        </div>

        <Block title="Aim">
          <p className="text-ink-2">{m.aim}</p>
        </Block>

        <Block title="Apparatus">
          <p className="text-sm text-ink-2">{m.apparatusList.join(' · ')}</p>
        </Block>

        <Block title="Theory">
          <div className="space-y-3 text-sm text-ink-2">
            {m.theory.map((s) => (
              <div key={s.heading}>
                <p className="font-medium text-ink">{s.heading}</p>
                <p>{s.body[0]}</p>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Formulae">
          <div className="grid gap-2 sm:grid-cols-2">
            {m.theory
              .flatMap((s) => s.formulas ?? [])
              .map((f) => (
                <div key={f.tex} className="rounded border border-line px-3 py-2">
                  <Formula tex={f.tex} block />
                  {f.caption && <p className="text-center text-[11px] text-ink-3">{f.caption}</p>}
                </div>
              ))}
          </div>
        </Block>

        <Block title="Procedure">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-2">
            {m.procedure.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </Block>

        <Block title="Observations">
          {record.rows.length ? (
            <ObservationTable module={m} rows={record.rows} compact />
          ) : (
            <p className="text-sm text-ink-3">No readings recorded.</p>
          )}
          <p className="mt-2 text-xs text-ink-3">
            Instrument error {lab.get().noise ? 'included' : 'switched off'} while recording. {used.length} of {record.rows.length} readings used in the analysis.
          </p>
        </Block>

        {result && (
          <>
            <Block title="Graph">
              <div className="rounded border border-line p-2">
                <FitChart analysis={result} height={300} />
              </div>
              {result.fit && (
                <p className="mt-2 text-center text-xs text-ink-3">
                  Least-squares fit: slope = {sig(result.fit.slope, 5)} ± {sig(result.fit.slopeSE, 2)}, intercept = {sig(result.fit.intercept, 3)}, R² = {fixed(result.fit.r2, 4)}
                </p>
              )}
            </Block>

            <Block title="Calculations">
              <div className="space-y-1">
                {result.calculations.map((c) => (
                  <div key={c.label} className="grid gap-1 sm:grid-cols-[200px_1fr] sm:items-center">
                    <p className="text-sm text-ink-2">{c.label}</p>
                    <Formula tex={c.tex} block />
                  </div>
                ))}
              </div>
            </Block>

            <Block title="Result">
              <ul className="space-y-1.5">
                {result.results.map((r) => (
                  <li key={r.label} className="text-sm text-ink">
                    {r.label}: <Formula tex={r.symbol} /> ={' '}
                    <span className="readout font-semibold">
                      {fixed(r.value, r.decimals ?? 3)}
                      {r.uncertainty !== undefined && ` ± ${sig(r.uncertainty, 2)}`}
                    </span>{' '}
                    {r.unit}
                    {r.accepted !== undefined && <span className="text-ink-3"> (accepted {fixed(r.accepted, r.decimals ?? 3)})</span>}
                  </li>
                ))}
              </ul>
            </Block>

            <Block title="Conclusion">
              <p className="text-sm text-ink-2">{result.conclusion}</p>
            </Block>
          </>
        )}

        <Block title="Precautions">
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
            {m.precautions.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Block>

        <Block title="Viva performance">
          {lastViva ? (
            <p className="text-sm text-ink-2">
              Latest attempt: <span className="readout text-ink">{lastViva.score}/{lastViva.total}</span> on {formatDate(lastViva.completedAt)} · best{' '}
              <span className="readout text-ink">{Math.round((best ?? 0) * 100)}%</span> over {record.vivaAttempts.length} attempt
              {record.vivaAttempts.length === 1 ? '' : 's'}.
            </p>
          ) : (
            <p className="text-sm text-ink-3">Viva not attempted yet.</p>
          )}
        </Block>

        <footer className="flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4 text-[11px] text-ink-3">
          <span className="max-w-[60ch]">
            Generated by PHYSILAB. All readings were produced by the simulation model described in the experiment’s “How this simulation is built” notes.
          </span>
          <span className="readout uppercase tracking-[0.14em] opacity-80">
            Made by: {CREDIT.name} ({CREDIT.role})
          </span>
        </footer>
      </article>
    </div>
  )
}
