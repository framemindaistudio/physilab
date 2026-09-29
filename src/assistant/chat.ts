import { getExperiment } from '@/experiments/registry'
import { calculate, type CalcResult } from './calculators'
import { docById, EXPERIMENT_ALIASES, INDEX, type KnowledgeDoc } from './knowledge'
import { tokenize } from './search'

/**
 * Ask PHYSILAB: rule-based question answering.
 *   1. greetings / thanks        → canned replies
 *   2. a calculator pattern      → worked calculation
 *   3. otherwise                 → best-matching passage from PHYSILAB's notes (BM25),
 *                                  boosted towards the experiment the student is looking at.
 */
export type ChatReply =
  | { kind: 'doc'; doc: KnowledgeDoc; related: { id: string; title: string }[] }
  | { kind: 'calc'; calc: CalcResult }
  | { kind: 'text'; text: string; suggestions?: string[] }

export interface ChatContext {
  experimentId?: string
  /** On the viva stage the helper will not reveal viva answers. */
  inViva?: boolean
}

const MIN_SCORE = 2.2

export function suggestionsFor(ctx: ChatContext): string[] {
  const m = getExperiment(ctx.experimentId)
  if (m) {
    const calc: Record<string, string> = {
      pendulum: 'Period of a 1.5 m pendulum?',
      projectile: 'Range at 20 m/s and 30°?',
      'ohms-law': 'Current through 47 Ω at 5 V?',
      faraday: 'What is Lenz’s law?',
      'double-slit': 'Fringe width for 600 nm, D = 1 m, d = 0.5 mm',
      photoelectric: 'Energy of a 400 nm photon on sodium?',
    }
    const topics = m.theory.slice(0, 2).map((s) => `Explain “${s.heading}”`)
    return [...topics, calc[m.id] ?? 'How do I take a reading?', `Precautions for ${m.title}`]
  }
  return ['How do I take a reading?', 'Why do we plot T² against L?', 'Energy of a 400 nm photon?', 'What does the Lab Assistant do?']
}

export function answer(question: string, ctx: ChatContext): ChatReply {
  const q = question.trim()
  const t = q.toLowerCase()
  if (!q) return { kind: 'text', text: 'Type a question about an experiment, a formula or how to use PHYSILAB.' }

  if (/^(hi|hello|hey|hii+|good (morning|afternoon|evening)|namaste)\b/.test(t) && tokenize(q).length <= 3) {
    return {
      kind: 'text',
      text: 'Hello! Ask me about any experiment’s theory, a formula, the procedure, or how to use PHYSILAB. I can also work out quick values — try one of these:',
      suggestions: suggestionsFor(ctx),
    }
  }
  if (/^(thanks|thank you|thx|ty|ok|okay|cool|great)\b/.test(t) && tokenize(q).length <= 3) {
    return { kind: 'text', text: 'You’re welcome. Good luck with the experiment!' }
  }

  const calc = calculate(q)
  if (calc && ctx.inViva) {
    return { kind: 'text', text: 'The calculator is paused while you take the viva, so it can’t work out answers for you. Finish the viva first.' }
  }
  if (calc) return { kind: 'calc', calc }

  // Steer towards an experiment named in the question, otherwise the one on screen.
  const tokens = tokenize(q)
  const named = Object.entries(EXPERIMENT_ALIASES).find(([, words]) => words.some((w) => tokenize(w).some((a) => tokens.includes(a))))?.[0]
  const focus = named ?? ctx.experimentId
  // "What is …" / "define …" questions want a definition first.
  const definition = /^(what\s+is|what's|whats|define|definition of|meaning of)\b/.test(t)
  const hits = INDEX.search(q, {
    filter: (d) => !(ctx.inViva && d.kind === 'viva'),
    boost: (d) =>
      (d.experimentId && d.experimentId === focus ? (named ? 1.8 : 1.3) : 1) *
      (definition ? (d.kind === 'glossary' ? 1.6 : d.kind === 'theory' ? 1.15 : 1) : 1),
  })
  const best = hits[0]
  if (!best || best.score < MIN_SCORE) {
    return {
      kind: 'text',
      text: 'I couldn’t find that in PHYSILAB’s notes. I only know the experiments, their theory and how to use the app. Try asking in a different way, or pick one of these:',
      suggestions: suggestionsFor(ctx),
    }
  }
  const related = hits
    .slice(1)
    .filter((h) => h.score > best.score * 0.45 && h.doc.id !== best.doc.id)
    .slice(0, 3)
    .map((h) => ({ id: h.doc.id, title: h.doc.title }))
  return { kind: 'doc', doc: best.doc, related }
}

export function answerDoc(id: string, ctx: ChatContext): ChatReply | null {
  const doc = docById(id)
  if (!doc) return null
  if (ctx.inViva && doc.kind === 'viva') {
    return { kind: 'text', text: 'I won’t show viva answers while you are taking the viva. Finish it first — the results screen explains every answer.' }
  }
  return { kind: 'doc', doc, related: [] }
}
