// What the attempt history says about each question, and which questions to practise next.

import type { Choice, Question } from '../content/types'
import type { Attempt } from './store'

export type QuestionStatus = 'new' | 'learning' | 'known'

export interface QuestionRecord {
  attempts: number
  correct: number
  lastCorrect: boolean
  lastAt: string
  /** Correct answers in a row, counting back from the latest. */
  streak: number
}

/** A question is known once answered correctly twice in a row. */
const KNOWN_STREAK = 2

export function questionRecords(attempts: Attempt[]): Map<string, QuestionRecord> {
  const records = new Map<string, QuestionRecord>()
  for (const attempt of attempts) {
    const record = records.get(attempt.questionId) ?? {
      attempts: 0,
      correct: 0,
      lastCorrect: false,
      lastAt: '',
      streak: 0,
    }
    records.set(attempt.questionId, {
      attempts: record.attempts + 1,
      correct: record.correct + (attempt.correct ? 1 : 0),
      lastCorrect: attempt.correct,
      lastAt: attempt.at,
      streak: attempt.correct ? record.streak + 1 : 0,
    })
  }
  return records
}

export function questionStatus(record: QuestionRecord | undefined): QuestionStatus {
  if (!record) return 'new'
  return record.streak >= KNOWN_STREAK ? 'known' : 'learning'
}

export interface Summary {
  total: number
  new: number
  learning: number
  known: number
  missed: number
}

/** Works for anything tracked by id: questions and diagram labels. */
export function summarise(questions: { id: string }[], records: Map<string, QuestionRecord>): Summary {
  const summary: Summary = { total: questions.length, new: 0, learning: 0, known: 0, missed: 0 }
  for (const question of questions) {
    const record = records.get(question.id)
    summary[questionStatus(record)]++
    if (record && !record.lastCorrect) summary.missed++
  }
  return summary
}

/** A short description such as "2 known · 9 learning · 2 new", or "Not started". */
export function describeSummary(summary: Summary): string {
  if (summary.new === summary.total) return 'Not started'
  const parts = [
    summary.known > 0 && `${summary.known} known`,
    summary.learning > 0 && `${summary.learning} learning`,
    summary.new > 0 && `${summary.new} new`,
  ]
  return parts.filter(Boolean).join(' · ')
}

/** Questions whose latest answer was wrong. */
export function missedQuestions(questions: Question[], records: Map<string, QuestionRecord>): Question[] {
  return questions.filter((question) => records.get(question.id)?.lastCorrect === false)
}

/**
 * The questions most worth practising: wrong last time first, then never tried, then not yet known,
 * with the longest-unseen first within each group.
 */
export function focusQuestions(questions: Question[], records: Map<string, QuestionRecord>, count: number): Question[] {
  function priority(question: Question): number {
    const record = records.get(question.id)
    if (record && !record.lastCorrect) return 0
    if (!record) return 1
    return questionStatus(record) === 'learning' ? 2 : 3
  }
  return [...questions]
    .sort(
      (a, b) =>
        priority(a) - priority(b) || (records.get(a.id)?.lastAt ?? '').localeCompare(records.get(b.id)?.lastAt ?? ''),
    )
    .slice(0, count)
}

export function correctChoices(question: Question): Choice[] {
  return question.choices.filter((choice) => choice.correct)
}

export function isMultiSelect(question: Question): boolean {
  return correctChoices(question).length > 1
}

/** Right only if exactly the correct choices are picked. */
export function isAnswerCorrect(question: Question, picked: Set<number>): boolean {
  return question.choices.every((choice, index) => choice.correct === picked.has(index))
}

export function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[other]] = [copy[other], copy[index]]
  }
  return copy
}
