import type { ExperimentModule } from '@/types/experiment'
import type { VivaAttempt } from '@/store/labStore'

/**
 * Adaptive viva ordering (rule-based spaced repetition):
 *   1. questions answered wrongly last time — most-missed first
 *   2. questions never asked
 *   3. questions answered correctly — the ones seen longest ago first
 */
export type QuestionStatus = 'missed' | 'new' | 'review'

export interface PlannedQuestion {
  /** Index into module.viva. */
  index: number
  status: QuestionStatus
  timesMissed: number
}

interface History {
  asked: number
  correct: number
  lastCorrect?: boolean
  lastAttempt: number
}

export function questionHistory(m: ExperimentModule, attempts: VivaAttempt[]): History[] {
  const h: History[] = m.viva.map(() => ({ asked: 0, correct: 0, lastAttempt: -1 }))
  attempts.forEach((a, ai) => {
    // Attempts before the adaptive viva asked the questions in their natural order.
    const order = a.order ?? m.viva.map((_, i) => i)
    order.forEach((qi, pos) => {
      const ans = a.answers[pos]
      if (qi < 0 || qi >= m.viva.length || ans === undefined) return
      const ok = ans === m.viva[qi].answer
      h[qi].asked++
      if (ok) h[qi].correct++
      h[qi].lastCorrect = ok
      h[qi].lastAttempt = ai
    })
  })
  return h
}

export function planViva(m: ExperimentModule, attempts: VivaAttempt[]): PlannedQuestion[] {
  const h = questionHistory(m, attempts)
  const all = m.viva.map((_, i) => ({ i, ...h[i], missed: h[i].asked - h[i].correct }))
  const missed = all.filter((x) => x.lastCorrect === false).sort((a, b) => b.missed - a.missed || a.i - b.i)
  const fresh = all.filter((x) => x.asked === 0)
  const review = all.filter((x) => x.lastCorrect === true).sort((a, b) => a.lastAttempt - b.lastAttempt || a.correct / a.asked - b.correct / b.asked || a.i - b.i)
  return [
    ...missed.map((x) => ({ index: x.i, status: 'missed' as const, timesMissed: x.missed })),
    ...fresh.map((x) => ({ index: x.i, status: 'new' as const, timesMissed: 0 })),
    ...review.map((x) => ({ index: x.i, status: 'review' as const, timesMissed: x.missed })),
  ]
}
