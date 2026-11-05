import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Icon } from '../components/Icon'
import { ProgressBar } from '../components/ProgressBar'
import { findModule, moduleQuestions, topicTitle } from '../content'
import type { Module, Question } from '../content/types'
import { useKeyHandler } from '../lib/hooks'
import {
  correctChoices,
  focusQuestions,
  isAnswerCorrect,
  isMultiSelect,
  missedQuestions,
  questionRecords,
  shuffled,
} from '../lib/stats'
import { getState, recordAttempt, recordSession } from '../lib/store'
import { NotFound } from './NotFound'

const FOCUS_COUNT = 10

interface Plan {
  label: string
  questions: Question[]
}

/** Chooses the questions for this round. Runs once, so answering doesn't reshuffle the round. */
function buildPlan(module: Module, params: URLSearchParams): Plan {
  const { attempts, settings } = getState()
  const records = questionRecords(attempts)
  const all = moduleQuestions(module)
  const order = (questions: Question[]) => (settings.shuffleQuestions ? shuffled(questions) : questions)
  switch (params.get('set')) {
    case 'all':
      return { label: 'All questions', questions: order(all) }
    case 'missed':
      return { label: 'Missed questions', questions: order(missedQuestions(all, records)) }
    case 'topic': {
      const topicId = params.get('topic') ?? ''
      return {
        label: topicTitle(module, topicId),
        questions: order(all.filter((question) => question.topic === topicId)),
      }
    }
    default:
      return { label: `Practise ${FOCUS_COUNT}`, questions: shuffled(focusQuestions(all, records, FOCUS_COUNT)) }
  }
}

interface Result {
  question: Question
  correct: boolean
}

