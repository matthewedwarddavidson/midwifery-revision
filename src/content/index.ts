// All revision content. To add a module, create a folder under src/content and list it here.

import type { Diagram, Module, Question, QuestionSet } from './types'
import { UMC_DIAGRAMS } from './umc/diagrams'
import umcExplanations from './umc/explanations.json'
import umcOwnQuestions from './umc/own-questions.json'
import umcQuestionsAndAnswers from './umc/questions-and-answers.json'
import umcRevisionQuiz from './umc/revision-quiz.json'

/** Adds explanations, kept in their own file so re-importing a quiz doesn't overwrite them. */
function withExplanations(questions: Question[], explanations: Record<string, string>): Question[] {
  return questions.map((question) => ({ ...question, explanation: explanations[question.id] }))
}

const umc: Module = {
  id: 'umc',
  code: 'UMC',
  title: 'Anatomy and physiology',
  description: 'The body systems in pregnancy, labour and the postnatal period.',
  topics: [
    { id: 'reproduction', title: 'Reproduction and the menstrual cycle' },
    { id: 'endocrine', title: 'Endocrine system' },
    { id: 'cardiovascular', title: 'Cardiovascular system' },
    { id: 'respiratory', title: 'Respiratory system' },
    { id: 'fetal-skull', title: 'The fetal skull' },
    { id: 'pelvis', title: 'The female pelvis' },
    { id: 'pain', title: 'Pain' },
    { id: 'labour', title: 'Labour and birth' },
    { id: 'placenta', title: 'Placenta and cord' },
    { id: 'postnatal', title: 'Postnatal recovery' },
    { id: 'newborn', title: 'The newborn' },
    { id: 'nervous', title: 'Nervous system' },
    { id: 'musculoskeletal', title: 'Musculoskeletal system' },
    { id: 'digestive', title: 'Digestive system' },
    { id: 'embryology', title: 'Embryology and genetics' },
    { id: 'renal', title: 'Renal system' },
    { id: 'blood', title: 'Blood, lymph and immunity' },
    { id: 'lactation', title: 'Breasts and lactation' },
  ],
  resources: [
    {
      kind: 'quiz',
      id: 'umc-revision-quiz',
      title: 'UMC revision quiz',
      description: 'Multiple choice and true or false questions across the module.',
      source: 'Holly, UMC tutor',
      questions: withExplanations(umcRevisionQuiz as Question[], umcExplanations),
    },
    {
      kind: 'quiz',
      id: 'umc-questions-and-answers',
      title: 'UMC questions and answers',
      description: 'A second set of multiple choice questions across the module.',
      source: 'the course (author not named)',
      questions: withExplanations(umcQuestionsAndAnswers as Question[], umcExplanations),
    },
    {
      kind: 'quiz',
      id: 'umc-own-questions',
      title: 'Facts from your notes',
      description: 'Questions written for this app from your own revision notes: mostly percentages and numbers.',
      source: 'you (written up from your notes)',
      questions: withExplanations(umcOwnQuestions as Question[], umcExplanations),
    },
    ...UMC_DIAGRAMS,
  ],
  sets: [
    {
      id: 'percentages',
      title: 'Percentages',
      description: 'Every question whose answer is a percentage.',
      questionIds: [
        'umc-017',
        'umc-076',
        'umc-079',
        'umc3-001',
        'umc3-002',
        'umc3-003',
        'umc3-004',
        'umc3-005',
        'umc3-022',
        'umc3-023',
        'umc3-029',
      ],
    },
    {
      id: 'numbers',
      title: 'Numbers to remember',
      description: 'Questions whose answer is a number: measurements, timings and counts.',
      questionIds: [
        'umc-006',
        'umc-028',
        'umc-029',
        'umc-052',
        'umc-075',
        'umc2-051',
        'umc2-052',
        'umc2-058',
        'umc2-064',
        'umc2-065',
        'umc2-110',
        'umc3-006',
        'umc3-007',
        'umc3-008',
        'umc3-009',
        'umc3-010',
        'umc3-011',
        'umc3-012',
        'umc3-013',
        'umc3-014',
        'umc3-015',
        'umc3-016',
        'umc3-017',
        'umc3-018',
        'umc3-019',
        'umc3-020',
        'umc3-021',
        'umc3-024',
        'umc3-026',
        'umc3-027',
        'umc3-028',
        'umc3-030',
      ],
    },
  ],
}

export const MODULES: Module[] = [umc]

export function findModule(moduleId: string | undefined): Module | undefined {
  return MODULES.find((module) => module.id === moduleId)
}

export function moduleQuestions(module: Module): Question[] {
  return module.resources.flatMap((resource) => (resource.kind === 'quiz' ? resource.questions : []))
}

export function findSet(module: Module, setId: string | null): QuestionSet | undefined {
  return module.sets?.find((set) => set.id === setId)
}

/** The set's questions, in the set's order. */
export function setQuestions(module: Module, set: QuestionSet): Question[] {
  const byId = new Map(moduleQuestions(module).map((question) => [question.id, question]))
  return set.questionIds.flatMap((id) => byId.get(id) ?? [])
}

export function moduleDiagrams(module: Module): Diagram[] {
  return module.resources.filter((resource): resource is Diagram => resource.kind === 'diagram')
}

export function findDiagram(module: Module, diagramId: string | undefined): Diagram | undefined {
  return moduleDiagrams(module).find((diagram) => diagram.id === diagramId)
}

export function topicTitle(module: Module, topicId: string): string {
  return module.topics.find((topic) => topic.id === topicId)?.title ?? topicId
}
