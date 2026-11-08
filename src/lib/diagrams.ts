// Checking diagram labels. Each label is recorded like a question, so progress and sync treat them the same.

import type { Diagram, DiagramLabel } from '../content/types'

export function diagramUrl(diagram: Diagram): string {
  return `${import.meta.env.BASE_URL}diagrams/${diagram.image}`
}

/**
 * Downloads the diagrams in the background once the page has settled, so opening one is instant.
 * One at a time and at low priority, so a diagram she opens meanwhile isn't slowed down.
 * Skipped when the browser asks to save data.
 */
export function prefetchDiagrams(diagrams: Diagram[]): () => void {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData || diagrams.length === 0) return () => {}
  let stopped = false
  const queue = [...diagrams]
  function next() {
    const diagram = queue.shift()
    if (stopped || !diagram) return
    const image = new Image()
    image.fetchPriority = 'low'
    image.onload = image.onerror = next
    image.src = diagramUrl(diagram)
  }
  const timer = window.setTimeout(next, 1500)
  return () => {
    stopped = true
    window.clearTimeout(timer)
  }
}

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
