import { useSyncExternalStore } from 'react'
import type { ObservationRow, Params, Row } from '@/types/experiment'
import { uid } from '@/utils/random'

/**
 * Phase-1 persistence: one JSON document in localStorage.
 * The shape mirrors the Phase-2 Supabase tables (profile → attempts → notebook rows → viva scores)
 * so it can be swapped for a remote store without touching the pages.
 */
export interface VivaAttempt {
  score: number
  total: number
  answers: number[]
  completedAt: string
}

export interface ExperimentRecord {
  rows: ObservationRow[]
  params?: Params
  theoryViewed?: boolean
  analysisViewed?: boolean
  reportViewed?: boolean
  vivaAttempts: VivaAttempt[]
  timeSpentMs: number
  lastVisited?: string
}

export interface LabState {
  version: 1
  studentName: string
  noise: boolean
  lastExperimentId?: string
  experiments: Record<string, ExperimentRecord>
}

const KEY = 'physilab:v1'

const initial: LabState = { version: 1, studentName: '', noise: true, experiments: {} }

function load(): LabState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial
    const parsed = JSON.parse(raw) as LabState
    if (parsed?.version !== 1) return initial
    return { ...initial, ...parsed }
  } catch {
    return initial
  }
}

let state: LabState = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage full or blocked (private mode): the lab still works for this session.
  }
}

function set(next: LabState) {
  state = next
  persist()
  listeners.forEach((l) => l())
}

function emptyRecord(): ExperimentRecord {
  return { rows: [], vivaAttempts: [], timeSpentMs: 0 }
}

function updateExperiment(id: string, fn: (r: ExperimentRecord) => ExperimentRecord) {
  const current = state.experiments[id] ?? emptyRecord()
  set({ ...state, experiments: { ...state.experiments, [id]: fn(current) } })
}

export const lab = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  record(id: string): ExperimentRecord {
    return state.experiments[id] ?? emptyRecord()
  },
  setStudentName(name: string) {
    set({ ...state, studentName: name.slice(0, 60) })
  },
  setNoise(noise: boolean) {
    set({ ...state, noise })
  },
  visit(id: string) {
    set({
      ...state,
      lastExperimentId: id,
      experiments: {
        ...state.experiments,
        [id]: { ...(state.experiments[id] ?? emptyRecord()), lastVisited: new Date().toISOString() },
      },
    })
  },
  mark(id: string, flag: 'theoryViewed' | 'analysisViewed' | 'reportViewed') {
    if (state.experiments[id]?.[flag]) return
    updateExperiment(id, (r) => ({ ...r, [flag]: true }))
  },
  saveParams(id: string, params: Params) {
    updateExperiment(id, (r) => ({ ...r, params }))
  },
  addRow(id: string, values: Row) {
    const row: ObservationRow = { id: uid(), createdAt: new Date().toISOString(), values }
    updateExperiment(id, (r) => ({ ...r, rows: [...r.rows, row] }))
  },
  removeRow(id: string, rowId: string) {
    updateExperiment(id, (r) => ({ ...r, rows: r.rows.filter((x) => x.id !== rowId) }))
  },
  clearRows(id: string) {
    updateExperiment(id, (r) => ({ ...r, rows: [], analysisViewed: false }))
  },
  addVivaAttempt(id: string, attempt: VivaAttempt) {
    updateExperiment(id, (r) => ({ ...r, vivaAttempts: [...r.vivaAttempts, attempt] }))
  },
  addTime(id: string, ms: number) {
    if (ms <= 0) return
    updateExperiment(id, (r) => ({ ...r, timeSpentMs: r.timeSpentMs + ms }))
  },
  resetAll() {
    set({ ...initial, studentName: state.studentName })
  },
}

export function useLab(): LabState {
  return useSyncExternalStore(lab.subscribe, lab.get, lab.get)
}

export function useExperimentRecord(id: string): ExperimentRecord {
  const s = useLab()
  return s.experiments[id] ?? EMPTY
}

const EMPTY: ExperimentRecord = emptyRecord()
