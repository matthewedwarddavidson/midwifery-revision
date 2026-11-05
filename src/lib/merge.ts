import type { AppState } from './store'

function later(a: string, b: string): string {
  return a > b ? a : b
}

/** One item per key, oldest first. */
function uniqueByKey<T>(items: T[], keyOf: (item: T) => string, timeOf: (item: T) => string): T[] {
  const byKey = new Map(items.map((item) => [keyOf(item), item]))
  return [...byKey.values()].sort((a, b) => timeOf(a).localeCompare(timeOf(b)))
}

/** Combines progress from two devices. Attempts and sessions are unions; the newer settings win. */
export function mergeStates(a: AppState, b: AppState): AppState {
  const resetAt = later(a.resetAt, b.resetAt)
  const attempts = uniqueByKey(
    [...a.attempts, ...b.attempts].filter((attempt) => attempt.at > resetAt),
    (attempt) => `${attempt.questionId}@${attempt.at}`,
    (attempt) => attempt.at,
  )
  const sessions = uniqueByKey(
    [...a.sessions, ...b.sessions].filter((session) => session.finishedAt > resetAt),
    (session) => session.id,
    (session) => session.finishedAt,
  )
  const newerSettings = a.settingsUpdatedAt >= b.settingsUpdatedAt ? a : b
  return {
    attempts,
    sessions,
    settings: newerSettings.settings,
    settingsUpdatedAt: newerSettings.settingsUpdatedAt,
    resetAt,
    updatedAt: later(a.updatedAt, b.updatedAt),
  }
}
