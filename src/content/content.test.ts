import { describe, expect, it } from 'vitest'
import { MODULES, moduleQuestions } from '.'
import umcExplanations from './umc/explanations.json'
import umcRevisionQuiz from './umc/revision-quiz.json'

describe('content', () => {
  for (const module of MODULES) {
    const questions = moduleQuestions(module)
    const topicIds = new Set(module.topics.map((topic) => topic.id))

    it(`${module.code}: every question has a known topic, options and an answer`, () => {
      for (const question of questions) {
        expect(topicIds, question.id).toContain(question.topic)
        expect(question.choices.length, question.id).toBeGreaterThanOrEqual(2)
        expect(
          question.choices.some((choice) => choice.correct),
          question.id,
        ).toBe(true)
      }
    })

    it(`${module.code}: question ids are unique`, () => {
      const ids = questions.map((question) => question.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  }

  it('UMC: every explanation belongs to a question, and every question has one', () => {
    const ids = umcRevisionQuiz.map((question) => question.id).sort()
    expect(Object.keys(umcExplanations).sort()).toEqual(ids)
  })
})
