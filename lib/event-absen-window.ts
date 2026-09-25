/**
 * Jendela absen mandiri event Online.
 *
 * Semua jadwal event (`tglevent`, `jamevent`, …) adalah waktu dinding WIB:
 * kolom DATE disimpan sebagai UTC midnight (lihat `isoDate`/`parseLocalDate`
 * di `event-sesi.ts`) dan jam disimpan sebagai string "HH:mm" WIB.
 *
 * Perhitungan di bawah eksplisit WIB, bukan waktu lokal proses — server
 * Vercel jalan UTC sementara HP peserta WIB, dan `setHours()` akan bikin
 * keduanya beda 7 jam.
 */

import { WIB_OFFSET_MS } from '@/lib/wib'

/** Absen dibuka 15 menit sebelum jam selesai; tetap terbuka sampai akhir bulan. */
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

/**
 * Gabung kolom DATE (UTC midnight) + jam WIB jadi satu instant.
 * Komponen tanggal dibaca sebagai UTC supaya tidak geser di server non-WIB.
 */
export function eventDateTime(date: Date, jam: string): Date | null {
  const parsed = parseJam(jam)
  if (!parsed) return null
  const wallClock = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    parsed.h,
    parsed.m,
  )
  return new Date(wallClock - WIB_OFFSET_MS)
}

export function getOnlineAbsenWindow(endAt: Date): { opensAt: Date; closesAt: Date } {
  // ponytail: tutup akhir bulan WIB supaya "tiket aktif bulan ini" masih bisa
  // absen kalau lupa — bulan dihitung dari kalender WIB, bukan kalender UTC.
  const wib = new Date(endAt.getTime() + WIB_OFFSET_MS)
  const startOfNextMonth = Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth() + 1, 1)
  return {
    opensAt: new Date(endAt.getTime() - ONLINE_ABSEN_OPEN_BEFORE_END_MS),
    closesAt: new Date(startOfNextMonth - WIB_OFFSET_MS - 1),
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

// ponytail: assert-based self-check — fails loud if window math drifts.
// Semua ekspektasi ditulis sebagai instant UTC supaya test ini sendiri tidak
// bergantung pada TZ mesin yang menjalankannya.
if (process.env.NODE_ENV !== 'production') {
  const tglSelesai = new Date(Date.UTC(2026, 7, 21)) // kolom DATE: 21 Agu 2026
  const end = eventDateTime(tglSelesai, '20:00')! // 20:00 WIB = 13:00 UTC
  console.assert(end.toISOString() === '2026-08-21T13:00:00.000Z', 'jam selesai WIB → UTC')

  const { opensAt, closesAt } = getOnlineAbsenWindow(end)
  console.assert(opensAt.toISOString() === '2026-08-21T12:45:00.000Z', 'buka 15 menit sebelum selesai')
  console.assert(closesAt.toISOString() === '2026-08-31T16:59:59.999Z', 'tutup akhir bulan WIB')

  console.assert(isOnlineAbsenOpen(opensAt, end), 'open tepat di awal jendela')
  console.assert(!isOnlineAbsenOpen(new Date(opensAt.getTime() - 1), end), 'closed 1ms sebelum buka')
  console.assert(isOnlineAbsenOpen(closesAt, end), 'open tepat di akhir jendela')
  console.assert(!isOnlineAbsenOpen(new Date(closesAt.getTime() + 1), end), 'closed 1ms setelah tutup')
  console.assert(isOnlineAbsenOpen(new Date('2026-08-25T05:00:00Z'), end), 'open setelah acara, bulan sama')

  // Akhir bulan WIB, bukan UTC: 1 Sep 2026 06:00 WIB sudah lewat jendela
  // walau di UTC masih 31 Agu.
  console.assert(!isOnlineAbsenOpen(new Date('2026-08-31T23:00:00Z'), end), 'closed di 1 Sep WIB (31 Agu UTC)')

  // Event tengah malam WIB tidak boleh mundur sehari.
  const midnight = eventDateTime(new Date(Date.UTC(2026, 7, 21)), '00:30')!
  console.assert(midnight.toISOString() === '2026-08-20T17:30:00.000Z', '00:30 WIB = 17:30 UTC hari sebelumnya')

  console.assert(onlineAbsenPhase(new Date(opensAt.getTime() - 1), end) === 'too_early', 'phase too_early')
  console.assert(onlineAbsenPhase(opensAt, end) === 'open', 'phase open')
  console.assert(onlineAbsenPhase(new Date(closesAt.getTime() + 1), end) === 'closed', 'phase closed')
  console.assert(onlineAbsenPhase(new Date(), null) === 'unknown', 'phase unknown')

  console.assert(parseJam('19:45')?.h === 19 && parseJam('19:45')?.m === 45, 'parseJam colon')
  console.assert(parseJam('19.00')?.m === 0, 'parseJam dot')
  console.assert(parseJam('bukan jam') === null, 'parseJam invalid')
}
