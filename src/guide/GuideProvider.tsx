import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { sectionForPath, TOURS, type Tour } from './tours'
import { GuideOverlay } from './GuideOverlay'

interface GuideContextValue {
  /** Guide for the page currently open, if any. */
  section: string | null
  /** Open the guide for the current page. */
  open: () => void
  /** A guide is on screen. */
  isOpen: boolean
}

const GuideContext = createContext<GuideContextValue>({ section: null, open: () => {}, isOpen: false })

export const useGuide = () => useContext(GuideContext)

/**
 * Page guides are shown only when the student asks for one (the Page guide button);
 * nothing opens on its own.
 */
export function GuideProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const section = sectionForPath(pathname)
  const [active, setActive] = useState<{ tour: Tour; section: string | null } | null>(null)

  // Leaving the page closes its guide.
  useEffect(() => {
    setActive((a) => (a && a.section !== section ? null : a))
  }, [section])

  const open = useCallback(() => {
    const tour = section ? TOURS[section] : undefined
    if (tour) setActive({ tour, section })
  }, [section])
  const close = useCallback(() => setActive(null), [])

  const isOpen = active !== null
  const value = useMemo(() => ({ section, open, isOpen }), [section, open, isOpen])

  return (
    <GuideContext.Provider value={value}>
      {children}
      {active && <GuideOverlay key={active.tour.id + (active.section ?? '')} tour={active.tour} onClose={close} />}
    </GuideContext.Provider>
  )
}
