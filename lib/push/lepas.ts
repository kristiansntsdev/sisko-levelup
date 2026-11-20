/** Putuskan sesi dari perangkat push saat logout. Hanya server; dipakai di dalam server action. */
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { aktorPengurusId } from './pengurus'

export const PUSH_COOKIE = 'push_sub'

export async function idSubDariCookie(): Promise<number | null> {
  const raw = (await cookies()).get(PUSH_COOKIE)?.value
  const id = Number(raw)
  return raw && Number.isInteger(id) && id > 0 ? id : null
}

async function hapusYatim(): Promise<void> {
  await db.$executeRaw`DELETE FROM push_subscription WHERE id_peserta IS NULL AND id_pengurus IS NULL`
}

/** Perangkat ini tidak lagi menerima push peserta. Gagal hanya di-log: logout tidak boleh macet. */
export async function lepasPeserta(idPeserta: number | null): Promise<void> {
  try {
    const sub = await idSubDariCookie()
    if (!sub || !idPeserta) return
    await db.$executeRaw`UPDATE push_subscription SET id_peserta = NULL WHERE id_sub = ${sub} AND id_peserta = ${idPeserta}`
    await hapusYatim()
  } catch (err) {
    console.error('[push] lepasPeserta gagal', err)
  }
}

/** Panggil SEBELUM cookie pengurus dihapus. */
export async function lepasPengurus(): Promise<void> {
  try {
    const [sub, id] = await Promise.all([idSubDariCookie(), aktorPengurusId()])
    if (!sub || !id) return
    await db.$executeRaw`UPDATE push_subscription SET id_pengurus = NULL WHERE id_sub = ${sub} AND id_pengurus = ${id}`
    await hapusYatim()
  } catch (err) {
    console.error('[push] lepasPengurus gagal', err)
  }
}
