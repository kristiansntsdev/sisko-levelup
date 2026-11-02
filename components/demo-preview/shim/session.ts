'use client'
/* eslint-disable @typescript-eslint/no-unused-vars */
// Stand-in for next-auth/react inside /demo-preview. Same call shapes the real pages use
// (useSession().data.user.idPeserta, update(), signIn('google'), signOut()), backed by the demo db session.
import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { getDb, mutate, snapshot, subscribe } from '../db'

export type DemoSessionUser = {
  idPeserta?: number
  email?: string | null
  name?: string | null
  needsRegistration?: boolean
  authUserId?: string
}
export type DemoSession = { user: DemoSessionUser }

export function readSession(): DemoSession | null {
  const { session, peserta } = getDb()
  if (session.idPeserta) {
    const p = peserta.find((x) => x.id_peserta === session.idPeserta)
    if (p) return { user: { idPeserta: p.id_peserta, email: p.email, name: p.nama, needsRegistration: false, authUserId: `demo-${p.id_peserta}` } }
  }
  if (session.google) {
    return { user: { email: session.google.email, name: session.google.name, needsRegistration: true, authUserId: 'demo-google-new' } }
  }
  return null
}

const getServerSnapshot = () => null

export function useSession() {
  const db = useSyncExternalStore(subscribe, snapshot, getServerSnapshot)
  const key = db ? JSON.stringify(readSession()) : ''
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo<DemoSession | null>(() => (key ? (JSON.parse(key) as DemoSession) : null), [key])
  const status: 'loading' | 'authenticated' | 'unauthenticated' = !db ? 'loading' : data ? 'authenticated' : 'unauthenticated'
  const update = useCallback(async (_data?: unknown) => readSession(), [])
  return { data, status, update }
}

export function demoSignIn(provider: string, opts?: { callbackUrl?: string }) {
  if (provider === 'google') {
    const cb = encodeURIComponent(opts?.callbackUrl ?? '/demo-preview/dashboard')
    window.location.assign(`/demo-preview/login?google=1&callbackUrl=${cb}`)
  }
  return Promise.resolve({ ok: true, error: null as string | null })
}
export { demoSignIn as signIn }

export async function signOut(opts?: { callbackUrl?: string }) {
  mutate((d) => {
    d.session.idPeserta = null
    d.session.google = null
  })
  if (opts?.callbackUrl) window.location.assign(opts.callbackUrl)
}
