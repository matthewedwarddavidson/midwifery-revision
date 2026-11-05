// Optional sync across devices. Progress stays in localStorage as before; when signed in,
// it is also merged with a copy in Firestore under users/{uid}/midwifery-revision/.
// The copy is gzipped JSON split into chunks, as years of answers could exceed Firestore's 1 MiB document limit.

import { useSyncExternalStore } from 'react'
import type { Auth, User } from 'firebase/auth'
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from './firebase'
import { mergeStates } from './merge'
import { applySynced, clearLocalData, getState, subscribeToState, withDefaults, type AppState } from './store'

const CHUNK_BYTES = 900_000
const PUSH_DELAY_MS = 5000
/** Set while signed in, so people who never sign in don't load Firebase at all. */
const SIGNED_IN_KEY = 'midwifery-revision:signed-in'

export interface SyncStatus {
  available: boolean
  user?: { name: string; email: string }
  phase: 'signed-out' | 'syncing' | 'synced' | 'error'
  lastSyncedAt?: string
  error?: string
}

let status: SyncStatus = { available: isFirebaseConfigured(), phase: 'signed-out' }
const listeners = new Set<() => void>()
let currentUser: User | undefined
let lastSyncedUpdate: string | undefined
let pushTimer: ReturnType<typeof setTimeout> | undefined
let syncing: Promise<void> | undefined
/** Set while deleting an account, so sync can't write back the data being deleted. */
let deleting = false

function setStatus(changes: Partial<SyncStatus>) {
  status = { ...status, ...changes }
  listeners.forEach((listener) => listener())
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => status,
  )
}

async function compress(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function decompress(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).text()
}

/** JSON with object keys sorted, so two equal states always compare equal. */
function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item,
  )
}

function folder(uid: string) {
  return `users/${uid}/midwifery-revision`
}

async function readRemote(uid: string): Promise<AppState | undefined> {
  const [{ doc, getDoc }, db] = await Promise.all([import('firebase/firestore'), getFirebaseDb()])
  const meta = await getDoc(doc(db, folder(uid), 'meta'))
  if (!meta.exists()) return undefined
  const { chunks } = meta.data() as { chunks: number }
  const parts = await Promise.all(
    Array.from({ length: chunks }, (_, index) => getDoc(doc(db, folder(uid), `chunk-${index}`))),
  )
  const bytes = parts.map((part) => (part.get('data') as { toUint8Array(): Uint8Array }).toUint8Array())
  const joined = new Uint8Array(bytes.reduce((total, part) => total + part.length, 0))
  let offset = 0
  for (const part of bytes) {
    joined.set(part, offset)
    offset += part.length
  }
  return withDefaults(JSON.parse(await decompress(joined)))
}

async function writeRemote(uid: string, state: AppState) {
  const [{ Bytes, doc, writeBatch }, db] = await Promise.all([import('firebase/firestore'), getFirebaseDb()])
  const bytes = await compress(JSON.stringify(state))
  const batch = writeBatch(db)
  const chunks = Math.max(1, Math.ceil(bytes.length / CHUNK_BYTES))
  for (let index = 0; index < chunks; index++) {
    const part = bytes.slice(index * CHUNK_BYTES, (index + 1) * CHUNK_BYTES)
    batch.set(doc(db, folder(uid), `chunk-${index}`), { data: Bytes.fromUint8Array(part) })
  }
  batch.set(doc(db, folder(uid), 'meta'), { chunks, updatedAt: state.updatedAt ?? '' })
  await batch.commit()
}

/** Pulls the copy in the cloud, merges it with this device's progress, and saves the result in both places. */
export function syncNow(): Promise<void> {
  if (!currentUser || deleting) return Promise.resolve()
  syncing ??= runSync(currentUser.uid).finally(() => {
    syncing = undefined
  })
  return syncing
}

