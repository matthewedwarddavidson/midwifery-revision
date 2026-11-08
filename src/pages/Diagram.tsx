import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Icon } from '../components/Icon'
import { findDiagram, findModule, topicTitle } from '../content'
import type { Diagram, DiagramLabel, Module } from '../content/types'
import { diagramAnswers, isLabelCorrect, labelId } from '../lib/diagrams'
import { shuffled } from '../lib/stats'
import { recordAttempt } from '../lib/store'
import { NotFound } from './NotFound'

type Mode = 'pick' | 'type'

export function DiagramPage() {
  const { moduleId, diagramId } = useParams()
  const module = findModule(moduleId)
  const diagram = module && findDiagram(module, diagramId)
  if (!module || !diagram) return <NotFound />
  return <DiagramQuiz key={diagram.id} module={module} diagram={diagram} />
}

function DiagramQuiz({ module, diagram }: { module: Module; diagram: Diagram }) {
  const [mode, setMode] = useState<Mode>('pick')
  const [given, setGiven] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  // A new order each round, so the list position doesn't give the answer away.
  const [options, setOptions] = useState(() => shuffled(diagramAnswers(diagram)))

  const score = diagram.labels.filter((label) => isLabelCorrect(label, given[label.number] ?? '')).length

  function check() {
    for (const label of diagram.labels) {
      recordAttempt(labelId(diagram, label), isLabelCorrect(label, given[label.number] ?? ''))
    }
    setChecked(true)
  }

  function startAgain(nextMode: Mode = mode) {
    setMode(nextMode)
    setGiven({})
    setChecked(false)
    setOptions(shuffled(diagramAnswers(diagram)))
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
        <button
          className={`btn small ${mode === 'pick' ? 'primary' : ''}`}
          onClick={() => startAgain('pick')}
          aria-pressed={mode === 'pick'}
        >
          Pick from a list
        </button>
        <button
          className={`btn small ${mode === 'type' ? 'primary' : ''}`}
          onClick={() => startAgain('type')}
          aria-pressed={mode === 'type'}
        >
          Type the name
        </button>
      </div>

      <div className="diagram-layout">
        <figure className="card diagram-figure">
          <DiagramImage diagram={diagram} />
          <figcaption className="faint small">
            <a href={diagram.credit.sourceUrl} target="_blank" rel="noreferrer">
              Diagram
            </a>{' '}
            by {diagram.credit.author},{' '}
            <a href={diagram.credit.licenceUrl} target="_blank" rel="noreferrer">
              {diagram.credit.licence}
            </a>
            , via Wikimedia Commons
          </figcaption>
        </figure>

        <div className="card stack">
          {diagram.labels.map((label) => (
            <LabelRow
              key={label.number}
              label={label}
              mode={mode}
              options={options}
              value={given[label.number] ?? ''}
              checked={checked}
              onChange={(value) => setGiven((current) => ({ ...current, [label.number]: value }))}
            />
          ))}
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

function LabelRow({
  label,
  mode,
  options,
  value,
  checked,
  onChange,
}: {
  label: DiagramLabel
  mode: Mode
  options: string[]
  value: string
  checked: boolean
  onChange: (value: string) => void
}) {
  const correct = isLabelCorrect(label, value)
  const state = checked ? (correct ? 'correct' : 'wrong') : ''
  const fieldLabel = `Part ${label.number}`
  return (
    <div className={`label-row ${state}`}>
      <span className="label-number" aria-hidden="true">
        {label.number}
      </span>
      {mode === 'pick' ? (
        <select
          className="field"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={checked}
          aria-label={fieldLabel}
        >
          <option value="">Choose…</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="field"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={checked}
          aria-label={fieldLabel}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      )}
      {checked && !correct && <span className="label-correction small">{label.answer}</span>}
    </div>
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
