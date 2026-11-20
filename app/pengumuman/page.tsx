import { cookies } from 'next/headers'
import { PENGUMUMAN_COOKIE, verifyPengumumanCookie } from '@/lib/pengumuman-auth'
import { daftarPengumuman, PER_HALAMAN } from '@/lib/push/pengumuman'
import { ringkasanPush } from '@/lib/push/pengguna'
import { DaftarPengumuman, LoginForm, Shell } from './ui'

export const dynamic = 'force-dynamic'

export default async function PengumumanPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!verifyPengumumanCookie((await cookies()).get(PENGUMUMAN_COOKIE)?.value)) return <LoginForm />
  const halaman = Math.max(1, Number((await searchParams).page) || 1)
  const [daftar, ringkasan] = await Promise.all([daftarPengumuman(halaman), ringkasanPush()])
  return (
    <Shell aktif="daftar">
      <DaftarPengumuman {...daftar} halaman={halaman} perHalaman={PER_HALAMAN} ringkasan={ringkasan} />
    </Shell>
  )
}
