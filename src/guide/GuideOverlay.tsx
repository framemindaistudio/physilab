import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { findTarget, stepBody, WELCOME_ID, type GuideStep, type Tour } from './tours'
import { cn } from '@/utils/cn'

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 6 // spotlight padding around the target
const GAP = 12 // space between spotlight and card
const MARGIN = 12 // minimum distance from the viewport edge

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function sameRect(a: Rect | null, b: Rect | null) {
  if (!a || !b) return a === b
  return Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5
}

/** Scroll so the target is comfortably in view; tall targets are aligned to the top, below any sticky header. */
function scrollToTarget(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  const vh = window.innerHeight
  const header = window.innerWidth < 1024 ? 64 : 16
  const fits = r.height < vh - header - 200
  const inView = r.top >= header && r.bottom <= vh - 16
  if (fits && inView) return
  const top = window.scrollY + r.top - (fits ? Math.max(header, (vh - r.height) / 2 - 80) : header + 8)
  window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion() ? 'auto' : 'smooth' })
}

export function GuideOverlay({
  tour,
  onDone,
  onSkip,
  onSkipAll,
}: {
  tour: Tour
  /** Finished the last step. `real` is false when only a placeholder was shown. */
  onDone: (real: boolean) => void
  /** Skipped this guide. */
  onSkip: (real: boolean) => void
  /** Turned off all first-time guides. */
  onSkipAll: () => void
}) {
  // Resolve the steps that exist in the current layout once, when the guide opens.
  const { steps, real } = useMemo<{ steps: GuideStep[]; real: boolean }>(() => {
    const available = tour.steps.filter((s) => !s.target || findTarget(s.target))
    if (available.length) return { steps: available, real: true }
    return {
      steps: [tour.fallback ?? { title: tour.label, body: 'This guide has nothing to point at on this screen yet.' }],
      real: false,
    }
  }, [tour])

  const [index, setIndex] = useState(0)
  const step = steps[Math.min(index, steps.length - 1)]
  const body = stepBody(step)
  const last = index >= steps.length - 1
  const isWelcome = tour.id === WELCOME_ID

  const [rect, setRect] = useState<Rect | null>(null)
  const [cardH, setCardH] = useState(220)
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight })
  const cardRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const titleId = `guide-title-${tour.id}`
  const bodyId = `guide-body-${tour.id}`

  // Remember what had focus before the guide opened (layout effects run before the focus effect below)
  // and hand focus back when it closes.
  useLayoutEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    return () => {
      if (previous && previous !== document.body && previous.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])

  // Bring the target into view when the step changes.
  useEffect(() => {
    if (!step.target) return
    const el = findTarget(step.target)
    if (el) scrollToTarget(el)
  }, [step])

  // Track the target's position every frame (layout shifts, scrolling, resizing, animations).
  useEffect(() => {
    let raf = 0
    let prev: Rect | null | undefined // undefined = nothing committed yet for this step
    const tick = () => {
      const el = step.target ? findTarget(step.target) : null
      let next: Rect | null = null
      if (el) {
        const r = el.getBoundingClientRect()
        next = { top: r.top, left: r.left, width: r.width, height: r.height }
      }
      if (prev === undefined || !sameRect(prev, next)) {
        prev = next
        setRect(next)
      }
      setViewport((v) => (v.w === window.innerWidth && v.h === window.innerHeight ? v : { w: window.innerWidth, h: window.innerHeight }))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step])

  // Measure the card so it can be placed without overflowing.
  useLayoutEffect(() => {
    const el = cardRef.current
    if (!el) return
    const h = el.offsetHeight
    setCardH((c) => (c === h ? c : h))
  })

  // Focus the main action on every step.
  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true })
  }, [index])

  const next = useCallback(() => {
    if (last) onDone(real)
    else setIndex((i) => i + 1)
  }, [last, onDone, real])
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const skip = useCallback(() => onSkip(real), [onSkip, real])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        skip()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        back()
      } else if (e.key === 'Tab' && cardRef.current) {
        // Keep keyboard focus inside the guide card.
        const focusables = [...cardRef.current.querySelectorAll<HTMLElement>('button:not([disabled])')]
        if (!focusables.length) return
        const first = focusables[0]
        const lastEl = focusables[focusables.length - 1]
        const active = document.activeElement
        if (!cardRef.current.contains(active)) {
          e.preventDefault()
          first.focus()
        } else if (e.shiftKey && active === first) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && active === lastEl) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [next, back, skip])

  // ---- Placement: below, above, left, right of the target; otherwise pinned to the bottom. ----
  const vw = viewport.w
  const vh = viewport.h
  const W = Math.min(380, vw - 2 * MARGIN)
  const maxH = Math.max(120, vh - 2 * MARGIN)
  const H = Math.min(cardH, maxH)
  let top: number
  let left: number
  const spot = rect && {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + 2 * PAD,
    height: rect.height + 2 * PAD,
  }
  if (!spot) {
    top = (vh - H) / 2
    left = (vw - W) / 2
  } else {
    const below = vh - (spot.top + spot.height)
    const above = spot.top
    const leftSpace = spot.left
    const rightSpace = vw - (spot.left + spot.width)
    const centerX = Math.min(Math.max(spot.left + spot.width / 2 - W / 2, MARGIN), vw - W - MARGIN)
    const centerY = Math.min(Math.max(spot.top + spot.height / 2 - H / 2, MARGIN), vh - H - MARGIN)
    if (below >= H + GAP + MARGIN) {
      top = spot.top + spot.height + GAP
      left = centerX
    } else if (above >= H + GAP + MARGIN) {
      top = spot.top - GAP - H
      left = centerX
    } else if (leftSpace >= W + GAP + MARGIN) {
      top = centerY
      left = spot.left - GAP - W
    } else if (rightSpace >= W + GAP + MARGIN) {
      top = centerY
      left = spot.left + spot.width + GAP
    } else {
      top = vh - H - MARGIN
      left = (vw - W) / 2
    }
  }
  // Keep the whole card, including its buttons, on screen.
  top = Math.max(MARGIN, Math.min(top, vh - H - MARGIN))
  left = Math.max(MARGIN, Math.min(left, vw - W - MARGIN))

  const animate = !reducedMotion()

  return (
    <div className="no-print fixed inset-0 z-[60]" data-guide-overlay>
      {/* Click shield: the page is paused while the guide is open. */}
      <div className="absolute inset-0" aria-hidden onClick={(e) => e.stopPropagation()} />
      {spot ? (
        <div
          aria-hidden
          className={cn('pointer-events-none absolute rounded-xl ring-2 ring-sodium', animate && 'transition-all duration-200 ease-out')}
          style={{ ...spot, boxShadow: '0 0 0 9999px rgb(8 14 20 / 0.58)' }}
        />
      ) : (
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[rgb(8_14_20/0.58)]" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className={cn('panel absolute flex flex-col p-5 shadow-2xl', animate && 'transition-[top,left] duration-200 ease-out')}
        style={{ top, left, width: W, maxHeight: maxH }}
      >
        <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
          <p className="eyebrow">
            {tour.label} guide{steps.length > 1 && ` · ${index + 1} of ${steps.length}`}
          </p>
          <button
            type="button"
            onClick={skip}
            className="-mr-1.5 grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-panel-2 hover:text-ink"
            aria-label="Close guide"
          >
            <X size={16} />
          </button>
        </div>

        {/* Text scrolls on very short screens so the buttons always stay visible. */}
        <div className="min-h-0 overflow-y-auto">
          <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight text-ink">
            {step.title}
          </h2>
          <p id={bodyId} className="mt-1.5 text-sm leading-relaxed text-ink-2">
            {body}
          </p>
        </div>

        {/* Focus stays on the Next button between steps, so announce each new step. */}
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {index > 0 ? `Step ${index + 1} of ${steps.length}. ${step.title}. ${body}` : ''}
        </p>

        {steps.length > 1 && (
          <div className="mt-4 flex shrink-0 gap-1" aria-hidden>
            {steps.map((s, i) => (
              <span key={s.title + i} className={cn('h-1 flex-1 rounded-full', i <= index ? 'bg-prussian' : 'bg-panel-2')} />
            ))}
          </div>
        )}

        <div className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
          {isWelcome && index === 0 ? (
            <button type="button" onClick={onSkipAll} className="text-sm text-ink-3 underline-offset-2 hover:text-ink hover:underline">
              Skip all guides
            </button>
          ) : (
            <button type="button" onClick={skip} className="text-sm text-ink-3 underline-offset-2 hover:text-ink hover:underline">
              Skip guide
            </button>
          )}
          <div className="flex gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={back}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-panel px-3 text-sm text-ink hover:border-ink-3"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
            <button
              ref={primaryRef}
              type="button"
              onClick={next}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-prussian px-4 text-sm font-medium text-[var(--paper)] hover:bg-prussian-strong"
            >
              {isWelcome && index === 0 ? 'Show me around' : last ? 'Got it' : 'Next'}
              {!last && <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
