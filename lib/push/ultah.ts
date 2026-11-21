/** Ucapan teman sekota di baris ulang tahun (tabel ultah_ucapan, raw SQL seperti push_*). Hanya server. */
import { db } from '@/lib/db'

export { MAKS_UCAPAN } from './target'

export type UcapanUltah = {
  idDari: number
  nama: string
  isi: string
  /** Epoch ms; ditampilkan di zona perangkat oleh <Waktu>. */
  waktuMs: number
  /** Yang berulang tahun menyukai ucapan ini (pengirim jadi tahu). */
  sukaDiri: boolean
}

/** Suka di postingan ulang tahunnya (dari teman). */
export type SukaPostingan = { jumlah: number; saya: boolean }

/** id_target 0 = postingannya; selain itu = id pengirim ucapan (satu ucapan per pengirim). */
async function barisSuka(idPengumuman: number): Promise<{ id_target: number; id_peserta: number }[]> {
  try {
    return await db.$queryRaw<{ id_target: number; id_peserta: number }[]>`
      SELECT id_target, id_peserta FROM ultah_like WHERE id_pengumuman = ${idPengumuman}`
  } catch (err) {
    console.error('[ultah] baca suka gagal', err)
    return []
  }
}

/** Ucapan terbaru dulu + suka. Gagal baca (mis. sebelum prod-migrate) = kosong. */
export async function muatUltah(
  idPengumuman: number,
  idUltah: number,
  idSaya: number | null,
): Promise<{ ucapan: UcapanUltah[]; post: SukaPostingan }> {
  const [ucapan, suka] = await Promise.all([daftarUcapan(idPengumuman), barisSuka(idPengumuman)])
  const sukaDiri = new Set(suka.filter((l) => l.id_peserta === idUltah && l.id_target !== 0).map((l) => Number(l.id_target)))
  const sukaPost = suka.filter((l) => Number(l.id_target) === 0)
  return {
    ucapan: ucapan.map((u) => ({ ...u, sukaDiri: sukaDiri.has(u.idDari) })),
    post: { jumlah: sukaPost.length, saya: idSaya != null && sukaPost.some((l) => Number(l.id_peserta) === idSaya) },
  }
}

async function daftarUcapan(idPengumuman: number): Promise<UcapanUltah[]> {
  try {
    const rows = await db.$queryRaw<{ id_dari: number; nama: string; isi: string; ts: bigint | number }[]>`
      SELECT u.id_dari, p.nama, u.isi, UNIX_TIMESTAMP(u.updated_at) AS ts
      FROM ultah_ucapan u JOIN peserta p ON p.id_peserta = u.id_dari
      WHERE u.id_pengumuman = ${idPengumuman}
      ORDER BY u.updated_at DESC LIMIT 200`
    return rows.map((r) => ({ idDari: Number(r.id_dari), nama: r.nama, isi: r.isi, waktuMs: Number(r.ts ?? 0) * 1000, sukaDiri: false }))
  } catch (err) {
    console.error('[ultah] daftar ucapan gagal', err)
    return []
  }
}

/** Satu ucapan per orang per baris: kirim lagi = mengganti isi. True = ucapan baru (bukan penggantian). */
export async function simpanUcapan(idPengumuman: number, idDari: number, isi: string): Promise<boolean> {
  const n = await db.$executeRaw`
    INSERT INTO ultah_ucapan (id_pengumuman, id_dari, isi) VALUES (${idPengumuman}, ${idDari}, ${isi})
    ON DUPLICATE KEY UPDATE isi = VALUES(isi), updated_at = CURRENT_TIMESTAMP`
  // MySQL: 1 baris = insert, 2 = diperbarui lewat ON DUPLICATE KEY (bisa 0 kalau isinya sama persis).
  return n === 1
}

/** Pengirim ucapan itu ada? */
export async function adaUcapan(idPengumuman: number, idDari: number): Promise<boolean> {
  const r = await db.$queryRaw<{ n: number }[]>`
    SELECT 1 AS n FROM ultah_ucapan WHERE id_pengumuman = ${idPengumuman} AND id_dari = ${idDari} LIMIT 1`
  return r.length > 0
}

/** Suka / batal suka. Mengembalikan keadaan sesudahnya (true = sekarang disukai). */
export async function ubahSuka(idPengumuman: number, idTarget: number, idPeserta: number): Promise<boolean> {
  const hapus = await db.$executeRaw`
    DELETE FROM ultah_like WHERE id_pengumuman = ${idPengumuman} AND id_target = ${idTarget} AND id_peserta = ${idPeserta}`
  if (hapus > 0) return false
  await db.$executeRaw`
    INSERT IGNORE INTO ultah_like (id_pengumuman, id_target, id_peserta) VALUES (${idPengumuman}, ${idTarget}, ${idPeserta})`
  return true
}
