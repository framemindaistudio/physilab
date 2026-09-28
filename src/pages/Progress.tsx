import { Check, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EXPERIMENTS } from '@/experiments/registry'
import { CATEGORIES } from '@/data/categories'
import { lab, useLab } from '@/store/labStore'
import { bestViva, isCompleted, STAGES, stageFraction, stageStatus } from '@/store/progress'
import { Button } from '@/components/ui/Button'
import { Meter, PageHeader, Tag } from '@/components/ui/misc'
import { formatDuration } from '@/utils/format'

const EMPTY = { rows: [], vivaAttempts: [], timeSpentMs: 0 }

export default function Progress() {
  const state = useLab()
  const rec = (id: string) => state.experiments[id] ?? EMPTY
  const overall = EXPERIMENTS.reduce((s, m) => s + stageFraction(m, rec(m.id)), 0) / EXPERIMENTS.length

  return (
    <div>
      <PageHeader
        eyebrow="Progress"
        title="Progress report"
        actions={
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (window.confirm('Reset all readings, viva scores and lab time? This cannot be undone.')) lab.resetAll()
            }}
          >
            Reset all progress
          </Button>
        }
      >
        An experiment counts as complete once you have enough readings, have viewed the analysis, and have taken the viva.
      </PageHeader>

      <section className="panel mb-6 p-5 sm:p-6">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="font-display text-lg font-semibold tracking-tight">Overall</p>
          <p className="readout text-2xl text-ink">{Math.round(overall * 100)}%</p>
        </div>
        <Meter value={overall} />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => {
            const mods = EXPERIMENTS.filter((m) => m.category === c.id)
            const frac = mods.length ? mods.reduce((s, m) => s + stageFraction(m, rec(m.id)), 0) / mods.length : 0
            return (
              <div key={c.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-ink-2">{c.label}</span>
                  <span className="readout text-xs text-ink-3">{mods.length ? `${Math.round(frac * 100)}%` : 'planned'}</span>
                </div>
                <Meter value={frac} />
              </div>
            )
          })}
        </div>
      </section>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">Progress by experiment and stage</caption>
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-3">
              <th scope="col" className="px-4 py-3 font-medium">Experiment</th>
              {STAGES.map((s) => (
                <th key={s.id} scope="col" className="px-2 py-3 text-center font-medium">
                  {s.label}
                </th>
              ))}
              <th scope="col" className="px-3 py-3 text-right font-medium">Readings</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Best viva</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {EXPERIMENTS.map((m) => {
              const r = rec(m.id)
              const st = stageStatus(m, r)
              const best = bestViva(r)
              return (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    <Link to={`/experiments/${m.id}`} className="font-medium text-ink hover:text-prussian">
                      {m.number} {m.title}
                    </Link>
                    {isCompleted(m, r) && (
                      <span className="ml-2">
                        <Tag tone="ok">complete</Tag>
                      </span>
                    )}
                  </th>
                  {STAGES.map((s) => (
                    <td key={s.id} className="px-2 py-3 text-center">
                      {st[s.id] ? (
                        <Check size={16} className="mx-auto text-ok" aria-label="done" />
                      ) : (
                        <Minus size={16} className="mx-auto text-line" aria-label="not done" />
                      )}
                    </td>
                  ))}
                  <td className="readout px-3 py-3 text-right text-ink-2">
                    {r.rows.length}/{m.observation.minTrials}
                  </td>
                  <td className="readout px-3 py-3 text-right text-ink-2">{best === undefined ? '—' : `${Math.round(best * 100)}%`}</td>
                  <td className="readout px-4 py-3 text-right text-ink-2">{formatDuration(r.timeSpentMs)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
