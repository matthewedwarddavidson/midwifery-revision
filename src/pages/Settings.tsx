import { Account } from '../components/Account'
import { resetProgress, updateSettings, useAppState, type Theme } from '../lib/store'
import { useSyncStatus } from '../lib/sync'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Match device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function Settings() {
  const { settings } = useAppState()
  const { available } = useSyncStatus()

  function confirmReset() {
    if (window.confirm('Clear all your answers and rounds on every device? This cannot be undone.')) resetProgress()
  }

  return (
    <div className="page narrow">
      <header className="page-header">
        <h1>Settings</h1>
      </header>

      {available && (
        <div className="card">
          <h3>Account</h3>
          <Account />
        </div>
      )}

      <div className="card">
        <h3>Appearance</h3>
        <div className="chips">
          {THEMES.map((theme) => (
            <button
              key={theme.value}
              className={`chip ${settings.theme === theme.value ? 'active' : ''}`}
              onClick={() => updateSettings({ theme: theme.value })}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Practice</h3>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.shuffleQuestions}
            onChange={(event) => updateSettings({ shuffleQuestions: event.target.checked })}
          />
          Shuffle question order
        </label>
      </div>

      <div className="card">
        <h3>Reset</h3>
        <p className="muted">Start again from scratch. Clears your answers and rounds everywhere you're signed in.</p>
        <button className="btn danger" onClick={confirmReset}>
          Clear progress
        </button>
      </div>
    </div>
  )
}
