import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getEventDetail } from '@/lib/actions/event'
import { getEventDetailVol } from '@/lib/actions/event-detail'
import { VolEventDetailClient } from '@/components/kota/vol-event-detail'

export default async function VolEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const cookieStore = await cookies()
  const pengurusId = cookieStore.get('pengurus_id')?.value
  if (!pengurusId) redirect('/admin')

  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'vol') redirect('/admin')

  const [event, volDetail] = await Promise.all([
    getEventDetail(Number(id)),
    getEventDetailVol(Number(id)),
  ])
  if (!event) redirect('/dashboard/kota/vol')

  return (
    <VolEventDetailClient
      event={event}
      volDetail={volDetail}
      backUrl="/dashboard/kota/vol"
    />
  )
}
