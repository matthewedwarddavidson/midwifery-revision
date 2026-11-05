import { Link, useParams } from 'react-router'
import { Icon } from '../components/Icon'
import { SummaryBar } from '../components/SummaryBar'
import { findModule, moduleQuestions } from '../content'
import { summarise } from '../lib/stats'
import { useRecords } from '../lib/useRecords'
import { NotFound } from './NotFound'

export function ModulePage() {
  const module = findModule(useParams().moduleId)
  const records = useRecords()
  if (!module) return <NotFound />

  const questions = moduleQuestions(module)
  const summary = summarise(questions, records)
  const practiceLink = (query: string) => `/m/${module.id}/practice?${query}`

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Home
      </Link>
      <header className="page-header">
        <div className="eyebrow">{module.code}</div>
        <h1>{module.title}</h1>
        <p>{module.description}</p>
      </header>

      <div className="card stack">
        <div className="stats">
          <Stat label="Known" value={summary.known} tone="good" />
          <Stat label="Learning" value={summary.learning} tone="almost" />
          <Stat label="New" value={summary.new} />
          <Stat label="Missed last time" value={summary.missed} tone="bad" />
        </div>
        <SummaryBar summary={summary} showLegend={false} />
        <div className="row">
          <Link to={practiceLink('set=focus')} className="btn primary">
            <Icon name="target" /> Practise 10
          </Link>
          {summary.missed > 0 && (
            <Link to={practiceLink('set=missed')} className="btn">
              <Icon name="repeat" /> Missed questions ({summary.missed})
            </Link>
          )}
          <Link to={practiceLink('set=all')} className="btn">
            <Icon name="book" /> All {questions.length} questions
          </Link>
          <Link to={`/m/${module.id}/answers`} className="btn ghost">
            <Icon name="list" /> Answer sheet
          </Link>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Topics</div>
        <div className="card topic-list">
          {module.topics.map((topic) => {
            const topicSummary = summarise(
              questions.filter((question) => question.topic === topic.id),
              records,
            )
            if (topicSummary.total === 0) return null
            return (
              <Link key={topic.id} to={practiceLink(`set=topic&topic=${topic.id}`)} className="topic-row">
                <div>
                  <div className="topic-title">{topic.title}</div>
                  <div className="faint small">
                    {topicSummary.known} of {topicSummary.total} known
                  </div>
                </div>
                <div className="topic-bar">
                  <SummaryBar summary={topicSummary} showLegend={false} />
                </div>
                <span className="btn small">Practise</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="section">
        <div className="section-title">Resources</div>
        {module.resources.map((resource) => (
          <div key={resource.id} className="card">
            <h3>{resource.title}</h3>
            <p className="muted">{resource.description}</p>
            <p className="faint small">
              {resource.questions.length} questions · by {resource.source}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'good' | 'almost' | 'bad' }) {
  return (
    <div className="stat">
      <div className={`stat-value ${tone ?? ''}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
