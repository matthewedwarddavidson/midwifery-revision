import { useEffect, useState } from 'react'
import { prepareSignIn, signIn, signOut, syncNow, useSyncStatus } from '../lib/sync'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

/** Sign-in and sync status. Hidden when the site was built without Firebase settings. */
export function Account({ compact = false }: { compact?: boolean }) {
  const status = useSyncStatus()
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (status.available && !status.user) void prepareSignIn()
  }, [status.available, status.user])

  if (!status.available) return null

  async function handleSignIn() {
    setError(undefined)
    try {
      await signIn()
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : String(signInError))
    }
  }

  if (!status.user) {
    if (compact && status.phase === 'signed-out')
      return (
        <div className="card row between">
          <span className="muted">Sign in to keep your progress on every device.</span>
          <button className="btn primary" onClick={handleSignIn}>
            Sign in with Google
          </button>
        </div>
      )
    return (
      <div className="stack">
        <p className="muted">Sign in to keep your progress on your phone, tablet and laptop.</p>
        <div>
          <button className="btn primary" onClick={handleSignIn}>
            Sign in with Google
          </button>
        </div>
        {error && <p className="bad-text small">{error}</p>}
      </div>
    )
  }

  if (compact) return null

  return (
    <div className="stack">
      <p>
        Signed in as <strong>{status.user.name || status.user.email}</strong>
        {status.user.name && <span className="muted"> ({status.user.email})</span>}
      </p>
      <p className="muted small">
        {status.phase === 'syncing' && 'Syncing…'}
        {status.phase === 'synced' && status.lastSyncedAt && `Synced at ${formatTime(status.lastSyncedAt)}`}
        {status.phase === 'error' && <span className="bad-text">Sync failed: {status.error}</span>}
      </p>
      <div className="row">
        <button className="btn" onClick={() => void syncNow()}>
          Sync now
        </button>
        <button className="btn ghost" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </div>
  )
}
