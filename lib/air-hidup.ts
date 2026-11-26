// Air Hidup: level air tiap ANGGOTA. Murni (tanpa DB), aman dipakai client + demo.
// Air anggota terisi penuh kalau (1) dia absen di WW Online, atau (2) PIC menandainya di laporan WW kotanya.
// Air habis AIR_KERING_HARI hari kemudian, sama untuk semua anggota. Tidak ada level kota: anggota yang tidak aktif tidak boleh membuat kotanya tampak kering.

export const AIR_KERING_HARI = 40
export const AIR_HAUS_HARI = 30
export const AIR_SEGAR_HARI = 7
/** Batas isi laporan (kolom `ww_laporan.isi` = TEXT). Kartu laporan memotong 3 baris; kartu bagikan PNG memakai AIR_ISI_PRATINJAU. */
export const AIR_ISI_MAX = 2000
export const AIR_ISI_PRATINJAU = 280
export const AIR_JUMLAH_MAX = 9999

export type AirStage = 'melimpah' | 'segar' | 'haus' | 'kering' | 'belum'

export const AIR_STAGE_LABEL: Record<AirStage, string> = {
  melimpah: 'Melimpah',
  segar: 'Segar',
  haus: 'Haus',
  kering: 'Kering',
  belum: 'Belum pernah minum',
}

export const PIC_USERLEVEL = '4'
/** Core ke atas melihat bar air kotanya di Beranda. */
export const AIR_MIN_USERLEVEL = 3
/** Push "Airmu mau kering" berhenti di sini supaya pembersihan push_kirim (90 hari) tidak membuatnya terulang. */
export const AIR_PUSH_MAX_HARI = 69

export type WwLaporan = {
  id: number
  idCabang: number
  namaKota: string
  /** yyyy-mm-dd, hari WIB */
  tanggal: string
  /** jumlah anggota yang ditandai di laporan ini */
  jumlah: number
  isi: string
  foto: string
  /** Titik fokus foto (0-100, persen dari kiri / atas): bagian yang dipertahankan saat foto dipotong di kartu kompak. */
  fotoX: number
  fotoY: number
  oleh: string
  amin: number
  aminSaya: boolean
}

/** Status air satu orang (hari dihitung dari `sejak`). */
export type AirStatus = {
  /** hari WIB terakhir minum (yyyy-mm-dd): absen WW Online atau ditandai di laporan WW PIC; null = belum pernah */
  terakhir: string | null
  /** awal siklus air: terakhir minum atau hari mulai, mana yang lebih baru */
  sejak: string | null
  /** hari sejak `sejak`; null = belum pernah minum */
  hari: number | null
  /** hari sejak minum sungguhan; null = belum pernah */
  hariLapor: number | null
  level: number
  stage: AirStage
}

export type AirAnggota = AirStatus & { id: number; nama: string; idCabang: number | null; namaKota: string }

/** `anggota` = id peserta yang ditandai PIC; jumlah orang = banyaknya. */
export type LaporanInput = { tanggal: string; anggota: number[]; isi: string }

export const FOTO_FOKUS_TENGAH = 50
const klem = (n: number) => (Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : FOTO_FOKUS_TENGAH)

/** Titik fokus foto dari FormData (`foto_x`, `foto_y`); kosong / rusak = tengah. Action asli dan shim demo memakai ini. */
export function fokusDari(fd: FormData): { x: number; y: number } {
  const baca = (k: string) => (fd.get(k) == null || fd.get(k) === '' ? FOTO_FOKUS_TENGAH : klem(Number(fd.get(k))))
  return { x: baca('foto_x'), y: baca('foto_y') }
}

/** Data laporan yang dibuka untuk diedit. */
export type LaporanEdit = { id: number; tanggal: string; anggota: number[]; isi: string; foto: string; fotoX: number; fotoY: number }
export type EditData = { today: string; namaKota: string; laporan: LaporanEdit; anggota: AirAnggota[] }

const DAY = 24 * 60 * 60 * 1000

/** yyyy-mm-dd → "22 November 2026". */
export function fmtTanggal(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Selisih hari kalender antara dua yyyy-mm-dd. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY)
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10)
}

/** 1 = penuh, 0 = kering. Belum pernah lapor = 0. */
export function airLevel(hari: number | null): number {
  if (hari == null) return 0
  return Math.max(0, Math.min(1, 1 - hari / AIR_KERING_HARI))
}

export function airStage(hari: number | null): AirStage {
  if (hari == null) return 'belum'
  if (hari >= AIR_KERING_HARI) return 'kering'
  if (hari >= AIR_HAUS_HARI) return 'haus'
  if (hari >= AIR_SEGAR_HARI) return 'segar'
  return 'melimpah'
}

/**
 * Status air satu anggota. Air mulai penuh di `mulai` (hari kota masuk sistem, atau hari anggota daftar kalau lebih baru),
 * lalu tiap WW Online yang diabsen / laporan WW yang menandainya mengisi penuh lagi di hari itu (`terakhir`): siklus
 * dihitung dari yang paling baru di antara keduanya. `today` = hari WIB sekarang.
 */
