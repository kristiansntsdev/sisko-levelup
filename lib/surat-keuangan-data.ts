// Pure data helpers for the Surat Keuangan letter. Kept out of the 'use client' component file so server code
// (loaders, the /dana links, the print page) can call them; functions exported from a client module are client
// references on the server.
import { levelupKota } from '@/components/documents/_shared/document-header'
import { formatCurrency } from '@/lib/documents/form-data'

export type SuratKeuanganData = {
  namaKoordinator: string
  kota: string
  namaEvent: string
  tanggalEvent: string
  tempat: string
  jumlahPeserta: string
  pengajuanDana: string
  namabank: string
  norek: string
  namarek: string
}

/** Korwil PPHTGD dari API pphtgd-official. `wa` = digit internasional untuk wa.me (null kalau tidak ada). */
export type KorwilOption = { id: number; nama: string; koordinator: string | null; kota: string | null; wa: string | null }

/** Teks "Ditandatangani · {tgl}" di kotak TTD (di bawah QR); null = belum. */
export type SuratApprovals = { korwil?: string | null; pic?: string | null; keuangan?: string | null }

export const SURAT_KEUANGAN = {
  kepada: ['Yth. Pdt. Himawan Leenardo', 'Pengurus PPHTGD Pusat', 'di tempat'],
  picPusat: { role: 'PIC LevelUP Pusat', nama: 'Stefanus Kusuma' },
  // Tanpa nama orang: baris nama di bawah kotak TTD juga "Keuangan PPHTGD"
  keuangan: { role: 'Keuangan PPHTGD', nama: 'Keuangan PPHTGD' },
} as const

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return { y, m: m - 1, d }
}

function dash(v: string | null | undefined) {
  return v && v.trim() ? v.trim() : '-'
}

/** "04 Juli 2026" or "14 – 15 Mei 2026" / "30 April – 1 Mei 2026" for ranges. Inputs are YYYY-MM-DD (date-only, no timezone shift). */
export function formatTanggalEvent(mulai: string, selesai: string): string {
  const a = parts(mulai)
  const b = parts(selesai || mulai)
  const dd = (n: number) => String(n).padStart(2, '0')
  if (a.y === b.y && a.m === b.m && a.d === b.d) return `${dd(a.d)} ${BULAN[a.m]} ${a.y}`
  if (a.y === b.y && a.m === b.m) return `${dd(a.d)} – ${dd(b.d)} ${BULAN[a.m]} ${a.y}`
  if (a.y === b.y) return `${dd(a.d)} ${BULAN[a.m]} – ${dd(b.d)} ${BULAN[b.m]} ${a.y}`
  return `${dd(a.d)} ${BULAN[a.m]} ${a.y} – ${dd(b.d)} ${BULAN[b.m]} ${b.y}`
}

/** Digits of a rupiah string ("1500000", "1.500.000") as a number; 0 when empty. */
export function danaNumber(raw: string | null | undefined): number {
  const n = Number(String(raw ?? '').replace(/\D/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function rp(raw: string): string {
  const n = danaNumber(raw)
  return n > 0 ? formatCurrency(n) : '-'
}

export function buildSuratKeuangan(input: {
  event: { nama_event: string; tglMulai: string; tglSelesai: string; alamatevent: string; jenisevent: string }
  cabang: { namacabang: string; leadercabang: string } | null
  reimburse: { danausul: string; namabank: string; norek: string; namarek: string }
  jumlahHadir: number
}): SuratKeuanganData {
  const { event, cabang, reimburse } = input
  return {
    namaKoordinator: dash(cabang?.leadercabang),
    kota: cabang?.namacabang ? levelupKota(cabang.namacabang) : '-',
    namaEvent: dash(event.nama_event),
    tanggalEvent: formatTanggalEvent(event.tglMulai, event.tglSelesai),
    tempat: event.jenisevent === 'Online' ? 'Online' : dash(event.alamatevent),
    jumlahPeserta: String(input.jumlahHadir),
    pengajuanDana: rp(reimburse.danausul),
    namabank: dash(reimburse.namabank),
    norek: dash(reimburse.norek),
    namarek: dash(reimburse.namarek),
  }
}

function norm(s: string | null | undefined): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/\b(level\s*up|korwil|kota|kabupaten|kab\.?)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Pre-selects the korwil whose name (then coordinator city) equals the LevelUP kota; null when nothing matches. */
export function matchKorwil(options: KorwilOption[], kotaName: string): number | null {
  const key = norm(kotaName)
  if (!key) return null
  const byName = options.find((o) => norm(o.nama) === key)
  if (byName) return byName.id
  const byKota = options.find((o) => norm(o.kota) === key)
  return byKota ? byKota.id : null
}
