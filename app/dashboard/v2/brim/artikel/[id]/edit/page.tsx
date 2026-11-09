import { notFound } from 'next/navigation'
import { requireBrimNasionalPage } from '@/lib/brim-auth'
import { getArtikelAdminDetail } from '@/lib/artikel-data'
import { ArtikelFormClient } from '@/components/brim-v2/artikel-form'

export default async function BrimV2ArtikelEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireBrimNasionalPage()
  const a = await getArtikelAdminDetail(Number(id))
  if (!a) notFound()
  return (
    <ArtikelFormClient
      initial={{ id: a.id, judul: a.judul, ringkasan: a.ringkasan, coverUrl: a.coverUrl, isi: a.isi, published: a.status === 'published' }}
    />
  )
}
