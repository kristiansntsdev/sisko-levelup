import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { PENGUMUMAN_COOKIE, verifyPengumumanCookie } from '@/lib/pengumuman-auth'
import { anggotaOpsiByIds } from '@/lib/push/pengumuman'
import { Composer } from '../composer'
import { Shell } from '../ui'

export const dynamic = 'force-dynamic'

/** ?anggota=12,34 mengisi penerima awal (tombol Kirim di Pengguna Aktif). */
export default async function BuatPengumumanPage({ searchParams }: { searchParams: Promise<{ anggota?: string }> }) {
  if (!verifyPengumumanCookie((await cookies()).get(PENGUMUMAN_COOKIE)?.value)) redirect('/pengumuman')
  const ids = String((await searchParams).anggota ?? '')
    .split(',')
    .map((v) => Number(v.trim()))
  const [kota, awal] = await Promise.all([
    db.cabang.findMany({ select: { id_cabang: true, namacabang: true }, orderBy: { namacabang: 'asc' } }),
    anggotaOpsiByIds(ids),
  ])
  return (
    <Shell aktif="baru" judul="Buat Pengumuman">
      <Composer kota={kota.map((c) => ({ id: String(c.id_cabang), nama: c.namacabang }))} awal={awal} />
    </Shell>
  )
}
