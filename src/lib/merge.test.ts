import { describe, expect, it } from 'vitest'
import { mergeStates } from './merge'
import { withDefaults, type Attempt } from './store'

const attempt = (questionId: string, at: string, correct = true): Attempt => ({ questionId, at, correct })

describe('mergeStates', () => {
  it('keeps answers from both devices once each, oldest first', () => {
    const shared = attempt('q1', '2026-11-01T10:00:00.000Z')
    const phone = withDefaults({ attempts: [shared, attempt('q2', '2026-11-02T10:00:00.000Z')] })
    const laptop = withDefaults({ attempts: [shared, attempt('q3', '2026-11-01T12:00:00.000Z')] })
    const merged = mergeStates(phone, laptop)
    expect(merged.attempts.map((item) => item.questionId)).toEqual(['q1', 'q3', 'q2'])
  })

  it('drops progress from before a reset on either device', () => {
    const old = withDefaults({ attempts: [attempt('q1', '2026-11-01T10:00:00.000Z')] })
    const reset = withDefaults({ resetAt: '2026-11-02T00:00:00.000Z' })
    expect(mergeStates(old, reset).attempts).toEqual([])
  })

  it('takes the more recently changed settings', () => {
    const older = withDefaults({ settings: { theme: 'dark', shuffleQuestions: true }, settingsUpdatedAt: '2026-11-01' })
    const newer = withDefaults({
      settings: { theme: 'light', shuffleQuestions: false },
      settingsUpdatedAt: '2026-11-02',
    })
    expect(mergeStates(older, newer).settings.theme).toBe('light')
    expect(mergeStates(newer, older).settings.theme).toBe('light')
  })
})
