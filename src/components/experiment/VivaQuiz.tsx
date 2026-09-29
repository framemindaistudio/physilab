import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Check, RotateCcw, X } from 'lucide-react'
import type { ExperimentModule } from '@/types/experiment'
import { lab, useExperimentRecord } from '@/store/labStore'
import { planViva, type PlannedQuestion } from '@/assistant/adaptiveViva'
import { revisionFor } from '@/assistant/knowledge'
import { Button } from '@/components/ui/Button'
import { Meter, Tag } from '@/components/ui/misc'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

const STATUS_TAG = {
  missed: { label: 'Missed last time', tone: 'bad' },
  new: { label: 'New', tone: 'prussian' },
  review: { label: 'Review', tone: 'neutral' },
} as const

function RevisionLink({ m, heading, anchor }: { m: ExperimentModule; heading: string; anchor: string }) {
  return (
    <Link to={`/experiments/${m.id}#${anchor}`} className="inline-flex items-center gap-1.5 font-medium text-prussian hover:underline">
      <BookOpen size={14} /> Revise: {heading}
    </Link>
  )
}

/** Adaptive viva: questions missed last time come first; wrong answers point to the theory to revise. */
export function VivaQuiz({ module: m }: { module: ExperimentModule }) {
  const record = useExperimentRecord(m.id)
  const qs = m.viva
  const hasHistory = record.vivaAttempts.length > 0
  const [plan, setPlan] = useState<PlannedQuestion[]>(() => planViva(m, record.vivaAttempts))
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<number[]>([])
  const [finished, setFinished] = useState(false)

  // The theory section that best matches each question (keyword ranking over the experiment's theory).
  const revision = useMemo(() => qs.map((q) => revisionFor(m, q)), [m, qs])
  const missedFirst = plan.filter((p) => p.status === 'missed').length

  const restart = () => {
    setPlan(planViva(m, lab.record(m.id).vivaAttempts))
    setIndex(0)
    setSelected(null)
    setSubmitted(false)
    setAnswers([])
    setFinished(false)
  }

  if (finished) {
    const results = plan.map((p, i) => ({ p, q: qs[p.index], chosen: answers[i], ok: answers[i] === qs[p.index].answer }))
    const score = results.filter((r) => r.ok).length
    const topics = new Map<string, { heading: string; anchor: string }>()
    results.filter((r) => !r.ok).forEach((r) => {
      const t = revision[r.p.index]
      if (t) topics.set(t.anchor, t)
    })
    return (
      <div className="space-y-6">
        <section className="panel p-6 text-center">
          <p className="eyebrow">Viva complete</p>
          <p className="readout mt-2 text-5xl font-semibold text-ink">
            {score}
            <span className="text-2xl text-ink-3"> / {qs.length}</span>
          </p>
          <p className="mt-2 text-ink-2">
            {score === qs.length ? 'Full marks.' : score >= qs.length * 0.7 ? 'Well prepared — review the ones you missed below.' : 'Revisit the theory, then try again.'}
          </p>
          <Button className="mt-4" onClick={restart}>
            <RotateCcw size={14} /> Try again
          </Button>
          {score < qs.length && <p className="mt-2 text-xs text-ink-3">Next time, the questions you missed will come first.</p>}
        </section>

        {topics.size > 0 && (
          <section className="panel p-5">
            <p className="eyebrow mb-2">Topics to revise</p>
            <ul className="space-y-1.5 text-sm">
              {[...topics.values()].map((t) => (
                <li key={t.anchor}>
                  <RevisionLink m={m} heading={t.heading} anchor={t.anchor} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="panel divide-y divide-line">
          {results.map(({ p, q, chosen, ok }) => (
            <div key={q.q} className="flex gap-3 p-4">
              <span className={cn('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full', ok ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad')}>
                {ok ? <Check size={14} /> : <X size={14} />}
              </span>
              <div className="text-sm">
                <p className="font-medium text-ink">{q.q}</p>
                <p className="mt-1 text-ink-2">
                  Answer: <span className="text-ink">{q.options[q.answer]}</span>
                  {!ok && chosen !== undefined && <span className="text-bad"> · you chose “{q.options[chosen]}”</span>}
                </p>
                <p className="mt-1 text-ink-3">{q.explanation}</p>
                {!ok && revision[p.index] && (
                  <p className="mt-1.5">
                    <RevisionLink m={m} heading={revision[p.index]!.heading} anchor={revision[p.index]!.anchor} />
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    )
  }

  const planned = plan[index]
  const q = qs[planned.index]
  const correct = submitted && selected === q.answer
  const last = index + 1 >= plan.length

  const submit = () => {
    if (selected === null) return
    setSubmitted(true)
  }
  const next = () => {
    const nextAnswers = [...answers, selected ?? -1]
    setAnswers(nextAnswers)
    if (last) {
      const score = nextAnswers.filter((a, i) => a === qs[plan[i].index].answer).length
      lab.addVivaAttempt(m.id, {
        score,
        total: qs.length,
        answers: nextAnswers,
        order: plan.map((p) => p.index),
        completedAt: new Date().toISOString(),
      })
      setFinished(true)
    } else {
      setIndex(index + 1)
      setSelected(null)
      setSubmitted(false)
    }
  }

  const tag = STATUS_TAG[planned.status]
  const rev = revision[planned.index]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="panel p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="eyebrow">
            Question {index + 1} of {plan.length}
          </p>
          <Meter value={index / plan.length} className="max-w-[160px]" />
        </div>
        {hasHistory && (
          <p className="mb-2">
            <Tag tone={tag.tone}>{tag.label}</Tag>
          </p>
        )}
        <h2 data-guide="viva-question" className="font-display text-xl font-semibold leading-snug tracking-tight text-ink sm:text-2xl">
          {q.q}
        </h2>
        <fieldset data-guide="viva-options" className="mt-6 space-y-2.5" disabled={submitted}>
          <legend className="sr-only">Choose one answer</legend>
          {q.options.map((opt, i) => {
            const isSel = selected === i
            const showRight = submitted && i === q.answer
            const showWrong = submitted && isSel && i !== q.answer
            return (
              <label
                key={opt}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
                  showRight ? 'border-ok bg-ok-soft' : showWrong ? 'border-bad bg-bad-soft' : isSel ? 'border-prussian bg-prussian-soft' : 'border-line hover:border-ink-3',
                  submitted && 'cursor-default',
                )}
              >
                <input type="radio" name={`viva-${m.id}-${index}`} className="sr-only" checked={isSel} onChange={() => setSelected(i)} />
                <span
                  className={cn(
                    'readout grid h-7 w-7 shrink-0 place-items-center rounded-md border text-xs font-semibold',
                    isSel || showRight ? 'border-transparent bg-panel text-ink' : 'border-line text-ink-2',
                  )}
                >
                  {LETTERS[i]}
                </span>
                <span className="text-ink">{opt}</span>
                {showRight && <Check size={16} className="ml-auto text-ok" />}
                {showWrong && <X size={16} className="ml-auto text-bad" />}
              </label>
            )
          })}
        </fieldset>

        {submitted && (
          <div role="status" className={cn('mt-5 rounded-lg px-4 py-3 text-sm', correct ? 'bg-ok-soft' : 'bg-bad-soft')}>
            <p className={cn('font-semibold', correct ? 'text-ok' : 'text-bad')}>{correct ? 'Correct' : 'Incorrect'}</p>
            <p className="mt-1 text-ink">{q.explanation}</p>
            {!correct && rev && (
              // Plain text mid-quiz so the unfinished attempt isn't lost; links appear on the results screen.
              <p className="mt-2 inline-flex items-center gap-1.5 text-ink-2">
                <BookOpen size={14} /> Revise later: <span className="font-medium text-ink">{rev.heading}</span>
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {!submitted ? (
            <Button variant="primary" onClick={submit} disabled={selected === null}>
              Submit answer
            </Button>
          ) : (
            <Button variant="primary" onClick={next}>
              {last ? 'See score' : 'Next question'}
            </Button>
          )}
        </div>
      </section>

      <aside data-guide="viva-attempts" className="panel h-fit p-5">
        <p className="eyebrow mb-3">Adaptive viva</p>
        <p className="mb-4 text-sm text-ink-2">
          {!hasHistory
            ? 'After your first attempt, questions you get wrong will come first next time.'
            : missedFirst > 0
              ? `This round starts with the ${missedFirst} question${missedFirst === 1 ? '' : 's'} you missed last time.`
              : 'You answered everything correctly last time — this round reviews them all.'}
        </p>
        <p className="eyebrow mb-2">Previous attempts</p>
        {record.vivaAttempts.length === 0 ? (
          <p className="text-sm text-ink-3">None yet. Your score is saved when you finish.</p>
        ) : (
          <ul className="space-y-2">
            {[...record.vivaAttempts].reverse().slice(0, 6).map((a, i) => (
              <li key={a.completedAt + i} className="flex items-center justify-between text-sm">
                <span className="text-ink-2">{formatDate(a.completedAt)}</span>
                <span className="readout text-ink">
                  {a.score}/{a.total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}
