// The shape of revision content. A course has modules; each module has topics and resources.
// Quizzes and diagrams so far; study guides and other resources can join the Resource union later.

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
  /** Why the answer is right, written for this app rather than by the quiz's author. */
  explanation?: string
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

export interface DiagramLabel {
  /** The number printed on the image. */
  number: string
  answer: string
  /** Other names accepted when typing. */
  aliases?: string[]
}

/** A numbered diagram to label. Each label is tracked like a question, with the id `<diagram id>-<number>`. */
export interface Diagram {
  kind: 'diagram'
  id: string
  title: string
  topic: string
  /** File in public/diagrams. */
  image: string
  /** Where the drawing came from; absent for diagrams drawn for this app. */
  credit?: { author: string; licence: string; licenceUrl: string; sourceUrl: string; changes?: string }
  /** The labels to ask; numbers on the image that aren't listed are left out. */
  labels: DiagramLabel[]
}

export type Resource = Quiz | Diagram

/** A hand-picked group of questions from the module's quizzes, such as all the percentages. */
export interface QuestionSet {
  id: string
  title: string
  description: string
  questionIds: string[]
}

export interface Module {
  id: string
  code: string
  title: string
  description: string
  topics: Topic[]
  resources: Resource[]
  sets?: QuestionSet[]
}