async function runSync(uid: string) {
  setStatus({ phase: 'syncing', error: undefined })
  try {
    const remote = await readRemote(uid)
    const local = getState()
    const merged = remote ? mergeStates(local, remote) : local
    const mergedJson = stableJson(merged)
    lastSyncedUpdate = merged.updatedAt
    if (mergedJson !== stableJson(local)) applySynced(merged)
    if (!remote || mergedJson !== stableJson(remote)) await writeRemote(uid, merged)
    setStatus({ phase: 'synced', lastSyncedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Sync failed', error)
    setStatus({ phase: 'error', error: error instanceof Error ? error.message : String(error) })
  }
}

function schedulePush() {
  if (!currentUser || deleting || getState().updatedAt === lastSyncedUpdate) return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(syncNow, PUSH_DELAY_MS)
}

type AuthModule = typeof import('firebase/auth')
let preparedAuth: { module: AuthModule; auth: Auth } | undefined

/** Loads Firebase ahead of a sign-in click: browsers block popups opened after a delay. */
export async function prepareSignIn() {
  const [module, auth] = await Promise.all([import('firebase/auth'), getFirebaseAuth()])
  preparedAuth = { module, auth }
}

export async function signIn() {
  if (!preparedAuth) await prepareSignIn()
  const { module, auth } = preparedAuth!
  await module.signInWithPopup(auth, new module.GoogleAuthProvider())
  rememberSignedIn(true)
  await watchAuth()
}

export async function signOut() {
  const [{ signOut: firebaseSignOut }, auth] = await Promise.all([import('firebase/auth'), getFirebaseAuth()])
  await firebaseSignOut(auth)
  rememberSignedIn(false)
}

async function deleteRemote(uid: string) {
  const [{ collection, getDocs, writeBatch }, db] = await Promise.all([import('firebase/firestore'), getFirebaseDb()])
  const documents = await getDocs(collection(db, folder(uid)))
  const batch = writeBatch(db)
  documents.forEach((document) => batch.delete(document.ref))
  await batch.commit()
}

/**
 * Deletes this person's synced progress and their account, then clears this device.
 * Google asks them to sign in again first, as deleting an account needs a recent sign-in.
 */
export async function deleteAccount() {
  if (!currentUser) return
  if (!preparedAuth) await prepareSignIn()
  const { module } = preparedAuth!
  const user = currentUser
  await module.reauthenticateWithPopup(user, new module.GoogleAuthProvider())
  deleting = true
  clearTimeout(pushTimer)
  try {
    // Let a sync that's already running finish, so it can't recreate the data afterwards.
    await syncing
    await deleteRemote(user.uid)
    await module.deleteUser(user)
    currentUser = undefined
    rememberSignedIn(false)
    clearLocalData()
  } finally {
    deleting = false
  }
}

function rememberSignedIn(signedIn: boolean) {
  try {
    if (signedIn) localStorage.setItem(SIGNED_IN_KEY, '1')
    else localStorage.removeItem(SIGNED_IN_KEY)
  } catch {
    // Without storage, sign-in still works for this visit.
  }
}

export function wasSignedIn(): boolean {
  try {
    return localStorage.getItem(SIGNED_IN_KEY) === '1'
  } catch {
    return false
  }
}

/** Resumes sync on load if you signed in before. */
export function startSync() {
  if (isFirebaseConfigured() && wasSignedIn()) void watchAuth()
}

let watching = false

async function watchAuth() {
  if (watching) return
  watching = true
  const [{ onAuthStateChanged }, auth] = await Promise.all([import('firebase/auth'), getFirebaseAuth()])
  onAuthStateChanged(auth, (user) => {
    currentUser = user ?? undefined
    if (!user) {
      setStatus({ phase: 'signed-out', user: undefined })
      return
    }
    setStatus({ user: { name: user.displayName ?? '', email: user.email ?? '' } })
    void syncNow()
  })
  subscribeToState(schedulePush)
  document.addEventListener('visibilitychange', () => {
    // Coming back pulls changes from other devices; leaving pushes this one's.
    if (currentUser) void syncNow()
  })
}
