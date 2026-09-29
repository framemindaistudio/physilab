import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, MessageCircleQuestion, Send, X } from 'lucide-react'
import { answer, answerDoc, suggestionsFor, type ChatContext, type ChatReply } from '@/assistant/chat'
import { getExperiment } from '@/experiments/registry'
import { useGuide } from '@/guide/GuideProvider'
import { Formula } from '@/components/ui/Formula'
import { cn } from '@/utils/cn'

type Message = { id: number; role: 'user'; text: string } | { id: number; role: 'bot'; reply: ChatReply }

function contextFor(pathname: string): ChatContext {
  const seg = pathname.split('/').filter(Boolean)
  if ((seg[0] === 'experiments' || seg[0] === 'lab') && seg[1] && getExperiment(seg[1])) {
    return { experimentId: seg[1], inViva: seg[0] === 'experiments' && seg[2] === 'viva' }
  }
  return {}
}

let nextId = 1

/** Floating "Ask PHYSILAB" helper: rule-based answers from PHYSILAB's own notes. */
export function AskPhysilab() {
  const { pathname } = useLocation()
  const ctx = useMemo(() => contextFor(pathname), [pathname])
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { isOpen: guideOpen } = useGuide()
  // A page guide spotlights the page, so the chat must not cover it.
  useEffect(() => {
    if (guideOpen) setOpen(false)
  }, [guideOpen])

  // Focus the input on open; hand focus back to the button on close.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (open) inputRef.current?.focus()
    else if (wasOpen.current) buttonRef.current?.focus()
    wasOpen.current = open
  }, [open])
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  const push = (...m: Message[]) => setMessages((prev) => [...prev, ...m].slice(-40))
  const ask = (text: string) => {
    const q = text.trim()
    if (!q) return
    push({ id: nextId++, role: 'user', text: q }, { id: nextId++, role: 'bot', reply: answer(q, ctx) })
    setInput('')
  }
  const showDoc = (id: string, title: string) => {
    const reply = answerDoc(id, ctx)
    if (reply) push({ id: nextId++, role: 'user', text: title }, { id: nextId++, role: 'bot', reply })
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(input)
  }
  const close = () => setOpen(false)

  const expName = getExperiment(ctx.experimentId)?.title

  return (
    <>
      {!open && !guideOpen && (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(true)}
          className="no-print fixed bottom-4 right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-prussian px-4 text-sm font-medium text-[var(--paper)] shadow-lg hover:bg-prussian-strong"
          aria-label="Ask PHYSILAB a question"
        >
          <MessageCircleQuestion size={20} />
          <span className="hidden sm:inline">Ask PHYSILAB</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="ask-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              close()
            }
          }}
          className="no-print panel fixed inset-x-3 bottom-3 z-50 flex h-[min(600px,calc(100dvh-5.5rem))] flex-col overflow-hidden shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[400px]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <h2 id="ask-title" className="flex items-center gap-2 font-display text-base font-semibold tracking-tight">
                <MessageCircleQuestion size={18} className="text-prussian" aria-hidden />
                Ask PHYSILAB
              </h2>
              <p className="text-xs text-ink-3">
                Rule-based helper · answers from PHYSILAB’s own notes{expName ? ` · focused on ${expName}` : ''}
              </p>
            </div>
            <button type="button" onClick={close} className="grid h-8 w-8 place-items-center rounded-md text-ink-3 hover:bg-panel-2 hover:text-ink" aria-label="Close Ask PHYSILAB">
              <X size={18} />
            </button>
          </header>

          <div ref={logRef} role="log" aria-live="polite" aria-label="Conversation" className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <BotBubble>
                <p className="text-sm text-ink">
                  Hi! Ask me about an experiment’s theory, a formula, the procedure or how to use PHYSILAB. I can also work out quick values.
                  {ctx.inViva && ' (While you are taking the viva I won’t give away viva answers.)'}
                </p>
                <Chips items={suggestionsFor(ctx)} onPick={ask} />
              </BotBubble>
            )}
            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-prussian px-3.5 py-2 text-sm text-[var(--paper)]">{m.text}</p>
                </div>
              ) : (
                <BotReply key={m.id} reply={m.reply} onAsk={ask} onDoc={showDoc} />
              ),
            )}
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-line p-3">
            <label htmlFor="ask-input" className="sr-only">
              Your question
            </label>
            <input
              id="ask-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Why is the amplitude kept small?"
              autoComplete="off"
              className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-panel px-3 text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-prussian text-[var(--paper)] hover:bg-prussian-strong disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}

function BotBubble({ children }: { children: ReactNode }) {
  return <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-line bg-[var(--canvas-bg)] px-3.5 py-3">{children}</div>
}

function Chips({ items, onPick }: { items: string[]; onPick: (q: string) => void }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {items.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="rounded-full border border-line bg-panel px-2.5 py-1 text-left text-xs text-ink-2 hover:border-prussian hover:text-prussian"
        >
          {s}
        </button>
      ))}
    </div>
  )
}

function BotReply({
  reply,
  onAsk,
  onDoc,
}: {
  reply: ChatReply
  onAsk: (q: string) => void
  onDoc: (id: string, title: string) => void
}) {
  if (reply.kind === 'text') {
    return (
      <BotBubble>
        <p className="text-sm text-ink">{reply.text}</p>
        {reply.suggestions && <Chips items={reply.suggestions} onPick={onAsk} />}
      </BotBubble>
    )
  }
  if (reply.kind === 'calc') {
    const c = reply.calc
    return (
      <BotBubble>
        <p className="font-display text-sm font-semibold text-ink">{c.title}</p>
        <div className="mt-1.5 space-y-1 overflow-x-auto text-ink">
          {c.steps.map((s) => (
            <Formula key={s} tex={s} block className="text-[0.95em]" />
          ))}
        </div>
        {c.note && <p className="mt-1.5 text-xs text-ink-2">{c.note}</p>}
        {c.to && (
          <Link to={c.to} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-prussian hover:underline">
            Try it on the bench <ArrowRight size={12} />
          </Link>
        )}
      </BotBubble>
    )
  }
  const { doc, related } = reply
  const shown = doc.paragraphs.slice(0, 2)
  return (
    <BotBubble>
      <p className="font-display text-sm font-semibold text-ink">{doc.title}</p>
      <div className="mt-1 space-y-1.5 text-sm leading-relaxed text-ink-2">
        {shown.map((p) => (
          <p key={p.slice(0, 50)}>{p}</p>
        ))}
      </div>
      {doc.formulas.length > 0 && (
        <div className="mt-2 space-y-1 overflow-x-auto text-ink">
          {doc.formulas.slice(0, 3).map((f) => (
            <Formula key={f} tex={f} block className="text-[0.95em]" />
          ))}
        </div>
      )}
      <Link to={doc.source.to} className={cn('mt-2 inline-flex items-center gap-1 text-xs font-medium text-prussian hover:underline')}>
        {doc.paragraphs.length > shown.length ? 'Read more in ' : 'From '}
        {doc.source.label} <ArrowRight size={12} />
      </Link>
      {related.length > 0 && (
        <div className="mt-2.5 border-t border-line pt-2">
          <p className="text-[11px] uppercase tracking-wide text-ink-3">Related</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {related.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onDoc(r.id, r.title)}
                className="rounded-full border border-line bg-panel px-2.5 py-1 text-left text-xs text-ink-2 hover:border-prussian hover:text-prussian"
              >
                {r.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </BotBubble>
  )
}
