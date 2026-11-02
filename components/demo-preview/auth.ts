'use client'
import { addLog, DEMO_ACCOUNTS, getDb, mutate, normalizePhone, type DemoAccount } from './db'

export const DEMO_HOME = '/demo-preview/dashboard'
export const DEMO_ALK = '/demo-preview/dashboard/v2/kota/alk'

/** Match by email, or by phone digits (0812-0000-0001 / 081200000001 / +62...). */
export function findAccount(identifier: string): DemoAccount | null {
  const id = identifier.trim().toLowerCase()
  if (!id) return null
  const byEmail = DEMO_ACCOUNTS.find((a) => a.email === id)
  if (byEmail) return byEmail
  const digits = normalizePhone(identifier).replace(/^62/, '0')
  return digits.length >= 8 ? (DEMO_ACCOUNTS.find((a) => normalizePhone(a.phone) === digits) ?? null) : null
}

/** Signs the demo account in and returns where to go next. */
export function loginAs(account: DemoAccount, callbackUrl = DEMO_HOME): string {
  const d = getDb()
  if (account.kind === 'pengurus') {
    const p = d.pengurus.find((x) => x.username === account.email)
    if (!p) return '/demo-preview/login'
    mutate((x) => {
      x.session = { idPeserta: null, idPengurus: p.id_pengurus, google: null }
      addLog(x, `${p.nama} masuk`)
    })
    return DEMO_ALK
  }
  const p = d.peserta.find((x) => x.email === account.email)
  if (p) {
    mutate((x) => {
      x.session = { idPeserta: p.id_peserta, idPengurus: null, google: null }
      addLog(x, `${p.nama} masuk`)
    })
    return callbackUrl
  }
  // Google account with no peserta row yet: real flow lands on /daftar to complete registration.
  mutate((x) => {
    x.session = { idPeserta: null, idPengurus: null, google: { email: account.email, name: 'Akun Google Baru' } }
  })
  return '/demo-preview/daftar?step=form'
}

export function logoutAll() {
  mutate((d) => {
    d.session = { idPeserta: null, idPengurus: null, google: null }
  })
}
