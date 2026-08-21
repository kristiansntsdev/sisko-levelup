/** Online self-absen opens 15 minutes before jam selesai; stays open while tiket bulan ini still shows (end of month). */
export const ONLINE_ABSEN_OPEN_BEFORE_END_MS = 15 * 60 * 1000

/** Parse "HH:mm" / "H:mm" / "HH.mm" / "HH:mm:ss" → { h, m } or null. */
export function parseJam(jam: string): { h: number; m: number } | null {
  const m = jam.trim().match(/^(\d{1,2})[:.](\d{2})/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return { h, m: min }
}

/** Combine DATE + jam string into local Date. */
export function eventDateTime(date: Date, jam: string): Date | null {
  const parsed = parseJam(jam)
  if (!parsed) return null
  const d = new Date(date)
  d.setHours(parsed.h, parsed.m, 0, 0)
  return d
}

export function getOnlineAbsenWindow(endAt: Date): { opensAt: Date; closesAt: Date } {
  // ponytail: closes end-of-month so "tiket aktif bulan ini" masih bisa absen kalau lupa
  const closesAt = new Date(endAt.getFullYear(), endAt.getMonth() + 1, 0, 23, 59, 59, 999)
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
  const end = new Date('2026-08-21T20:00:00')
  const { opensAt, closesAt } = getOnlineAbsenWindow(end)
  console.assert(opensAt.getTime() === new Date('2026-08-21T19:45:00').getTime(), 'opens 15m before end')
  console.assert(closesAt.getTime() === new Date(2026, 7, 31, 23, 59, 59, 999).getTime(), 'closes end of month')
  console.assert(isOnlineAbsenOpen(new Date('2026-08-21T19:45:00'), end), 'open at window start')
  console.assert(isOnlineAbsenOpen(new Date('2026-08-25T12:00:00'), end), 'open after jam selesai same month')
  console.assert(!isOnlineAbsenOpen(new Date('2026-08-21T19:44:59'), end), 'closed before window')
  console.assert(!isOnlineAbsenOpen(new Date('2026-09-01T00:00:00'), end), 'closed next month')
  console.assert(parseJam('19:45')?.h === 19 && parseJam('19:45')?.m === 45, 'parseJam colon')
  console.assert(parseJam('19.00')?.m === 0, 'parseJam dot')
}
