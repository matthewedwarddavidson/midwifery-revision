import { Link } from 'react-router'
import { Account } from '../components/Account'
import { Icon } from '../components/Icon'
import { SummaryBar } from '../components/SummaryBar'
import { MODULES, moduleQuestions } from '../content'
import { summarise } from '../lib/stats'
import { useRecords } from '../lib/useRecords'
import { useSyncStatus } from '../lib/sync'

function greeting(name: string | undefined): string {
  const hour = new Date().getHours()
  const partOfDay = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = name?.split(' ')[0]
  return firstName ? `${partOfDay}, ${firstName}` : partOfDay
}

export function Home() {
  const records = useRecords()
  const { user } = useSyncStatus()
  return (
    <div className="page">
      <header className="page-header">
        <div className="eyebrow">Midwifery revision</div>
        <h1>{greeting(user?.name)}</h1>
        <p>Pick a module to practise. Questions you get wrong come back until you know them.</p>
      </header>

      <Account compact />

      <div className="section">
        <div className="section-title">Modules</div>
        <div className="grid two">
          {MODULES.map((module) => {
            const summary = summarise(moduleQuestions(module), records)
            return (
              <div key={module.id} className="card module-card">
                <Link to={`/m/${module.id}`} className="module-card-link">
                  <span className="pill accent">{module.code}</span>
                  <h2>{module.title}</h2>
                  <p className="muted">{module.description}</p>
                </Link>
                <SummaryBar summary={summary} />
                <div className="row">
                  <Link to={`/m/${module.id}/practice?set=focus`} className="btn primary">
                    <Icon name="target" /> Practise 10
                  </Link>
                  {summary.missed > 0 && (
                    <Link to={`/m/${module.id}/practice?set=missed`} className="btn">
                      <Icon name="repeat" /> {summary.missed} missed
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