export function statusAir(terakhir: string | null, today: string, mulai: string | null = null): AirStatus {
  const sejak = [terakhir, mulai].filter((d): d is string => !!d).sort().at(-1) ?? null
  const dari = (d: string | null) => (d ? Math.max(0, daysBetween(d, today)) : null)
  const hari = dari(sejak)
  return { terakhir, sejak, hari, hariLapor: dari(terakhir), level: airLevel(hari), stage: airStage(hari) }
}

/** Hari terakhir minum = yang paling baru dari absen WW Online dan penandaan di laporan WW. */
export function terakhirMinum(...hari: (string | null)[]): string | null {
  return hari.filter((d): d is string => !!d).sort().at(-1) ?? null
}

export function airAnggota(a: { id: number; nama: string; idCabang: number | null; namaKota: string | null; terakhir: string | null; mulai: string | null }, today: string): AirAnggota {
  return { id: a.id, nama: a.nama, idCabang: a.idCabang, namaKota: a.namaKota ?? '', ...statusAir(a.terakhir, today, a.mulai) }
}

/** Pop-up "Airmu mau kering" hanya di dua tahap ini. */
export function perluPopup(stage: AirStage): boolean {
  return stage === 'haus' || stage === 'kering'
}

/** Push "Airmu mau kering" ke anggota itu sendiri: Haus sampai AIR_PUSH_MAX_HARI, sekali per tahap per siklus. */
export function perluPush(air: Pick<AirStatus, 'hari'>): boolean {
  return air.hari != null && air.hari >= AIR_HAUS_HARI && air.hari <= AIR_PUSH_MAX_HARI
}

/** Terhaus dulu: yang paling lama tidak minum (belum pernah = paling atas), lalu nama. */
export function urutHaus<T extends { hari: number | null }>(list: T[], nama: (t: T) => string): T[] {
  return [...list].sort((a, b) => {
    const ha = a.hari ?? Infinity
    const hb = b.hari ?? Infinity
    return ha === hb ? nama(a).localeCompare(nama(b)) : hb - ha
  })
}
export const urutAnggotaHaus = <T extends { hari: number | null; nama: string }>(anggota: T[]): T[] => urutHaus(anggota, (a) => a.nama)

export function hariLabel(hari: number | null): string {
  if (hari == null) return 'belum ada laporan'
  if (hari === 0) return 'hari ini'
  if (hari === 1) return 'kemarin'
  return `${hari} hari lalu`
}

/** Potongan awal isi untuk kartu (maks AIR_ISI_PRATINJAU, dipotong di batas kata). `terpotong` = ada sisa untuk halaman detail. */
export function pratinjauIsi(isi: string): { teks: string; terpotong: boolean } {
  const t = isi.trim()
  if (t.length <= AIR_ISI_PRATINJAU) return { teks: t, terpotong: false }
  const potong = t.slice(0, AIR_ISI_PRATINJAU)
  const spasi = potong.lastIndexOf(' ')
  return { teks: `${(spasi > AIR_ISI_PRATINJAU * 0.6 ? potong.slice(0, spasi) : potong).trimEnd()}…`, terpotong: true }
}

export function validateLaporan(input: LaporanInput, today: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.tanggal)) return 'Tanggal WW tidak valid.'
  if (input.tanggal > today) return 'Tanggal WW tidak boleh di masa depan.'
  if (!input.anggota.length) return 'Tandai anggota yang ikut WW ini.'
  if (input.anggota.length > AIR_JUMLAH_MAX) return `Maksimal ${AIR_JUMLAH_MAX} anggota.`
  if (input.anggota.some((id) => !Number.isInteger(id) || id <= 0) || new Set(input.anggota).size !== input.anggota.length) return 'Daftar anggota tidak valid.'
  const isi = input.isi.trim()
  if (!isi) return 'Tulis apa yang kalian terima dari WW ini.'
  if (isi.length > AIR_ISI_MAX) return `Maksimal ${AIR_ISI_MAX} karakter.`
  return null
}

/** Hitungan 30 hari terakhir untuk penghitung nasional: anggota yang sudah minum dan jumlah kota mereka. */
export function hitungNasional(anggota: Pick<AirAnggota, 'idCabang' | 'hariLapor'>[], window = 30) {
  const minum = anggota.filter((a) => a.hariLapor != null && a.hariLapor < window)
  return { orang: minum.length, kota: new Set(minum.map((a) => a.idCabang).filter((c): c is number => !!c)).size }
}

/** saya = null kalau anggota tidak ditemukan. */
export type AirBeranda = { saya: AirAnggota | null; isPic: boolean; pembaca: string; laporan: WwLaporan[] }
/** `saya` = air PIC sendiri; `anggota` hanya untuk memilih siapa yang ditandai di form Lapor WW (tidak ditampilkan sebagai daftar air). */
export type PicData = { today: string; saya: AirAnggota; namaKota: string; anggota: AirAnggota[]; laporanKota: WwLaporan[] }
export type AliranData = {
  today: string
  nasional: { orang: number; kota: number }
  laporan: WwLaporan[]
}

/** Mengurai FormData Lapor WW (action asli dan shim demo memakai ini). Anggota = field `anggota` berulang. */
export function laporanDari(fd: FormData): LaporanInput {
  return { tanggal: String(fd.get('tanggal') ?? ''), anggota: fd.getAll('anggota').map((v) => Number(v)), isi: String(fd.get('isi') ?? '') }
}
