import { notFound, redirect } from 'next/navigation'
import { anggotaAir, dataEditLaporan } from '@/lib/air-hidup-data'
import { EditPage } from '../../client'

export const dynamic = 'force-dynamic'

export default async function EditLaporanWwPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const me = await anggotaAir()
  if (!me) redirect(`/login?callbackUrl=/dashboard/pic/edit/${id}`)
  const data = await dataEditLaporan(me, Number(id))
  if (!data) notFound()
  return <EditPage data={data} />
}
