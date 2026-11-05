// Progress and settings, kept in localStorage. Sync (sync.ts) copies them to the cloud when signed in.
// Answers are an append-only list of attempts, so copies from two devices merge without losing anything.

import { useSyncExternalStore } from 'react'

export interface Attempt {
  questionId: string
  correct: boolean
  /** ISO timestamp. */
  at: string
}

export interface Session {
  id: string
  moduleId: string
  label: string
  correct: number
  total: number
  finishedAt: string
}

export type Theme = 'system' | 'light' | 'dark'

export interface Settings {
  theme: Theme
  shuffleQuestions: boolean
}

export interface AppState {
  attempts: Attempt[]
  sessions: Session[]
  settings: Settings
  settingsUpdatedAt: string
  /** Progress from before this time is ignored, on every device. */
  resetAt: string
  updatedAt: string
}

export const LONG_AGO = '1970-01-01T00:00:00.000Z'
const STORAGE_KEY = 'midwifery-revision:state'

const DEFAULT_SETTINGS: Settings = { theme: 'system', shuffleQuestions: true }

export function withDefaults(partial: Partial<AppState>): AppState {
  return {
    attempts: partial.attempts ?? [],
    sessions: partial.sessions ?? [],
    settings: { ...DEFAULT_SETTINGS, ...partial.settings },
    settingsUpdatedAt: partial.settingsUpdatedAt ?? LONG_AGO,
    resetAt: partial.resetAt ?? LONG_AGO,
    updatedAt: partial.updatedAt ?? LONG_AGO,
  }
}

function load(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return withDefaults(saved ? JSON.parse(saved) : {})
  } catch {
    return withDefaults({})
  }
}

let state = load()
const listeners = new Set<() => void>()

function save(next: AppState) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or blocked: progress still works for this visit.
  }
  listeners.forEach((listener) => listener())
}

function update(changes: Partial<AppState>) {
  save({ ...state, ...changes, updatedAt: new Date().toISOString() })
}

export function getState(): AppState {
  return state
}

export function subscribeToState(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribeToState, getState)
}

export function recordAttempt(questionId: string, correct: boolean) {
  update({ attempts: [...state.attempts, { questionId, correct, at: new Date().toISOString() }] })
}

export function recordSession(session: Omit<Session, 'id' | 'finishedAt'>) {
  const finishedAt = new Date().toISOString()
  update({ sessions: [...state.sessions, { ...session, id: crypto.randomUUID(), finishedAt }] })
}

export function updateSettings(changes: Partial<Settings>) {
  const now = new Date().toISOString()
  update({ settings: { ...state.settings, ...changes }, settingsUpdatedAt: now })
}

export function resetProgress() {
  update({ attempts: [], sessions: [], resetAt: new Date().toISOString() })
}

/** Replaces the state with one merged from the cloud. */
export function applySynced(next: AppState) {
  save(next)
}
