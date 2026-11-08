import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Icon } from '../components/Icon'
import { findDiagram, findModule, topicTitle } from '../content'
import type { Diagram, DiagramLabel, Module } from '../content/types'
import { diagramAnswers, isLabelCorrect, labelId } from '../lib/diagrams'
import { shuffled } from '../lib/stats'
import { recordAttempt } from '../lib/store'
import { useTermDrag } from '../lib/useTermDrag'
import { NotFound } from './NotFound'

type Mode = 'drag' | 'type'

/** What has been given for each label, keyed by its number. */
type Answers = Record<string, string>

export function DiagramPage() {
  const { moduleId, diagramId } = useParams()
  const module = findModule(moduleId)
  const diagram = module && findDiagram(module, diagramId)
  if (!module || !diagram) return <NotFound />
  return <DiagramQuiz key={diagram.id} module={module} diagram={diagram} />
}

function DiagramQuiz({ module, diagram }: { module: Module; diagram: Diagram }) {
  const [mode, setMode] = useState<Mode>('drag')
  const [given, setGiven] = useState<Answers>({})
  const [checked, setChecked] = useState(false)
  // A new order each round, so a term's place in the bank doesn't give the answer away.
  const [terms, setTerms] = useState(() => shuffled(diagramAnswers(diagram)))

  const isCorrect = (label: DiagramLabel) => isLabelCorrect(label, given[label.number] ?? '')
  const score = diagram.labels.filter(isCorrect).length

  function check() {
    // Blank slots aren't attempts, so they don't count against progress.
    const answered = diagram.labels.filter((label) => (given[label.number] ?? '').trim())
    for (const label of answered) recordAttempt(labelId(diagram, label), isCorrect(label))
    setChecked(true)
  }

  function startAgain(nextMode: Mode = mode) {
    setMode(nextMode)
    setGiven({})
    setChecked(false)
    setTerms(shuffled(diagramAnswers(diagram)))
  }

  return (
    <div className="page">
      <Link to={`/m/${module.id}`} className="back-link">
        ← {module.code}
      </Link>
      <header className="page-header">
        <div className="eyebrow">{topicTitle(module, diagram.topic)}</div>
        <h1>{diagram.title}</h1>
        <p>Name each numbered part of the diagram, then check your answers.</p>
      </header>

      <div className="row" role="group" aria-label="How to answer">
        <ModeButton active={mode === 'drag'} onClick={() => startAgain('drag')}>
          Drag the terms
        </ModeButton>
        <ModeButton active={mode === 'type'} onClick={() => startAgain('type')}>
          Type the names
        </ModeButton>
      </div>

      <div className="diagram-layout">
        <figure className="card diagram-figure">
          <DiagramImage diagram={diagram} />
          <Credit diagram={diagram} />
        </figure>

        <div className="card stack">
          {mode === 'drag' ? (
            <DragBoard diagram={diagram} terms={terms} given={given} checked={checked} onChange={setGiven} />
          ) : (
            <TypeBoard diagram={diagram} given={given} checked={checked} onChange={setGiven} />
          )}
          {checked ? (
            <div className="row between">
              <strong className={score === diagram.labels.length ? 'good-text' : ''}>
                {score} of {diagram.labels.length} correct
              </strong>
              <button className="btn primary" onClick={() => startAgain()}>
                <Icon name="repeat" /> Try again
              </button>
            </div>
          ) : (
            <button className="btn primary" onClick={check}>
              <Icon name="check" /> Check answers
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button className={`btn small ${active ? 'primary' : ''}`} onClick={onClick} aria-pressed={active}>
      {children}
    </button>
  )
}

interface BoardProps {
  diagram: Diagram
  given: Answers
  checked: boolean
  onChange: (given: Answers) => void
}

/** A bank of terms to drag (or tap, then tap a number) into the numbered slots. */
function DragBoard({ diagram, terms, given, checked, onChange }: BoardProps & { terms: string[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const { drag, dragHandlers, wasDrag } = useTermDrag(dropTerm)
  const placedTerms = new Set(Object.values(given))
  const bank = terms.filter((term) => !placedTerms.has(term))

  /** Puts a term in a slot, taking it out of any other slot; a term already in that slot goes back to the bank. */
  function place(term: string, number: string) {
    const next = Object.fromEntries(Object.entries(given).filter(([, placed]) => placed !== term))
    onChange({ ...next, [number]: term })
    setSelected(null)
  }

  function returnToBank(term: string) {
    onChange(Object.fromEntries(Object.entries(given).filter(([, placed]) => placed !== term)))
    setSelected(null)
  }

  function dropTerm(term: string, target: Element | null) {
    const slot = target?.closest('[data-slot]')?.getAttribute('data-slot')
    if (slot) place(term, slot)
    else if (target?.closest('[data-bank]')) returnToBank(term)
  }

  function tapTerm(term: string) {
    if (wasDrag()) return
    setSelected(selected === term ? null : term)
  }

  function tapSlot(number: string) {
    if (wasDrag()) return
    const current = given[number]
    if (selected) place(selected, number)
    else if (current) returnToBank(current)
  }

  return (
    <>
      {!checked && (
        <div className="term-bank" data-bank>
          <p className="faint small">Drag each term to its number, or tap a term and then a number.</p>
          <div className="term-list">
            {bank.map((term) => (
              <button
                key={term}
                className={`term ${selected === term ? 'selected' : ''} ${drag?.term === term ? 'dragging' : ''}`}
                onClick={() => tapTerm(term)}
                aria-pressed={selected === term}
                {...dragHandlers(term)}
              >
                {term}
              </button>
            ))}
            {bank.length === 0 && <span className="faint small">All terms placed. Check your answers when ready.</span>}
          </div>
        </div>
      )}

      {diagram.labels.map((label) => {
        const term = given[label.number]
        const state = checked ? (isLabelCorrect(label, term ?? '') ? 'correct' : 'wrong') : ''
        return (
          <div key={label.number} className={`label-row ${state}`}>
            <span className="label-number" aria-hidden="true">
              {label.number}
            </span>
            <button
              className={`slot ${term ? 'filled' : ''} ${selected ? 'ready' : ''}`}
              data-slot={label.number}
              onClick={() => tapSlot(label.number)}
              disabled={checked}
              aria-label={`Part ${label.number}: ${term ?? 'empty'}`}
              {...(term && !checked ? dragHandlers(term) : {})}
            >
              {term ?? <span className="faint">Drop a term here</span>}
            </button>
            {state === 'wrong' && <span className="label-correction small">{label.answer}</span>}
          </div>
        )
      })}

      {drag && (
        <div className="term drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          {drag.term}
        </div>
      )}
    </>
  )
}

/** Typing each name: harder, as nothing is offered. */
function TypeBoard({ diagram, given, checked, onChange }: BoardProps) {
  return (
    <>
      {diagram.labels.map((label) => {
        const value = given[label.number] ?? ''
        const state = checked ? (isLabelCorrect(label, value) ? 'correct' : 'wrong') : ''
        return (
          <div key={label.number} className={`label-row ${state}`}>
            <span className="label-number" aria-hidden="true">
              {label.number}
            </span>
            <input
              className="field"
              value={value}
              onChange={(event) => onChange({ ...given, [label.number]: event.target.value })}
              disabled={checked}
              aria-label={`Part ${label.number}`}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {state === 'wrong' && <span className="label-correction small">{label.answer}</span>}
          </div>
        )
      })}
    </>
  )
}

function Credit({ diagram }: { diagram: Diagram }) {
  const { credit } = diagram
  if (!credit) return <figcaption className="faint small">Schematic drawn for this app.</figcaption>
  return (
    <figcaption className="faint small">
      <a href={credit.sourceUrl} target="_blank" rel="noreferrer">
        Diagram
      </a>{' '}
      by {credit.author},{' '}
      <a href={credit.licenceUrl} target="_blank" rel="noreferrer">
        {credit.licence}
      </a>
      , via Wikimedia Commons{credit.changes ? `; ${credit.changes}` : ''}
    </figcaption>
  )
}

type ImageState = 'loading' | 'loaded' | 'failed'

/** The diagram, with a placeholder holding its space until it arrives. */
function DiagramImage({ diagram }: { diagram: Diagram }) {
  const [state, setState] = useState<ImageState>('loading')
  return (
    <div className={`diagram-image ${state}`}>
      {state === 'loading' && <span className="faint small">Loading diagram…</span>}
      {state === 'failed' && (
        <span className="bad-text small">The diagram didn't load. Refresh the page to try again.</span>
      )}
      <img
        src={`${import.meta.env.BASE_URL}diagrams/${diagram.image}`}
        alt={`Numbered diagram: ${diagram.title}`}
        onLoad={() => setState('loaded')}
        onError={() => setState('failed')}
      />
    </div>
  )
}
