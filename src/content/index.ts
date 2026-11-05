// All revision content. To add a module, create a folder under src/content and list it here.

import type { Module, Question } from './types'
import umcRevisionQuiz from './umc/revision-quiz.json'

const umc: Module = {
  id: 'umc',
  code: 'UMC',
  title: 'Anatomy and physiology',
  description: 'The body systems in pregnancy, labour and the postnatal period.',
  topics: [
    { id: 'reproduction', title: 'Reproduction and the menstrual cycle' },
    { id: 'cardiovascular', title: 'Cardiovascular system' },
    { id: 'respiratory', title: 'Respiratory system' },
    { id: 'fetal-skull', title: 'The fetal skull' },
    { id: 'pelvis', title: 'The female pelvis' },
    { id: 'pain', title: 'Pain' },
    { id: 'labour', title: 'Labour and birth' },
    { id: 'placenta', title: 'Placenta and cord' },
    { id: 'postnatal', title: 'Postnatal recovery' },
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
      questions: umcRevisionQuiz as Question[],
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

export function topicTitle(module: Module, topicId: string): string {
  return module.topics.find((topic) => topic.id === topicId)?.title ?? topicId
}
