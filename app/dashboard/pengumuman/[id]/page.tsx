import { redirect } from 'next/navigation'
import { pembacaSaatIni } from '@/lib/push/pembaca'
import { pengumumanDetail } from '@/lib/push/pengumuman'
import { PengumumanDetailView } from '@/components/pwa/pengumuman'

export const dynamic = 'force-dynamic'

/** Tujuan default tap notifikasi pengumuman (kalau pengirim tidak mengisi tautan). */
export default async function PengumumanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pembaca = await pembacaSaatIni()
  if (!pembaca) redirect(`/login?callbackUrl=/dashboard/pengumuman/${encodeURIComponent(id)}`)
  const item = await pengumumanDetail(Number(id), pembaca)
  return <PengumumanDetailView item={item} />
}
