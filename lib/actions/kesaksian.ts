'use server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { setActor } from '@/lib/request-context'
import { formatTanggalKesaksian, KESAKSIAN_MAX, type KesaksianItem } from '@/lib/kesaksian'

type Result = { ok: true; item: KesaksianItem } | { ok: false; error: string }

/** Kesaksian milik anggota yang sedang login, terbaru dulu. */
export async function listKesaksianSaya(): Promise<KesaksianItem[]> {
  const session = await auth()
  const id = session?.user?.idPeserta
  if (!id) return []
  const rows = await db.kesaksian.findMany({
    where: { id_peserta: String(id) },
    orderBy: { id_kesaksian: 'desc' },
  })
  return rows.map((r) => ({ id: r.id_kesaksian, isi: r.isi, tanggal: formatTanggalKesaksian(r.created_at) }))
}

/** Satu kiriman kesaksian dari anggota yang sedang login. Boleh kirim berkali-kali. */
export async function kirimKesaksian(isi: string): Promise<Result> {
  const session = await auth()
  const id = session?.user?.idPeserta
  if (!id) return { ok: false, error: 'Masuk dulu untuk menulis kesaksian.' }
  setActor({ type: 'peserta', id, label: session?.user?.name ?? null })

  const text = isi.trim()
  if (!text) return { ok: false, error: 'Tulis dulu kesaksianmu.' }
  if (text.length > KESAKSIAN_MAX) return { ok: false, error: `Maksimal ${KESAKSIAN_MAX} karakter.` }

  const row = await db.kesaksian.create({ data: { id_peserta: String(id), isi: text } })
  return { ok: true, item: { id: row.id_kesaksian, isi: row.isi, tanggal: formatTanggalKesaksian(row.created_at) } }
}
