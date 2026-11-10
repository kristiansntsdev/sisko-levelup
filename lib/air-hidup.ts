// Air Hidup: level air tiap LevelUP Kota dari tanggal laporan WW terakhir. Murni (tanpa DB), aman dipakai client + demo.
// Satu laporan WW mengisi penuh; air habis AIR_KERING_HARI hari kemudian, sama untuk semua kota (ritme WW tiap kota bebas).

export const AIR_KERING_HARI = 40
export const AIR_HAUS_HARI = 30
export const AIR_SEGAR_HARI = 7
export const AIR_ISI_MAX = 280
export const AIR_JUMLAH_MAX = 9999

export type AirStage = 'melimpah' | 'segar' | 'haus' | 'kering' | 'belum'

export const AIR_STAGE_LABEL: Record<AirStage, string> = {
  melimpah: 'Melimpah',
  segar: 'Segar',
  haus: 'Haus',
  kering: 'Kering',
  belum: 'Belum pernah minum',
}

export type WwLaporan = {
  id: number
  idCabang: number
  namaKota: string
  /** yyyy-mm-dd, hari WIB */
  tanggal: string
  jumlah: number
  isi: string
  foto: string
  oleh: string
  alirKe: { idCabang: number; namaKota: string } | null
  amin: number
  aminSaya: boolean
}

export type KotaAir = {
  idCabang: number
  namaKota: string
  terakhir: string | null
  /** hari sejak laporan terakhir; null = belum pernah */
  hari: number | null
  level: number
  stage: AirStage
}

export type LaporanInput = { tanggal: string; jumlah: number; isi: string; foto?: string }

const DAY = 24 * 60 * 60 * 1000

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

/** Status satu kota dari tanggal laporan terakhirnya; `today` = hari WIB sekarang. */
export function kotaAir(idCabang: number, namaKota: string, terakhir: string | null, today: string): KotaAir {
  const hari = terakhir ? Math.max(0, daysBetween(terakhir, today)) : null
  return { idCabang, namaKota, terakhir, hari, level: airLevel(hari), stage: airStage(hari) }
}

/** Pop-up "Airmu mau kering" hanya di dua tahap ini. */
export function perluPopup(stage: AirStage): boolean {
  return stage === 'haus' || stage === 'kering'
}

/** Terhaus dulu: kota yang paling lama tidak lapor (belum pernah = paling atas), lalu nama. */
export function urutKotaHaus<T extends { hari: number | null; namaKota: string }>(kota: T[]): T[] {
  return [...kota].sort((a, b) => {
    const ha = a.hari ?? Infinity
    const hb = b.hari ?? Infinity
    return ha === hb ? a.namaKota.localeCompare(b.namaKota) : hb - ha
  })
}

export function hariLabel(hari: number | null): string {
  if (hari == null) return 'belum ada laporan'
  if (hari === 0) return 'hari ini'
  if (hari === 1) return 'kemarin'
  return `${hari} hari lalu`
}

export function validateLaporan(input: LaporanInput, today: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.tanggal)) return 'Tanggal WW tidak valid.'
  if (input.tanggal > today) return 'Tanggal WW tidak boleh di masa depan.'
  if (!Number.isInteger(input.jumlah) || input.jumlah < 1 || input.jumlah > AIR_JUMLAH_MAX) return `Jumlah orang 1 sampai ${AIR_JUMLAH_MAX}.`
  const isi = input.isi.trim()
  if (!isi) return 'Tulis satu kalimat: apa yang kalian terima?'
  if (isi.length > AIR_ISI_MAX) return `Maksimal ${AIR_ISI_MAX} karakter.`
  return null
}

/** Hitungan 30 hari terakhir untuk penghitung nasional: total orang dan jumlah kota yang sudah minum. */
export function hitungNasional(laporan: Pick<WwLaporan, 'idCabang' | 'tanggal' | 'jumlah'>[], today: string, window = 30) {
  const recent = laporan.filter((l) => {
    const d = daysBetween(l.tanggal, today)
    return d >= 0 && d < window
  })
  return { orang: recent.reduce((s, l) => s + l.jumlah, 0), kota: new Set(recent.map((l) => l.idCabang)).size }
}
