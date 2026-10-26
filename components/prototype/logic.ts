// Pure rules for /prototype. Attendance + online-absen rules reuse sisko's own helpers.
import { eventDateTime, onlineAbsenPhase, type OnlineAbsenPhase } from '@/lib/event-absen-window'
import { hadirPenuh, parseLocalDate, sesiWajibIds } from '@/lib/event-sesi'
import {
  CABANGS, DAY, KOTA, MON, MONTH_FULL, NASIONAL_CABANG, NOW, NOW_HM, NOW_STAMP, TODAY, capW,
  type Absen, type Account, type Ev, type Level, type PosterSpec, type Reg, type Sesi,
} from './data'

// ---------------- Tanggal (string WIB, tanpa TZ browser) ----------------

const ymd = (iso: string) => iso.split('-').map(Number)
export const dd = (iso: string) => iso.slice(8, 10)
export const mon = (iso: string) => MON[ymd(iso)[1] - 1]
export const weekday = (iso: string) => { const [y, m, d] = ymd(iso); return DAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] }
export const fmtShort = (iso: string) => `${+dd(iso)} ${capW(mon(iso))} ${ymd(iso)[0]}`
export const fmtLong = (iso: string) => `${weekday(iso)}, ${fmtShort(iso)}`
const fmtFull = (iso: string) => `${dd(iso)} ${MONTH_FULL[ymd(iso)[1] - 1]} ${ymd(iso)[0]}`
export const fmtStamp = (s: string) => `${fmtShort(s.slice(0, 10))} ${s.slice(11)}`

// "25 Oktober 2026" or "01 November - 22 November 2026" (list card)
export function rangeFull(e: Ev) {
  if (e.tgl === e.tglSelesai) return fmtFull(e.tgl)
  return `${dd(e.tgl)} ${MONTH_FULL[ymd(e.tgl)[1] - 1]} - ${fmtFull(e.tglSelesai)}`
}

// "25 Okt 2026 09:00 - 11:00 (WIB)" (View Event)
export function dayTime(e: Ev) {
  const days = e.tgl === e.tglSelesai ? fmtShort(e.tgl) : `${fmtShort(e.tgl)} - ${fmtShort(e.tglSelesai)}`
  return `${days} ${e.jam || '--:--'} - ${e.jamSelesai || '--:--'} (WIB)`
}

export function soonLabel(iso: string) {
  const [y, m, d] = ymd(iso)
  const [ty, tm, td] = ymd(TODAY)
  const n = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86400000)
  if (n === 0) return 'Hari ini'
  if (n === 1) return 'Besok'
  if (n > 1 && n < 7) return `${n} hari lagi`
  return undefined
}

// ---------------- Pendaftaran & tiket ----------------

export type RegState = 'OPEN' | 'FULL' | 'CLOSED'

export const registeredCount = (e: Ev, regs: Reg[]) => e.booked + regs.filter((r) => r.eventId === e.id).length

export function regState(e: Ev, registered: number): RegState {
  if (e.status === 'done' || NOW_STAMP < e.regOpen || NOW_STAMP > e.regClose) return 'CLOSED'
  if (registered >= e.quota) return 'FULL'
  return 'OPEN'
}

// Target Peserta (userlevel) / Target Pengurus decide who may take a ticket
export function eligible(e: Ev, a: Account) {
  if (!e.target.length && !e.targetPengurus.length) return true
  if (a.admin && e.targetPengurus.includes('Admin LK')) return true
  return e.target.includes('Umum') || e.target.includes(a.level)
}

// ---------------- Keanggotaan ----------------

// Label kartu: userlevel 0 Tamu, 1 Volunteer, 2 Squad, 3 Core, 4 PIC (event-form Leader = '4')
export const tierOf = (level: Level) =>
  level === 'Umum' ? 'TAMU' : level === 'Leader' ? 'PIC' : level.toUpperCase()

// Same detection as lib/actions/jobs-place.ts (upsertJobsPlace)
const SEKOLAH_PREFIXES = /^(sd|mi|smp|mts|sma|smk|man|ma|sman|smkn|smpn|sdn)\b/i
const KULIAH_PREFIXES = /^(universitas|univ|institut|stikes|stmik|stie|politeknik|poltekkes|akademi)\b/i
const ACRONYM = /^[a-z]{2,8}$/i
export function detectJobsPlace(nama: string): 'Sekolah' | 'Universitas' | 'Tempat Kerja' | null {
  const t = nama.trim()
  if (!t) return null
  if (SEKOLAH_PREFIXES.test(t)) return 'Sekolah'
  if (KULIAH_PREFIXES.test(t) || ACRONYM.test(t)) return 'Universitas'
  return 'Tempat Kerja'
}