export function Practice() {
  const module = findModule(useParams().moduleId)
  const [params] = useSearchParams()
  const [plan] = useState(() => (module ? buildPlan(module, params) : undefined))
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [checked, setChecked] = useState(false)
  const [results, setResults] = useState<Result[]>([])

  const question = plan?.questions[index]
  const finished = plan !== undefined && index >= plan.questions.length

  function check(choices: Set<number>) {
    if (!question || checked || choices.size === 0) return
    const correct = isAnswerCorrect(question, choices)
    recordAttempt(question.id, correct)
    setPicked(choices)
    setChecked(true)
    setResults([...results, { question, correct }])
  }

  function choose(choiceIndex: number) {
    if (!question || checked) return
    if (!isMultiSelect(question)) {
      check(new Set([choiceIndex]))
      return
    }
    const next = new Set(picked)
    if (next.has(choiceIndex)) next.delete(choiceIndex)
    else next.add(choiceIndex)
    setPicked(next)
  }

  function next() {
    if (!plan || !module) return
    if (index + 1 >= plan.questions.length) {
      recordSession({
        moduleId: module.id,
        label: plan.label,
        correct: results.filter((result) => result.correct).length,
        total: results.length,
      })
    }
    setIndex(index + 1)
    setPicked(new Set())
    setChecked(false)
  }

  useKeyHandler(!!question, (key) => {
    if (!question) return false
    const number = Number(key)
    if (Number.isInteger(number) && number >= 1 && number <= question.choices.length) {
      choose(number - 1)
      return true
    }
    if (key === 'Enter') {
      if (checked) next()
      else check(picked)
      return true
    }
    return false
  })

  if (!module || !plan) return <NotFound />
  const backLink = (
    <Link to={`/m/${module.id}`} className="back-link">
      ← {module.code}: {module.title}
    </Link>
  )

  if (plan.questions.length === 0)
    return (
      <div className="page narrow">
        {backLink}
        <div className="card stack">
          <h2>Nothing to practise here</h2>
          <p className="muted">There are no questions in this set right now.</p>
          <div>
            <Link to={`/m/${module.id}/practice?set=focus`} className="btn primary">
              Practise {FOCUS_COUNT} instead
            </Link>
          </div>
        </div>
      </div>
    )

  if (finished) return <Results module={module} results={results} backLink={backLink} />
  if (!question) return null

  const multi = isMultiSelect(question)
  const correct = checked && isAnswerCorrect(question, picked)

  return (
    <div className="page narrow">
      {backLink}
      <div className="row between small muted" style={{ marginBottom: 8 }}>
        <span>{plan.label}</span>
        <span>
          {index + 1} of {plan.questions.length}
        </span>
      </div>
      <ProgressBar value={index / plan.questions.length} label="Progress through this round" />

      <div className="card question-card">
        <div className="eyebrow">{topicTitle(module, question.topic)}</div>
        <h2 className="prompt">{question.prompt}</h2>
        {multi && !checked && (
          <p className="muted small">Choose {correctChoices(question).length} answers, then check.</p>
        )}
        <div className="choices">
          {question.choices.map((choice, choiceIndex) => {
            const isPicked = picked.has(choiceIndex)
            const classes = ['choice']
            if (!checked && isPicked) classes.push('picked')
            if (checked && choice.correct) classes.push('correct')
            if (checked && isPicked && !choice.correct) classes.push('wrong')
            if (checked && !isPicked && !choice.correct) classes.push('dimmed')
            return (
              <button
                key={choiceIndex}
                className={classes.join(' ')}
                onClick={() => choose(choiceIndex)}
                disabled={checked}
                aria-pressed={multi ? isPicked : undefined}
              >
                <span className="choice-key">{choiceIndex + 1}</span>
                <span className="choice-text">{choice.text}</span>
                {checked && choice.correct && <Icon name="check" />}
                {checked && isPicked && !choice.correct && <Icon name="cross" />}
              </button>
            )
          })}
        </div>

        {checked ? (
          <div className={`feedback ${correct ? 'good' : 'bad'}`}>
            <strong>{correct ? 'Correct' : 'Not quite'}</strong>
            {!correct && (
              <span>
                {' '}
                {multi ? 'The answers are' : 'The answer is'}:
                {correctChoices(question)
                  .map((choice) => choice.text)
                  .join('; ')}
              </span>
            )}
          </div>
        ) : null}

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          {checked ? (
            <button className="btn primary" onClick={next} autoFocus>
              {index + 1 >= plan.questions.length ? 'See results' : 'Next'}
            </button>
          ) : (
            multi && (
              <button className="btn primary" onClick={() => check(picked)} disabled={picked.size === 0}>
                Check
              </button>
            )
          )}
        </div>
      </div>
      <p className="faint small keys-hint">Keys: 1–{question.choices.length} to answer, Enter to continue.</p>
    </div>
  )
}

function Results({ module, results, backLink }: { module: Module; results: Result[]; backLink: React.ReactNode }) {
  const correctCount = results.filter((result) => result.correct).length
  const percent = Math.round((correctCount / results.length) * 100)
  const wrong = results.filter((result) => !result.correct)
  const message =
    percent === 100
      ? 'Full marks.'
      : percent >= 80
        ? 'Strong round.'
        : percent >= 50
          ? 'Getting there.'
          : 'Worth another go.'

  return (
    <div className="page narrow">
      {backLink}
      <div className="card stack results">
        <div className="eyebrow">Round complete</div>
        <div className="score">
          {correctCount}
          <span className="faint"> / {results.length}</span>
        </div>
        <p className="muted">
          {percent}% · {message}
        </p>
        <div className="row">
          {wrong.length > 0 && (
            <Link to={`/m/${module.id}/practice?set=missed`} className="btn primary">
              <Icon name="repeat" /> Practise missed questions
            </Link>
          )}
          <Link to={`/m/${module.id}/practice?set=focus`} className={wrong.length > 0 ? 'btn' : 'btn primary'}>
            <Icon name="target" /> Practise {FOCUS_COUNT} more
          </Link>
        </div>
      </div>

      {wrong.length > 0 && (
        <div className="section">
          <div className="section-title">To go over</div>
          <div className="stack">
            {wrong.map(({ question }) => (
              <div key={question.id} className="card review-item">
                <p className="prompt-small">{question.prompt}</p>
                <p className="good-text">
                  <Icon name="check" size={16} />{' '}
                  {correctChoices(question)
                    .map((choice) => choice.text)
                    .join('; ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
