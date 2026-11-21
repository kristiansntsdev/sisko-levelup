/** Ucapan teman sekota di baris ulang tahun (tabel ultah_ucapan, raw SQL seperti push_*). Hanya server. */
import { db } from '@/lib/db'

export { MAKS_UCAPAN } from './target'

export type UcapanUltah = {
  idDari: number
  nama: string
  isi: string
  /** Epoch ms; ditampilkan di zona perangkat oleh <Waktu>. */
  waktuMs: number
}

/** Terbaru dulu. Gagal baca (mis. sebelum prod-migrate) = kosong. */
export async function daftarUcapan(idPengumuman: number): Promise<UcapanUltah[]> {
  try {
    const rows = await db.$queryRaw<{ id_dari: number; nama: string; isi: string; ts: bigint | number }[]>`
      SELECT u.id_dari, p.nama, u.isi, UNIX_TIMESTAMP(u.updated_at) AS ts
      FROM ultah_ucapan u JOIN peserta p ON p.id_peserta = u.id_dari
      WHERE u.id_pengumuman = ${idPengumuman}
      ORDER BY u.updated_at DESC LIMIT 200`
    return rows.map((r) => ({ idDari: Number(r.id_dari), nama: r.nama, isi: r.isi, waktuMs: Number(r.ts ?? 0) * 1000 }))
  } catch (err) {
    console.error('[ultah] daftar ucapan gagal', err)
    return []
  }
}

/** Satu ucapan per orang per baris: kirim lagi = mengganti isi. */
export async function simpanUcapan(idPengumuman: number, idDari: number, isi: string): Promise<void> {
  await db.$executeRaw`
    INSERT INTO ultah_ucapan (id_pengumuman, id_dari, isi) VALUES (${idPengumuman}, ${idDari}, ${isi})
    ON DUPLICATE KEY UPDATE isi = VALUES(isi), updated_at = CURRENT_TIMESTAMP`
}
