import { describe, expect, it } from 'vitest'
import type { Diagram } from '../content/types'
import { diagramAnswers, isLabelCorrect, labelId } from './diagrams'

const label = { number: '4', answer: 'Mitral valve', aliases: ['Bicuspid valve'] }

describe('diagram labels', () => {
  it('accepts the answer or an alias, ignoring case, spaces and punctuation', () => {
    expect(isLabelCorrect(label, ' mitral-VALVE ')).toBe(true)
    expect(isLabelCorrect(label, 'bicuspid valve')).toBe(true)
    expect(isLabelCorrect(label, 'aortic valve')).toBe(false)
    expect(isLabelCorrect(label, '')).toBe(false)
  })

  it('builds ids from the diagram and number, and lists each answer once', () => {
    const diagram = {
      id: 'umc-heart',
      labels: [label, { number: '5', answer: 'Mitral valve' }],
    } as Diagram
    expect(labelId(diagram, label)).toBe('umc-heart-4')
    expect(diagramAnswers(diagram)).toEqual(['Mitral valve'])
  })
})
