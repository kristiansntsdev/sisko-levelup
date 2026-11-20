import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Gerbang password untuk /pengumuman (kirim push manual), dibandingkan ke PENGUMUMAN_PASSWORD (env), terpisah dari
 * login pengurus. Pola sama dengan lib/logs-auth.ts: cookie ditandatangani HMAC-SHA256 (key = password), 8 jam,
 * kosong di env = tertutup (fail closed).
 */
export const PENGUMUMAN_COOKIE = 'pengumuman_session'
const TTL_MS = 8 * 60 * 60 * 1000

function sign(expiry: number, secret: string): string {
  return createHmac('sha256', secret).update(`pengumuman:${expiry}`).digest('hex')
}

export function makePengumumanCookie(): string | null {
  const secret = process.env.PENGUMUMAN_PASSWORD
  if (!secret) return null
  const expiry = Date.now() + TTL_MS
  return `${expiry}.${sign(expiry, secret)}`
}

export function verifyPengumumanCookie(value: string | undefined): boolean {
  const secret = process.env.PENGUMUMAN_PASSWORD
  if (!secret || !value) return false
  const [expiryStr, mac] = value.split('.')
  const expiry = Number(expiryStr)
  if (!Number.isFinite(expiry) || Date.now() > expiry || !mac) return false
  const expected = Buffer.from(sign(expiry, secret), 'hex')
  const actual = Buffer.from(mac, 'hex')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

/** Dipanggil di awal setiap server action pengumuman. */
export async function pengumumanTerbuka(): Promise<boolean> {
  const { cookies } = await import('next/headers')
  return verifyPengumumanCookie((await cookies()).get(PENGUMUMAN_COOKIE)?.value)
}

/** Perbandingan password tanpa bocor lewat waktu. */
export function passwordCocok(input: string): boolean {
  const secret = process.env.PENGUMUMAN_PASSWORD
  if (!secret) return false
  const a = createHmac('sha256', 'cmp').update(input).digest()
  const b = createHmac('sha256', 'cmp').update(secret).digest()
  return timingSafeEqual(a, b)
}
