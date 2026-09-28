import { useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import type { ExperimentModule } from '@/types/experiment'
import { lab, useExperimentRecord } from '@/store/labStore'
import { Button } from '@/components/ui/Button'
import { Meter } from '@/components/ui/misc'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

export function VivaQuiz({ module: m }: { module: ExperimentModule }) {
  const record = useExperimentRecord(m.id)
  const qs = m.viva
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<number[]>([])
  const [finished, setFinished] = useState(false)

  const restart = () => {
    setIndex(0)
    setSelected(null)
    setSubmitted(false)
    setAnswers([])
    setFinished(false)
  }

  if (finished) {
    const score = answers.filter((a, i) => a === qs[i].answer).length
    return (
      <div className="space-y-6">
        <section className="panel p-6 text-center">
          <p className="eyebrow">Viva complete</p>
          <p className="readout mt-2 text-5xl font-semibold text-ink">
            {score}
            <span className="text-2xl text-ink-3"> / {qs.length}</span>
          </p>
          <p className="mt-2 text-ink-2">{score === qs.length ? 'Full marks.' : score >= qs.length * 0.7 ? 'Well prepared — review the ones you missed below.' : 'Revisit the theory, then try again.'}</p>
          <Button className="mt-4" onClick={restart}>
            <RotateCcw size={14} /> Try again
          </Button>
        </section>
        <section className="panel divide-y divide-line">
          {qs.map((q, i) => {
            const ok = answers[i] === q.answer
            return (
              <div key={q.q} className="flex gap-3 p-4">
                <span className={cn('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full', ok ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad')}>
                  {ok ? <Check size={14} /> : <X size={14} />}
                </span>
                <div className="text-sm">
                  <p className="font-medium text-ink">{q.q}</p>
                  <p className="mt-1 text-ink-2">
                    Answer: <span className="text-ink">{q.options[q.answer]}</span>
                    {!ok && <span className="text-bad"> · you chose “{q.options[answers[i]]}”</span>}
                  </p>
                  <p className="mt-1 text-ink-3">{q.explanation}</p>
                </div>
              </div>
            )
          })}
        </section>
      </div>
    )
  }

  const q = qs[index]
  const correct = submitted && selected === q.answer

  const submit = () => {
    if (selected === null) return
    setSubmitted(true)
  }
  const next = () => {
    const nextAnswers = [...answers, selected ?? -1]
    setAnswers(nextAnswers)
    if (index + 1 >= qs.length) {
      const score = nextAnswers.filter((a, i) => a === qs[i].answer).length
      lab.addVivaAttempt(m.id, { score, total: qs.length, answers: nextAnswers, completedAt: new Date().toISOString() })
      setFinished(true)
    } else {
      setIndex(index + 1)
      setSelected(null)
      setSubmitted(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="panel p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="eyebrow">
            Question {index + 1} of {qs.length}
          </p>
          <Meter value={index / qs.length} className="max-w-[160px]" />
        </div>
        <h2 className="font-display text-xl font-semibold leading-snug tracking-tight text-ink sm:text-2xl">{q.q}</h2>
        <fieldset className="mt-6 space-y-2.5" disabled={submitted}>
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
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {!submitted ? (
            <Button variant="primary" onClick={submit} disabled={selected === null}>
              Submit answer
            </Button>
          ) : (
            <Button variant="primary" onClick={next}>
              {index + 1 >= qs.length ? 'See score' : 'Next question'}
            </Button>
          )}
        </div>
      </section>

      <aside className="panel h-fit p-5">
        <p className="eyebrow mb-3">Previous attempts</p>
        {record.vivaAttempts.length === 0 ? (
          <p className="text-sm text-ink-3">None yet. Your score is saved when you finish.</p>
        ) : (
          <ul className="space-y-2">
            {[...record.vivaAttempts].reverse().slice(0, 6).map((a) => (
              <li key={a.completedAt} className="flex items-center justify-between text-sm">
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