// ---------------- LevelUP Kota (cabang) ----------------

export const cabangName = (id: string) =>
  id === NASIONAL_CABANG ? 'Nasional' : CABANGS.find((c) => c.id === id)?.nama ?? `Kota #${id}`

// Event milik kota itu + event nasional (berlaku di semua kota); 'all' = semua kota
export const inKota = (e: Ev, cabang: string) => cabang === 'all' || e.cabang === NASIONAL_CABANG || e.cabang === cabang

// Sekretariat mengelola event kotanya sendiri + event nasional
export const ownEvent = (e: Ev) => inKota(e, KOTA.cabang)

export const memberVisible = (e: Ev) => (e.status === 'approved' || e.status === 'live') && e.tglSelesai >= TODAY

export const onlinePhase = (e: Ev): OnlineAbsenPhase =>
  onlineAbsenPhase(NOW, eventDateTime(parseLocalDate(e.tglSelesai), e.jamSelesai))

const wajibIds = (e: Ev) => sesiWajibIds(e.sesi.map((s) => ({ id_sesi: s.id, wajib: s.wajib })))
export const mineAbsen = (e: Ev, key: string, absen: Absen[]) => absen.filter((a) => a.eventId === e.id && a.key === key)

// Hadir lengkap = absen di setiap sesi wajib (sisko `hadirPenuh`)
export const isLengkap = (e: Ev, key: string, absen: Absen[]) => hadirPenuh(mineAbsen(e, key, absen).map((a) => a.sesiId), wajibIds(e))

export type TicketState = 'Terdaftar' | 'Hadir' | 'Hadir lengkap' | 'Hadir sebagian' | 'Tidak hadir'

export function ticketState(e: Ev, key: string, absen: Absen[]): TicketState {
  const mine = mineAbsen(e, key, absen)
  if (!mine.length) {
    const canStillAbsen = e.jenis === 'Online' && onlinePhase(e) !== 'closed'
    return e.status === 'done' && !canStillAbsen ? 'Tidak hadir' : 'Terdaftar'
  }
  if (!e.sesi.length) return 'Hadir'
  return isLengkap(e, key, absen) ? 'Hadir lengkap' : 'Hadir sebagian'
}

// Tiket aktif: event belum selesai, atau event online yang masih dalam jendela absen
export const ticketActive = (e: Ev, state: TicketState) =>
  e.status === 'approved' || e.status === 'live' || (e.jenis === 'Online' && state === 'Terdaftar' && onlinePhase(e) === 'open')

// Same shape as the real ticket QR (lib/qr.ts): { p: id_peserta, e: email, ev: id_event }
export const ticketQr = (e: Ev, a: Account) => JSON.stringify({ p: String(a.pid), e: a.email, ev: String(e.no) })

export const attendeeKeys = (e: Ev, absen: Absen[]) => [...new Set(absen.filter((a) => a.eventId === e.id).map((a) => a.key))]

// Sesi yang sedang berjalan sekarang (default pilihan scanner), wajib didahulukan
export function currentSesi(e: Ev): Sesi | undefined {
  const running = e.sesi.filter((s) => s.tanggal === TODAY && s.mulai <= NOW_HM && NOW_HM < s.selesai)
  return running.find((s) => s.wajib) ?? running[0] ?? e.sesi.find((s) => s.tanggal >= TODAY) ?? e.sesi[0]
}

export const sesiLabel = (s: Sesi) => `${s.nama} (${s.mulai}–${s.selesai})${s.wajib ? '' : ' · opsional'}`

// Poster for events created from the form (no flyer uploaded)
export function defaultPoster(name: string, tgl: string): PosterSpec {
  const words = name.toUpperCase().split(/\s+/).filter(Boolean)
  const half = Math.ceil(words.length / 2)
  const lines = words.length > 2 ? [words.slice(0, half).join(' '), words.slice(half).join(' ')] : words
  return {
    bg: 'linear-gradient(150deg,#7c1219 0%,#b3202a 55%,#d73640 100%)',
    lines: lines.length ? lines : ['EVENT'], ink: '#ffffff', accent: '#e6cd7e',
    strip: tgl ? `${weekday(tgl)}, ${+dd(tgl)} ${capW(mon(tgl))}` : undefined,
  }
}
