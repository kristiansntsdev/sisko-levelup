import { notFound } from 'next/navigation'
import { requireBrimNasionalPage } from '@/lib/brim-auth'
import { getArtikelAdminDetail } from '@/lib/artikel-data'
import { ArtikelDetailClient } from '@/components/brim-v2/artikel-detail'

export default async function BrimV2ArtikelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireBrimNasionalPage()
  const artikel = await getArtikelAdminDetail(Number(id))
  if (!artikel) notFound()
  return <ArtikelDetailClient artikel={artikel} />
}
