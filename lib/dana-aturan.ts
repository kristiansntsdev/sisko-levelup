// Aturan pengajuan dana: jendela waktu + paket dana per rentang peserta. Murni (aman server/client/demo).

/** Pengajuan dana hanya tampil / bisa dikirim sampai sekian hari setelah acara selesai. */
export const DANA_WINDOW_DAYS = 14

const DAY_MS = 24 * 60 * 60 * 1000
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

/**
 * `tglSelesai` = tanggal acara selesai (YYYY-MM-DD atau Date UTC-midnight, seperti kolom @db.Date).
 * Terbuka sampai hari ke-14 setelahnya (WIB, inklusif).
 */
export function danaWindowOpen(tglSelesai: string | Date, now: Date = new Date()): boolean {
  const end = typeof tglSelesai === 'string' ? new Date(`${tglSelesai.slice(0, 10)}T00:00:00Z`) : tglSelesai
  if (Number.isNaN(end.getTime())) return false
  const w = new Date(now.getTime() + WIB_OFFSET_MS)
  const today = Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate())
  return today <= end.getTime() + DANA_WINDOW_DAYS * DAY_MS
}

export type DanaTier = { min: number; max: number; dana: number }

export const DANA_TIERS: DanaTier[] = [
  { min: 75, max: 99, dana: 750_000 },
  { min: 100, max: 124, dana: 1_000_000 },
  { min: 125, max: 149, dana: 1_300_000 },
  { min: 150, max: 174, dana: 1_600_000 },
  { min: 175, max: 200, dana: 2_000_000 },
]

export function danaTierForPeserta(n: number): DanaTier | null {
  return DANA_TIERS.find((t) => n >= t.min && n <= t.max) ?? null
}
