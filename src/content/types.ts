// The shape of revision content. A course has modules; each module has topics and resources.
// Only quizzes exist so far; study guides and other resources can join the Resource union later.

export interface Choice {
  text: string
  correct: boolean
}

export interface Question {
  /** Stable id: progress is recorded against it, so never reuse or renumber ids. */
  id: string
  topic: string
  prompt: string
  choices: Choice[]
}

export interface Topic {
  id: string
  title: string
}

export interface Quiz {
  kind: 'quiz'
  id: string
  title: string
  description: string
  /** Who wrote the questions. */
  source: string
  questions: Question[]
}

export type Resource = Quiz

export interface Module {
  id: string
  code: string
  title: string
  description: string
  topics: Topic[]
  resources: Resource[]
}
