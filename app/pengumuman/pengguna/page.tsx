import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { PENGUMUMAN_COOKIE, verifyPengumumanCookie } from '@/lib/pengumuman-auth'
import { daftarPengguna, PENGGUNA_PER_HALAMAN, type FilterPengguna } from '@/lib/push/pengguna'
import { PenggunaAktif, Shell } from '../ui'

export const dynamic = 'force-dynamic'

type SP = { q?: string; kota?: string; jenis?: string; page?: string }

export default async function PenggunaAktifPage({ searchParams }: { searchParams: Promise<SP> }) {
  if (!verifyPengumumanCookie((await cookies()).get(PENGUMUMAN_COOKIE)?.value)) redirect('/pengumuman')
  const sp = await searchParams
  const filter: FilterPengguna = {
    q: String(sp.q ?? '').slice(0, 60),
    kota: /^\d+$/.test(String(sp.kota ?? '')) ? String(sp.kota) : '',
    jenis: sp.jenis === 'anggota' || sp.jenis === 'pengurus' ? sp.jenis : 'semua',
    halaman: Math.max(1, Number(sp.page) || 1),
  }
  const [data, kota] = await Promise.all([
    daftarPengguna(filter),
    db.cabang.findMany({ select: { id_cabang: true, namacabang: true }, orderBy: { namacabang: 'asc' } }),
  ])
  return (
    <Shell aktif="pengguna">
      <PenggunaAktif
        {...data}
        perHalaman={PENGGUNA_PER_HALAMAN}
        filter={filter}
        kota={kota.map((c) => ({ id: String(c.id_cabang), nama: c.namacabang }))}
      />
    </Shell>
  )
}
