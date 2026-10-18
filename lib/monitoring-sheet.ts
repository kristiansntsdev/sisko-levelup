/**
 * Form Monitoring Teknis SISKO — hitung satu baris per event kota.
 *
 * Dipakai `GET /api/internal/monitoring-sheet`, yang ditarik Apps Script
 * (`scripts/monitoring-sheet.gs`) tiap 5 menit ke tab per tahun.
 *
 * Kolom yang dicentang reviewer (Berita Acara, Flyer, Keterangan) tidak ada di
 * sini — itu milik spreadsheet. Nilai `null` artinya "tidak bisa dinilai dari
 * data" (event / laporan lama sebelum ada timestamp) → sheet pertahankan centang
 * yang sudah ada.
 */
import { wibToday } from '@/lib/wib'

export const MIN_H_UPLOAD = 14
export const MAX_H_LAPORAN = 14

const DAY_MS = 86_400_000

export type MonitoringInput = {
  id_event: number
  nama_event: string
  kota: string
  tglevent: Date
  tgleventselesai: Date
  created_at: Date | null
  suratpemberitahuan: string
  flyerUrl: string
  jumlahAbsen: number
  lpj: { link: string; at: Date | null } | null
  dokumentasi: { link: string; at: Date | null } | null
}

export type MonitoringRow = {
  id_event: number
  nama_event: string
  kota: string
  tanggal: string
  uploadTepatWaktu: boolean | null
  linkBeritaAcara: string
  linkFlyer: string
  absensi: boolean
  laporanTepatWaktu: boolean | null
  lpj: boolean
  dokumentasi: boolean
  linkDokumentasi: string
  catatan: string
}

export type MonitoringSection = { label: string; rows: MonitoringRow[] }

/** Selisih hari kalender b - a (keduanya UTC midnight). */
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS)
}

function fmtTanggal(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return d.toLocaleDateString('id-ID', { ...opts, timeZone: 'UTC' })
}

const FULL: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }

/** "31 Oktober 2026", "30–31 Oktober 2026", "31 Oktober – 1 November 2026". */
export function tanggalEventLabel(mulai: Date, selesai: Date): string {
  const end = fmtTanggal(selesai, FULL)
  if (selesai.getTime() <= mulai.getTime()) return fmtTanggal(mulai, FULL)
  if (mulai.getUTCFullYear() !== selesai.getUTCFullYear()) return `${fmtTanggal(mulai, FULL)} – ${end}`
  if (mulai.getUTCMonth() !== selesai.getUTCMonth()) {
    return `${fmtTanggal(mulai, { day: 'numeric', month: 'long' })} – ${end}`
  }
  return `${mulai.getUTCDate()}–${end}`
}

function hLabel(h: number): string {
  return h >= 0 ? `H+${h}` : `H-${-h}`
}

export function buildMonitoringRow(input: MonitoringInput, now: Date = new Date()): MonitoringRow {
  const today = wibToday(now)
  const catatan: string[] = []

  let uploadTepatWaktu: boolean | null = null
  if (input.created_at) {
    const h = daysBetween(wibToday(input.created_at), input.tglevent)
    uploadTepatWaktu = h >= MIN_H_UPLOAD
    catatan.push(`Upload ${hLabel(-h)}${uploadTepatWaktu ? '' : ` (kurang dari H-${MIN_H_UPLOAD})`}`)
  } else {
    catatan.push('Waktu upload tidak tercatat')
  }

  const selesai = daysBetween(input.tgleventselesai, today) > 0
  if (input.jumlahAbsen > 0) catatan.push(`${input.jumlahAbsen} absen`)
  else if (selesai) catatan.push('Belum ada absensi')

  const lpjLink = input.lpj?.link.trim() ?? ''
  const dokLink = input.dokumentasi?.link.trim() ?? ''
  let laporanTepatWaktu: boolean | null = false
  if (lpjLink && dokLink) {
    const lpjAt = input.lpj?.at
    const dokAt = input.dokumentasi?.at
    if (lpjAt && dokAt) {
      const last = Math.max(wibToday(lpjAt).getTime(), wibToday(dokAt).getTime())
      const h = daysBetween(input.tgleventselesai, new Date(last))
      laporanTepatWaktu = h <= MAX_H_LAPORAN
      catatan.push(`Laporan ${hLabel(h)}${laporanTepatWaktu ? '' : ` (lewat H+${MAX_H_LAPORAN})`}`)
    } else {
      laporanTepatWaktu = null
      catatan.push('Waktu laporan tidak tercatat')
    }
  } else if (selesai) {
    const kurang = [!lpjLink && 'LPJ', !dokLink && 'dokumentasi'].filter(Boolean).join(' & ')
    const batas = new Date(input.tgleventselesai.getTime() + MAX_H_LAPORAN * DAY_MS)
    catatan.push(
      daysBetween(batas, today) > 0
        ? `Lewat H+${MAX_H_LAPORAN}, belum ada ${kurang}`
        : `Belum ada ${kurang} (batas ${fmtTanggal(batas, FULL)})`,
    )
  }

  return {
    id_event: input.id_event,
    nama_event: input.nama_event,
    kota: input.kota,
    tanggal: tanggalEventLabel(input.tglevent, input.tgleventselesai),
    uploadTepatWaktu,
    linkBeritaAcara: input.suratpemberitahuan.trim(),
    linkFlyer: input.flyerUrl,
    absensi: input.jumlahAbsen > 0,
    laporanTepatWaktu,
    lpj: !!lpjLink,
    dokumentasi: !!dokLink,
    linkDokumentasi: dokLink,
    catatan: catatan.join(' · '),
  }
}

/** Kelompokkan per bulan `tglevent` — label "OKTOBER (28–31 Oktober 2026)". Input sudah urut tanggal. */
export function groupByBulan(
  items: { tglevent: Date; row: MonitoringRow }[],
): MonitoringSection[] {
  const byMonth = new Map<string, { tglevent: Date; row: MonitoringRow }[]>()
  for (const item of items) {
    const key = `${item.tglevent.getUTCFullYear()}-${item.tglevent.getUTCMonth()}`
    const list = byMonth.get(key)
    if (list) list.push(item)
    else byMonth.set(key, [item])
  }
  return [...byMonth.values()].map((list) => {
    const first = list[0].tglevent
    const last = list[list.length - 1].tglevent
    const bulan = fmtTanggal(first, { month: 'long' }).toUpperCase()
    const rentang =
      first.getUTCDate() === last.getUTCDate()
        ? fmtTanggal(first, FULL)
        : `${first.getUTCDate()}–${fmtTanggal(last, FULL)}`
    return { label: `${bulan} (${rentang})`, rows: list.map((i) => i.row) }
  })
}
