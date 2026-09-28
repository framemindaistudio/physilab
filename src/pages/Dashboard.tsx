import { ArrowRight, Clock, FlaskConical, GraduationCap, NotebookPen } from 'lucide-react'
import type { ReactNode } from 'react'
import { EXPERIMENTS, getExperiment } from '@/experiments/registry'
import { CATEGORIES, PLANNED } from '@/data/categories'
import { lab, useLab } from '@/store/labStore'
import { bestViva, isCompleted, STAGES, stageFraction, stageStatus } from '@/store/progress'
import { ButtonLink } from '@/components/ui/Button'
import { Meter } from '@/components/ui/misc'
import { ExperimentGlyph } from '@/components/experiment/ExperimentGlyph'
import { formatDuration } from '@/utils/format'

const EMPTY = { rows: [], vivaAttempts: [], timeSpentMs: 0 }

function Stat({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 text-ink-3">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="readout mt-2 text-3xl font-medium text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-3">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const state = useLab()
  const rec = (id: string) => state.experiments[id] ?? EMPTY
  const completed = EXPERIMENTS.filter((m) => isCompleted(m, rec(m.id))).length
  const total = EXPERIMENTS.length + PLANNED.length
  const time = Object.values(state.experiments).reduce((s, r) => s + r.timeSpentMs, 0)
  const vivaBests = EXPERIMENTS.map((m) => bestViva(rec(m.id))).filter((v): v is number => v !== undefined)
  const vivaAvg = vivaBests.length ? vivaBests.reduce((a, b) => a + b, 0) / vivaBests.length : undefined
  const readings = Object.values(state.experiments).reduce((s, r) => s + r.rows.length, 0)

  const last = getExperiment(state.lastExperimentId)
  const continueWith = last && !isCompleted(last, rec(last.id)) ? last : EXPERIMENTS.find((m) => !isCompleted(m, rec(m.id)))
  const nextStage = continueWith ? STAGES.find((s) => !stageStatus(continueWith, rec(continueWith.id))[s.id]) : undefined

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Dashboard</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome,{' '}
            <input
              aria-label="Your name"
              data-guide="dash-name"
              value={state.studentName}
              placeholder="Student"
              onChange={(e) => lab.setStudentName(e.target.value)}
              size={Math.max(7, state.studentName.length + 1)}
              className="rounded-md border-b-2 border-dashed border-line bg-transparent px-1 text-prussian placeholder:text-prussian/60 focus:border-prussian focus:outline-none"
            />
          </h1>
        </div>
        <ButtonLink to="/lab" variant="secondary">
          <FlaskConical size={16} /> Open the virtual lab
        </ButtonLink>
      </header>

      <section data-guide="dash-stats" className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Summary">
        <Stat icon={<FlaskConical size={14} />} label="Experiments completed" value={`${completed} / ${total}`} sub={`${EXPERIMENTS.length} available now, ${PLANNED.length} planned`} />
        <Stat icon={<Clock size={14} />} label="Lab time" value={time >= 3600000 ? `${(time / 3600000).toFixed(1)} h` : formatDuration(time)} sub="Time with an experiment open" />
        <Stat icon={<GraduationCap size={14} />} label="Viva score" value={vivaAvg === undefined ? '—' : `${Math.round(vivaAvg * 100)}%`} sub={vivaBests.length ? `Best attempts, ${vivaBests.length} experiment${vivaBests.length > 1 ? 's' : ''}` : 'No viva taken yet'} />
        <Stat icon={<NotebookPen size={14} />} label="Readings recorded" value={String(readings)} sub="Across all notebooks" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section data-guide="dash-areas" className="panel p-5 sm:p-6" aria-labelledby="areas-heading">
          <h2 id="areas-heading" className="mb-4 font-display text-lg font-semibold tracking-tight">
            Progress by area
          </h2>
          <ul className="space-y-4">
            {CATEGORIES.map((c) => {
              const mods = EXPERIMENTS.filter((m) => m.category === c.id)
              const frac = mods.length ? mods.reduce((s, m) => s + stageFraction(m, rec(m.id)), 0) / mods.length : 0
              return (
                <li key={c.id} className="grid grid-cols-[150px_minmax(0,1fr)_48px] items-center gap-3 sm:grid-cols-[190px_minmax(0,1fr)_48px]">
                  <span className="truncate text-sm text-ink-2">{c.label}</span>
                  {mods.length ? <Meter value={frac} /> : <span className="text-xs text-ink-3">Experiments planned</span>}
                  <span className="readout text-right text-xs text-ink-3">{mods.length ? `${Math.round(frac * 100)}%` : ''}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section data-guide="dash-continue" className="panel flex flex-col p-5 sm:p-6" aria-labelledby="continue-heading">
          <p className="eyebrow mb-3" id="continue-heading">
            {continueWith ? (state.lastExperimentId === continueWith.id ? 'Continue experiment' : 'Start next') : 'All done'}
          </p>
          {continueWith ? (
            <>
              <div className="flex items-center gap-4">
                <div className="rounded-lg border border-line bg-[var(--canvas-bg)] p-1.5">
                  <ExperimentGlyph id={continueWith.id} size={52} />
                </div>
                <div>
                  <p className="readout text-xs text-ink-3">{continueWith.number}</p>
                  <p className="font-display text-xl font-semibold tracking-tight">{continueWith.title}</p>
                </div>
              </div>
              <Meter value={stageFraction(continueWith, rec(continueWith.id))} className="mt-5" />
              <p className="mt-2 text-sm text-ink-2">Next: {nextStage?.label ?? 'Review'}</p>
              <ButtonLink
                to={`/experiments/${continueWith.id}${nextStage && nextStage.id !== 'theory' ? `/${nextStage.id}` : ''}`}
                variant="primary"
                className="mt-5 self-start"
              >
                Continue <ArrowRight size={14} />
              </ButtonLink>
            </>
          ) : (
            <p className="text-sm text-ink-2">Every available experiment is complete. Try them again with instrument error on, or explore the Virtual Lab freely.</p>
          )}
        </section>
      </div>

      <section data-guide="dash-list" aria-labelledby="exp-heading">
        <h2 id="exp-heading" className="mb-3 font-display text-lg font-semibold tracking-tight">
          Your experiments
        </h2>
        <div className="panel divide-y divide-line">
          {EXPERIMENTS.map((m) => {
            const r = rec(m.id)
            const st = stageStatus(m, r)
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5">
                <span className="readout w-6 text-sm text-ink-3">{m.number}</span>
                <ButtonLink to={`/experiments/${m.id}`} variant="ghost" className="-ml-3 min-w-[200px] justify-start">
                  {m.title}
                </ButtonLink>
                <div className="flex gap-1" aria-label="Stages completed">
                  {STAGES.map((s) => (
                    <span key={s.id} title={s.label} className={`h-2 w-6 rounded-full ${st[s.id] ? 'bg-ok' : 'bg-panel-2'}`} />
                  ))}
                </div>
                <span className="readout ml-auto text-xs text-ink-3">
                  {r.rows.length} readings · {formatDuration(r.timeSpentMs)}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
