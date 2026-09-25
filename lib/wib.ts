/**
 * Konvensi tanggal WIB.
 *
 * Kolom `@db.Date` (`tglevent`, `tgleventselesai`, `event_sesi.tanggal`)
 * menyimpan tanggal kalender WIB sebagai UTC midnight — lihat `isoDate` /
 * `parseLocalDate` di `event-sesi.ts`. Jadi setiap batas hari/bulan yang mau
 * dibandingkan dengan kolom itu harus UTC midnight juga, bukan tengah malam
 * waktu lokal proses.
 *
 * Helper di sini sengaja tidak memakai `setHours()` / `new Date(y, m, d)`
 * supaya hasilnya sama di server UTC (Vercel) maupun mesin WIB.
 */

/** Offset WIB (Asia/Jakarta, UTC+7). Indonesia tidak punya DST. */
export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

/** Komponen kalender WIB dari sebuah instant. */
function wibParts(now: Date): { y: number; m: number; d: number } {
  const shifted = new Date(now.getTime() + WIB_OFFSET_MS)
  return { y: shifted.getUTCFullYear(), m: shifted.getUTCMonth(), d: shifted.getUTCDate() }
}

/** Tanggal WIB hari ini sebagai UTC midnight — sebanding dengan kolom `@db.Date`. */
export function wibToday(now: Date = new Date()): Date {
  const { y, m, d } = wibParts(now)
  return new Date(Date.UTC(y, m, d))
}

/** Tanggal 1 bulan berjalan WIB sebagai UTC midnight. */
export function wibStartOfMonth(now: Date = new Date()): Date {
  const { y, m } = wibParts(now)
  return new Date(Date.UTC(y, m, 1))
}

/** Tanggal 1 bulan berikutnya WIB sebagai UTC midnight (batas eksklusif). */
export function wibStartOfNextMonth(now: Date = new Date()): Date {
  const { y, m } = wibParts(now)
  return new Date(Date.UTC(y, m + 1, 1))
}

// ponytail: assert-based self-check — batas hari/bulan yang meleset bikin
// tiket hilang dari "Tiket Aktif" atau peserta ditandai absence terlalu cepat.
if (process.env.NODE_ENV !== 'production') {
  // 21 Agu 2026 19:00 WIB = 12:00 UTC — hari yang sama di kedua zona.
  const sore = new Date('2026-08-21T12:00:00Z')
  console.assert(wibToday(sore).toISOString() === '2026-08-21T00:00:00.000Z', 'sore WIB → tanggal WIB')

  // 21 Agu 2026 02:00 WIB = 20 Agu 19:00 UTC — di UTC masih tanggal 20.
  const diniHari = new Date('2026-08-20T19:00:00Z')
  console.assert(wibToday(diniHari).toISOString() === '2026-08-21T00:00:00.000Z', 'dini hari WIB tetap tanggal WIB')

  // 1 Sep 2026 03:00 WIB = 31 Agu 20:00 UTC — bulan WIB sudah September.
  const gantiBulan = new Date('2026-08-31T20:00:00Z')
  console.assert(wibStartOfMonth(gantiBulan).toISOString() === '2026-09-01T00:00:00.000Z', 'bulan WIB, bukan bulan UTC')
  console.assert(wibStartOfNextMonth(gantiBulan).toISOString() === '2026-10-01T00:00:00.000Z', 'bulan berikutnya WIB')

  // Batas akhir tahun.
  const akhirTahun = new Date('2026-12-31T20:00:00Z') // 1 Jan 2027 03:00 WIB
  console.assert(wibToday(akhirTahun).toISOString() === '2027-01-01T00:00:00.000Z', 'lintas tahun')
  console.assert(wibStartOfNextMonth(akhirTahun).toISOString() === '2027-02-01T00:00:00.000Z', 'lintas tahun, bulan berikutnya')
}
