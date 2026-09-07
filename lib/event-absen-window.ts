/** Online self-absen: jam event diinterpretasi WIB; buka 15 menit sebelum selesai, tutup akhir bulan WIB. */
export const ONLINE_ABSEN_OPEN_BEFORE_END_MS = 15 * 60 * 1000
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

/** Parse "HH:mm" / "H:mm" / "HH.mm" / "HH:mm:ss" → { h, m } or null. */
export function parseJam(jam: string): { h: number; m: number } | null {
  const m = jam.trim().match(/^(\d{1,2})[:.](\d{2})/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return { h, m: min }
}

/**
 * Combine @db.Date (UTC midnight of calendar day) + jam string as WIB wall time.
 * Avoids setHours() which follows the runtime timezone (Vercel=UTC ≠ WIB).
 */
export function eventDateTime(date: Date, jam: string): Date | null {
  const parsed = parseJam(jam)
  if (!parsed) return null
  const y = date.getUTCFullYear()
  const mo = date.getUTCMonth()
  const day = date.getUTCDate()
  return new Date(Date.UTC(y, mo, day, parsed.h, parsed.m, 0, 0) - WIB_OFFSET_MS)
}

export function getOnlineAbsenWindow(endAt: Date): { opensAt: Date; closesAt: Date } {
  // ponytail: closes end-of-month WIB so "tiket aktif bulan ini" masih bisa absen kalau lupa
  const wibWall = new Date(endAt.getTime() + WIB_OFFSET_MS)
  const y = wibWall.getUTCFullYear()
  const m = wibWall.getUTCMonth()
  // last calendar day of month 23:59:59.999 WIB
  const closesAt = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999) - WIB_OFFSET_MS)
  return {
    opensAt: new Date(endAt.getTime() - ONLINE_ABSEN_OPEN_BEFORE_END_MS),
    closesAt,
  }
}

export function isOnlineAbsenOpen(now: Date, endAt: Date): boolean {
  const { opensAt, closesAt } = getOnlineAbsenWindow(endAt)
  return now.getTime() >= opensAt.getTime() && now.getTime() <= closesAt.getTime()
}

export type OnlineAbsenPhase = 'too_early' | 'open' | 'closed' | 'unknown'

export function onlineAbsenPhase(now: Date, endAt: Date | null): OnlineAbsenPhase {
  if (!endAt) return 'unknown'
  const { opensAt, closesAt } = getOnlineAbsenWindow(endAt)
  const t = now.getTime()
  if (t < opensAt.getTime()) return 'too_early'
  if (t > closesAt.getTime()) return 'closed'
  return 'open'
}

// ponytail: assert-based self-check — fails loud if window math drifts
if (process.env.NODE_ENV !== 'production') {
  const end = eventDateTime(new Date(Date.UTC(2026, 7, 21)), '20:00')!
  const { opensAt, closesAt } = getOnlineAbsenWindow(end)
  const openExpected = eventDateTime(new Date(Date.UTC(2026, 7, 21)), '19:45')!
  const closeExpected = new Date(Date.UTC(2026, 7, 31, 23, 59, 59, 999) - WIB_OFFSET_MS)
  console.assert(opensAt.getTime() === openExpected.getTime(), 'opens 15m before end WIB')
  console.assert(closesAt.getTime() === closeExpected.getTime(), 'closes end of month WIB')
  console.assert(isOnlineAbsenOpen(openExpected, end), 'open at window start')
  console.assert(
    isOnlineAbsenOpen(eventDateTime(new Date(Date.UTC(2026, 7, 25)), '12:00')!, end),
    'open after jam selesai same month',
  )
  console.assert(
    !isOnlineAbsenOpen(new Date(openExpected.getTime() - 1), end),
    'closed before window',
  )
  console.assert(
    !isOnlineAbsenOpen(new Date(Date.UTC(2026, 8, 1, 0, 0, 0, 0) - WIB_OFFSET_MS), end),
    'closed next month',
  )
  console.assert(parseJam('19:45')?.h === 19 && parseJam('19:45')?.m === 45, 'parseJam colon')
  console.assert(parseJam('19.00')?.m === 0, 'parseJam dot')
  // Sep 7 21:00 WIB — afternoon same day still too_early
  const townhallEnd = eventDateTime(new Date(Date.UTC(2026, 8, 7)), '21:00')!
  console.assert(
    onlineAbsenPhase(eventDateTime(new Date(Date.UTC(2026, 8, 7)), '16:57')!, townhallEnd) ===
      'too_early',
    'afternoon before 20:45 is too_early',
  )
}
