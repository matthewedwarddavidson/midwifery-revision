import { Link, useParams, useSearchParams } from 'react-router'
import { Icon } from '../components/Icon'
import { findModule, moduleQuestions } from '../content'
import { questionStatus } from '../lib/stats'
import { useRecords } from '../lib/useRecords'
import { NotFound } from './NotFound'

const STATUS_PILL = { new: '', learning: 'almost', known: 'good' } as const

/** Every question with its answer, for reading through. */
export function AnswerSheet() {
  const module = findModule(useParams().moduleId)
  const [params, setParams] = useSearchParams()
  const records = useRecords()
  if (!module) return <NotFound />

  const topicId = params.get('topic')
  const questions = moduleQuestions(module)
  const topics = module.topics.filter((topic) => questions.some((question) => question.topic === topic.id))
  const shownTopics = topics.filter((topic) => !topicId || topic.id === topicId)

  return (
    <div className="page">
      <Link to={`/m/${module.id}`} className="back-link">
        ← {module.code}: {module.title}
      </Link>
      <header className="page-header">
        <div className="eyebrow">{module.code}</div>
        <h1>Answer sheet</h1>
        <p>Every question with the correct answer ticked.</p>
      </header>

      <div className="chips" style={{ marginBottom: 24 }}>
        <button className={`chip ${!topicId ? 'active' : ''}`} onClick={() => setParams({})}>
          All topics
        </button>
        {topics.map((topic) => (
          <button
            key={topic.id}
            className={`chip ${topicId === topic.id ? 'active' : ''}`}
            onClick={() => setParams({ topic: topic.id })}
          >
            {topic.title}
          </button>
        ))}
      </div>

      {shownTopics.map((topic) => (
        <section key={topic.id} className="section answer-topic">
          <div className="row between">
            <div className="section-title">{topic.title}</div>
            <Link to={`/m/${module.id}/practice?set=topic&topic=${topic.id}`} className="btn small">
              Practise
            </Link>
          </div>
          <div className="stack">
            {questions
              .filter((question) => question.topic === topic.id)
              .map((question) => {
                const status = questionStatus(records.get(question.id))
                return (
                  <div key={question.id} className="card">
                    <div className="row between" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                      <p className="prompt-small">{question.prompt}</p>
                      <span className={`pill ${STATUS_PILL[status]}`}>{status}</span>
                    </div>
                    <ul className="answer-list">
                      {question.choices.map((choice, index) => (
                        <li key={index} className={choice.correct ? 'good-text' : 'muted'}>
                          {choice.correct ? <Icon name="check" size={16} /> : <span className="answer-spacer" />}
                          {choice.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
          </div>
        </section>
      ))}
    </div>
  )
}
