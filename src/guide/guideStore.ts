import { useSyncExternalStore } from 'react'

/**
 * Which first-time guides the student has already seen, and whether guides are switched off.
 * Kept apart from the lab store so resetting lab progress does not replay every guide.
 */
export interface GuideState {
  version: 1
  seen: Record<string, boolean>
  off: boolean
}

const KEY = 'physilab:guides'
const initial: GuideState = { version: 1, seen: {}, off: false }

function load(): GuideState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial
    const parsed = JSON.parse(raw) as GuideState
    if (parsed?.version !== 1 || typeof parsed.seen !== 'object' || parsed.seen === null) return initial
    return { ...initial, ...parsed }
  } catch {
    return initial
  }
}

let state: GuideState = load()
const listeners = new Set<() => void>()

function set(next: GuideState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage blocked: guides still work for this session.
  }
  listeners.forEach((l) => l())
}

export const guides = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  markSeen(id: string) {
    if (state.seen[id]) return
    set({ ...state, seen: { ...state.seen, [id]: true } })
  },
  setOff(off: boolean) {
    set({ ...state, off })
  },
  /** Show every guide again on the next visit to each section. */
  reset() {
    set({ ...initial })
  },
}

export function useGuideState(): GuideState {
  return useSyncExternalStore(guides.subscribe, guides.get, guides.get)
}
