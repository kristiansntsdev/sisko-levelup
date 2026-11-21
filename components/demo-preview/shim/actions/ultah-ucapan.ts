'use client'
// Demo: tidak ada baris ulang tahun (tabel pengumuman hanya di app asli), jadi ucapan tidak pernah dikirim.
export type HasilUcapan = { ok: true } | { ok: false; error: string }

export async function kirimUcapanUltah(_idPengumuman: number, _isi: string): Promise<HasilUcapan> {
  return { ok: false, error: 'Belum tersedia di demo' }
}
