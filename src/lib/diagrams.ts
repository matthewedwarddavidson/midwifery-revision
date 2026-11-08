// Checking diagram labels. Each label is recorded like a question, so progress and sync treat them the same.

import type { Diagram, DiagramLabel } from '../content/types'

export function labelId(diagram: Diagram, label: DiagramLabel): string {
  return `${diagram.id}-${label.number}`
}

export function labelIds(diagram: Diagram): { id: string }[] {
  return diagram.labels.map((label) => ({ id: labelId(diagram, label) }))
}

/** Lower case, letters and digits only, so "Mitral valve", "mitral-valve" and " MITRAL VALVE " match. */
function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function isLabelCorrect(label: DiagramLabel, given: string): boolean {
  const answer = normalise(given)
  if (!answer) return false
  return [label.answer, ...(label.aliases ?? [])].some((name) => normalise(name) === answer)
}

/** Each distinct answer once, for the pick-from-list options. */
export function diagramAnswers(diagram: Diagram): string[] {
  return [...new Set(diagram.labels.map((label) => label.answer))]
}
