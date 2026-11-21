/** Siapa yang sedang membuka halaman pengumuman anggota. Hanya server. */
import { cookies } from 'next/headers'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getPengurusFromCookie } from '@/lib/pengurus-session'
import { PENGUMUMAN_COOKIE, verifyPengumumanCookie } from '@/lib/pengumuman-auth'
import type { PembacaPengumuman } from './pengumuman'

/** null = belum login sama sekali (bukan anggota, pengurus, atau admin /pengumuman). */
export async function pembacaSaatIni(): Promise<PembacaPengumuman | null> {
  const [session, pengurus, jar] = await Promise.all([auth(), getPengurusFromCookie(), cookies()])
  const idPeserta = session?.user?.idPeserta ?? null
  const admin = verifyPengumumanCookie(jar.get(PENGUMUMAN_COOKIE)?.value)
  if (!idPeserta && !pengurus && !admin) return null
  const p = idPeserta ? await db.peserta.findUnique({ where: { id_peserta: idPeserta }, select: { kotalevelup: true, userlevel: true } }) : null
  const kunci = idPeserta ? `p${idPeserta}` : pengurus ? `g${pengurus.id_pengurus}` : 'admin'
  return { idPeserta, kota: p?.kotalevelup ?? null, level: p ? Number(p.userlevel) : null, pengurus: Boolean(pengurus), idPengurus: pengurus?.id_pengurus ?? null, admin, kunci }
}
