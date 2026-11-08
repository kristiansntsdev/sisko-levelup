'use server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

/** Fitur beta yang dibuka untuk anggota yang sedang login (tabel beta_akses, diisi developer langsung di DB). */
export async function getBetaAksesSaya(): Promise<string[]> {
  const session = await auth()
  const id = session?.user?.idPeserta
  if (!id) return []
  try {
    const rows = await db.beta_akses.findMany({ where: { id_peserta: id }, select: { fitur: true } })
    return rows.map((r) => r.fitur)
  } catch (e) {
    // Mis. tabel belum ada di jeda deploy → prod-migrate: Beranda tetap tampil, tile beta jadi Soon.
    console.error('getBetaAksesSaya', e)
    return []
  }
}
