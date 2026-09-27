import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Gerbang password untuk /logs, dibandingkan ke LOG_PASSWORD (env), terpisah
 * dari login pengurus (app/admin) yang dibanding ke DB. Cookie sesinya
 * ditandatangani (HMAC-SHA256, key = LOG_PASSWORD) — beda dengan cookie
 * pengurus_id yang cuma angka polos — karena halaman ini bisa menampilkan
 * detail approval/keuangan yang lebih sensitif.
 */
export const LOGS_COOKIE = 'logs_session'
const TTL_MS = 8 * 60 * 60 * 1000 // 8 jam, samakan dengan cookie pengurus_id

function sign(expiry: number, secret: string): string {
  return createHmac('sha256', secret).update(String(expiry)).digest('hex')
}

/** null kalau LOG_PASSWORD belum di-set di server (fail closed). */
export function makeSessionCookieValue(): string | null {
  const secret = process.env.LOG_PASSWORD
  if (!secret) return null
  const expiry = Date.now() + TTL_MS
  return `${expiry}.${sign(expiry, secret)}`
}

export function verifySessionCookieValue(value: string | undefined): boolean {
  const secret = process.env.LOG_PASSWORD
  if (!secret || !value) return false

  const [expiryStr, mac] = value.split('.')
  const expiry = Number(expiryStr)
  if (!Number.isFinite(expiry) || Date.now() > expiry || !mac) return false

  const expected = Buffer.from(sign(expiry, secret), 'hex')
  const actual = Buffer.from(mac, 'hex')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
