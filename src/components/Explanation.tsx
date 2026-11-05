import type { Question } from '../content/types'

export const EXPLANATION_NOTE =
  'Explanations are written for this app, not by the tutor. Check them against your lecture notes.'

export function Explanation({ question }: { question: Question }) {
  if (!question.explanation) return null
  return (
    <p className="explanation">
      <strong>Why: </strong>
      {question.explanation}
    </p>
  )
}
