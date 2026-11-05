// Firebase for optional sign-in and sync. Config comes from VITE_FIREBASE_* variables.
// These are publishable web keys: Firestore security rules, not secrecy, protect the data.
// Without them the app runs local-only and hides sign-in.
// The SDK is loaded with import() so people who never sign in never download it.

import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
}

function readConfig(): FirebaseConfig | undefined {
  const env = import.meta.env
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }
  return Object.values(config).every(Boolean) ? (config as FirebaseConfig) : undefined
}

const config = readConfig()

export function isFirebaseConfigured(): boolean {
  return config !== undefined
}

let appPromise: Promise<FirebaseApp> | undefined
let authPromise: Promise<Auth> | undefined
let dbPromise: Promise<Firestore> | undefined

function getApp(): Promise<FirebaseApp> {
  if (!config) return Promise.reject(new Error('Firebase is not configured.'))
  appPromise ??= import('firebase/app').then(({ initializeApp }) => initializeApp(config))
  return appPromise
}

export function getFirebaseAuth(): Promise<Auth> {
  authPromise ??= Promise.all([import('firebase/auth'), getApp()]).then(([{ getAuth }, app]) => getAuth(app))
  return authPromise
}

export function getFirebaseDb(): Promise<Firestore> {
  dbPromise ??= Promise.all([import('firebase/firestore'), getApp()]).then(([{ getFirestore }, app]) =>
    getFirestore(app),
  )
  return dbPromise
}
