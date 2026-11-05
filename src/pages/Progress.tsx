import { Link } from 'react-router'
import { SummaryBar } from '../components/SummaryBar'
import { findModule, MODULES, moduleQuestions } from '../content'
import { summarise } from '../lib/stats'
import { useAppState } from '../lib/store'
import { useRecords } from '../lib/useRecords'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Progress() {
  const { attempts, sessions } = useAppState()
  const records = useRecords()
  const correct = attempts.filter((attempt) => attempt.correct).length
  const accuracy = attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0
  const recentSessions = [...sessions].reverse().slice(0, 20)

  return (
    <div className="page">
      <header className="page-header">
        <h1>Progress</h1>
      </header>

      <div className="card stats">
        <div className="stat">
          <div className="stat-value">{attempts.length}</div>
          <div className="stat-label">Answers</div>
        </div>
        <div className="stat">
          <div className="stat-value">{accuracy}%</div>
          <div className="stat-label">Correct</div>
        </div>
        <div className="stat">
          <div className="stat-value">{sessions.length}</div>
          <div className="stat-label">Rounds</div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Modules</div>
        <div className="stack">
          {MODULES.map((module) => (
            <Link key={module.id} to={`/m/${module.id}`} className="card card-link stack">
              <strong>
                {module.code}: {module.title}
              </strong>
              <SummaryBar summary={summarise(moduleQuestions(module), records)} />
            </Link>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">Recent rounds</div>
        {recentSessions.length === 0 ? (
          <p className="muted">No rounds yet.</p>
        ) : (
          <div className="card session-list">
            {recentSessions.map((session) => (
              <div key={session.id} className="session-row">
                <div>
                  <div>{session.label}</div>
                  <div className="faint small">
                    {findModule(session.moduleId)?.code} · {formatDate(session.finishedAt)}
                  </div>
                </div>
                <strong>
                  {session.correct}/{session.total}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
