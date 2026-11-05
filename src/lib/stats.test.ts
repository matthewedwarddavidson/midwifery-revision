import { describe, expect, it } from 'vitest'
import type { Question } from '../content/types'
import { focusQuestions, isAnswerCorrect, questionRecords, questionStatus, summarise } from './stats'

const question = (id: string, correct: number[] = [0]): Question => ({
  id,
  topic: 't',
  prompt: id,
  choices: [0, 1, 2].map((index) => ({ text: String(index), correct: correct.includes(index) })),
})

describe('questionStatus', () => {
  it('counts a question as known after two correct answers in a row', () => {
    const records = questionRecords([
      { questionId: 'a', correct: true, at: '1' },
      { questionId: 'a', correct: false, at: '2' },
      { questionId: 'a', correct: true, at: '3' },
    ])
    expect(questionStatus(records.get('a'))).toBe('learning')
    expect(
      questionStatus(
        questionRecords([...Array(2)].map((_, i) => ({ questionId: 'a', correct: true, at: String(i) }))).get('a'),
      ),
    ).toBe('known')
    expect(questionStatus(undefined)).toBe('new')
  })
})

describe('summarise', () => {
  it('counts missed questions by their latest answer', () => {
    const records = questionRecords([
      { questionId: 'a', correct: false, at: '1' },
      { questionId: 'b', correct: false, at: '1' },
      { questionId: 'b', correct: true, at: '2' },
    ])
    expect(summarise([question('a'), question('b'), question('c')], records)).toMatchObject({
      missed: 1,
      new: 1,
      learning: 2,
    })
  })
})

describe('focusQuestions', () => {
  it('puts questions answered wrongly first, then new ones, then the rest', () => {
    const records = questionRecords([
      { questionId: 'known', correct: true, at: '1' },
      { questionId: 'known', correct: true, at: '2' },
      { questionId: 'wrong', correct: false, at: '3' },
    ])
    const ids = focusQuestions([question('known'), question('new'), question('wrong')], records, 3).map((q) => q.id)
    expect(ids).toEqual(['wrong', 'new', 'known'])
  })
})

describe('isAnswerCorrect', () => {
  it('needs exactly the correct choices', () => {
    const multi = question('m', [0, 2])
    expect(isAnswerCorrect(multi, new Set([0, 2]))).toBe(true)
    expect(isAnswerCorrect(multi, new Set([0]))).toBe(false)
    expect(isAnswerCorrect(multi, new Set([0, 1, 2]))).toBe(false)
  })
})
