/**
 * Aturan push yang murni (tanpa DB, aman di client): siapa melihat event apa, ulang tahun, jendela waktu.
 * Semua waktu eksplisit WIB (lihat lib/wib.ts), bukan zona proses.
 */
import { NASIONAL_EVENT_CABANG, NASIONAL_MIN_USERLEVEL } from '@/lib/event-cabang'
import { WIB_OFFSET_MS } from '@/lib/wib'

export const MAKS_NAMA_ULTAH = 25

/** Jam (0-23) dan tanggal WIB dari sebuah instant. */
export function wibJam(now: Date): number {
  return new Date(now.getTime() + WIB_OFFSET_MS).getUTCHours()
}

/** yyyy-mm-dd kalender WIB. */
export function wibIso(now: Date): string {
  return new Date(now.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10)
}

/** Bulan + tanggal dari peserta.tgllahir (ISO atau d/m/yyyy). Null kalau bukan keduanya. */
export function dobBulanTanggal(raw: string): { m: number; d: number } | null {
  const s = (raw ?? '').trim()
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  const legacy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  const [mo, d] = iso ? [iso[2], iso[3]] : legacy ? [legacy[2], legacy[1]] : []
  if (!mo || !d) return null
  const m = Number(mo)
  const day = Number(d)
  if (m < 1 || m > 12 || day < 1 || day > 31) return null
  return { m, d: day }
}

function kabisat(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

/** Ulang tahun hari ini (WIB)? 29 Feb dirayakan 28 Feb di tahun non-kabisat. */
export function ultahHariIni(tgllahir: string, now: Date): boolean {
  const dob = dobBulanTanggal(tgllahir)
  if (!dob) return false
  const [y, m, d] = wibIso(now).split('-').map(Number)
  if (dob.m === 2 && dob.d === 29 && !kabisat(y)) return m === 2 && d === 28
  return dob.m === m && dob.d === d
}

/** Event yang dilihat peserta di daftar event: kotanya + nasional (cabang 0); wwtype nasional hanya Core ke atas. Level 5 melihat semua. */
export function pesertaLihatEvent(
  p: { userlevel: string; kotalevelup: string },
  e: { id_cabang: string; wwtype: string },
): boolean {
  const level = Number(p.userlevel)
  if (level >= 5) return true
  if (e.wwtype === 'nasional' && !(level >= NASIONAL_MIN_USERLEVEL)) return false
  return e.id_cabang === NASIONAL_EVENT_CABANG || e.id_cabang === String(Number(p.kotalevelup))
}

/** "A, B, C" maksimal MAKS_NAMA_ULTAH nama lalu "+N lainnya". */
export function daftarNama(names: string[]): string {
  const tampil = names.slice(0, MAKS_NAMA_ULTAH)
  const sisa = names.length - tampil.length
  return tampil.join(', ') + (sisa > 0 ? ` +${sisa} lainnya` : '')
}

export type JendelaJob = 'ultah' | 'acara-hari-ini' | 'ingat-h1' | 'air'

/** Jendela jam WIB (mulai inklusif, akhir eksklusif) tiap job harian. Tick yang telat tetap dikirim selama jendela buka. */
export const JENDELA: Record<JendelaJob, [number, number]> = {
  ultah: [7, 12],
  'acara-hari-ini': [6, 10],
  'ingat-h1': [18, 21],
  air: [9, 12],
}

export function jendelaBuka(job: JendelaJob, now: Date): boolean {
  const [a, b] = JENDELA[job]
  const h = wibJam(now)
  return h >= a && h < b
}

/** Pengingat hari-H: dari 2 jam sebelum mulai sampai mulai. */
export const INGAT_H0_MS = 2 * 60 * 60 * 1000

export function ingatH0Aktif(mulai: Date | null, now: Date): boolean {
  if (!mulai) return false
  const t = now.getTime()
  return t >= mulai.getTime() - INGAT_H0_MS && t < mulai.getTime()
}

/** Tanggal (WIB, yyyy-mm-dd) besok dari instant. */
export function wibBesokIso(now: Date): string {
  return wibIso(new Date(now.getTime() + 24 * 60 * 60 * 1000))
}
