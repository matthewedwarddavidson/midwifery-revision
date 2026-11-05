import { describe, expect, it } from 'vitest'
import { MODULES, moduleQuestions } from '.'

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
})
