import { describe, expect, it } from 'vitest'
import { MODULES, moduleDiagrams, moduleQuestions } from '.'

const diagramFiles = Object.keys(import.meta.glob('../../public/diagrams/*', { query: '?url', eager: true })).map(
  (path) => path.split('/').pop(),
)
import umcExplanations from './umc/explanations.json'
import umcOwnQuestions from './umc/own-questions.json'
import umcQuestionsAndAnswers from './umc/questions-and-answers.json'
import umcRevisionQuiz from './umc/revision-quiz.json'
import umcThirdStageAndFetalCirculation from './umc/third-stage-and-fetal-circulation.json'

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

    it(`${module.code}: each diagram has a known topic, its image and labels numbered 1 to n`, () => {
      for (const diagram of moduleDiagrams(module)) {
        expect(topicIds, diagram.id).toContain(diagram.topic)
        expect(diagramFiles, diagram.image).toContain(diagram.image)
        // Numbers run 1, 2, 3… with no gaps, so every number on the image is asked.
        const numbers = diagram.labels.map((label) => label.number)
        expect(numbers, diagram.id).toEqual(numbers.map((_, index) => String(index + 1)))
      }
    })

    it(`${module.code}: every question set lists real questions`, () => {
      const ids = new Set(questions.map((question) => question.id))
      for (const set of module.sets ?? []) {
        for (const id of set.questionIds) expect(ids, `${set.id}: ${id}`).toContain(id)
      }
    })

    it(`${module.code}: question ids are unique`, () => {
      const ids = questions.map((question) => question.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  }

  it('UMC: every explanation belongs to a question, and every question has one', () => {
    const ids = [...umcRevisionQuiz, ...umcQuestionsAndAnswers, ...umcOwnQuestions, ...umcThirdStageAndFetalCirculation]
      .map((question) => question.id)
      .sort()
    expect(Object.keys(umcExplanations).sort()).toEqual(ids)
  })
})
