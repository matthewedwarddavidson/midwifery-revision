import { useState } from 'react'
import { Link } from 'react-router'
import { Account } from '../components/Account'
import { resetProgress, updateSettings, useAppState, type Theme } from '../lib/store'
import { deleteAccount, useSyncStatus } from '../lib/sync'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Match device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function Settings() {
  const { settings } = useAppState()
  const { available, user } = useSyncStatus()

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

      {user && <DeleteAccount />}

      <div className="card">
        <h3>Privacy</h3>
        <p className="muted">
          What's stored when you sign in, and how to delete it: <Link to="/privacy">privacy note</Link>.
        </p>
      </div>
    </div>
  )
}

/**
 * Two steps on the page rather than window.confirm: Google's sign-in popup must open straight from a click,
 * and browsers can block it if a confirm dialog sat open first.
 */
function DeleteAccount() {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function handleDelete() {
    setBusy(true)
    setError(undefined)
    try {
      await deleteAccount()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : String(deleteError))
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <h3>Delete account</h3>
      <p className="muted">
        Deletes your account, your synced progress and everything saved on this device. Google will ask you to sign in
        once more to confirm it's you.
      </p>
      {confirming ? (
        <div className="row">
          <button className="btn danger-solid" onClick={handleDelete} disabled={busy}>
            {busy ? 'Deleting…' : 'Yes, delete everything'}
          </button>
          <button className="btn ghost" onClick={() => setConfirming(false)} disabled={busy}>
            Cancel
          </button>
        </div>
      ) : (
        <button className="btn danger" onClick={() => setConfirming(true)}>
          Delete my account and data
        </button>
      )}
      {error && <p className="bad-text small">{error}</p>}
    </div>
  )
}
