/** Batas panjang satu kesaksian (dipakai form + server action). */
export const KESAKSIAN_MAX = 2000

export type KesaksianItem = { id: number; isi: string; tanggal: string }

/** "7 November 2026", hari kalender WIB. */
export function formatTanggalKesaksian(d: Date): string {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
}
