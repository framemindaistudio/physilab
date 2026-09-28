import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { guides, useGuideState } from './guideStore'
import { findTarget, sectionForPath, TOURS, WELCOME_ID, type Tour } from './tours'
import { GuideOverlay } from './GuideOverlay'

interface GuideContextValue {
  /** Guide for the page currently open, if any. */
  section: string | null
  /** Replay the guide for the current page. */
  replay: () => void
  /** A guide is on screen. */
  open: boolean
}

const GuideContext = createContext<GuideContextValue>({ section: null, replay: () => {}, open: false })

export const useGuide = () => useContext(GuideContext)

const WAIT_MS = 4000 // give lazy pages and apparatus time to mount
const SETTLE_MS = 350 // let layout settle before measuring targets

/** Resolve when the tour has something to show; null if it never becomes ready. */
function whenReady(tour: Tour, signal: { cancelled: boolean }): Promise<boolean> {
  const needed = tour.readyTarget ?? tour.steps.find((s) => s.target)?.target
  const start = performance.now()
  return new Promise((resolve) => {
    const poll = () => {
      if (signal.cancelled) return resolve(false)
      const firstIsCentred = !tour.readyTarget && !tour.steps[0]?.target
      if (firstIsCentred || (needed && findTarget(needed))) {
        window.setTimeout(() => resolve(!signal.cancelled), SETTLE_MS)
        return
      }
      if (performance.now() - start > WAIT_MS) return resolve(false)
      requestAnimationFrame(poll)
    }
    poll()
  })
}

/**
 * Shows each section's first-time guide automatically (after the one-off welcome guide),
 * and lets the student replay a guide from the shell.
 */
export function GuideProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const section = sectionForPath(pathname)
  const state = useGuideState()
  const [active, setActive] = useState<{ tour: Tour; section: string | null } | null>(null)

  // Leaving the page closes its guide without marking it as seen.
  useEffect(() => {
    setActive((a) => (a && a.section !== section ? null : a))
  }, [section])

  // Auto-start: the welcome guide first, then this section's guide, each only once.
  useEffect(() => {
    if (active || state.off || !section) return
    const id = !state.seen[WELCOME_ID] ? WELCOME_ID : !state.seen[section] ? section : null
    const tour = id ? TOURS[id] : undefined
    if (!tour) return
    const signal = { cancelled: false }
    // If the tab is in the background, wait until the student actually looks at it.
    let onVisible: (() => void) | undefined
    const whenVisible = () =>
      new Promise<void>((resolve) => {
        if (document.visibilityState === 'visible') return resolve()
        onVisible = () => {
          if (document.visibilityState === 'visible') resolve()
        }
        document.addEventListener('visibilitychange', onVisible)
      })
    whenVisible()
      .then(() => whenReady(tour, signal))
      .then((ok) => {
        if (ok && !signal.cancelled) setActive({ tour, section })
      })
    return () => {
      signal.cancelled = true
      if (onVisible) document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active, state.off, state.seen, section])

  const activeRef = useRef(active)
  activeRef.current = active

  // Finishing or skipping marks the guide as seen — unless it only showed a placeholder
  // (e.g. replayed before there was anything to point at). "Skip all" switches guides off.
  const close = useCallback((mode: 'done' | 'skip' | 'skipAll', real = true) => {
    const a = activeRef.current
    if (a && real) guides.markSeen(a.tour.id)
    if (mode === 'skipAll') guides.setOff(true)
    setActive(null)
  }, [])

  const replay = useCallback(() => {
    const tour = section ? TOURS[section] : undefined
    if (tour) setActive({ tour, section })
  }, [section])

  const open = active !== null
  const value = useMemo(() => ({ section, replay, open }), [section, replay, open])

  return (
    <GuideContext.Provider value={value}>
      {children}
      {active && (
        <GuideOverlay
          key={active.tour.id + (active.section ?? '')}
          tour={active.tour}
          onDone={(real) => close('done', real)}
          onSkip={(real) => close('skip', real)}
          onSkipAll={() => close('skipAll')}
        />
      )}
    </GuideContext.Provider>
  )
}
