import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getEventDetail } from '@/lib/actions/event'
import { isNasionalBrim } from '@/lib/event-cabang'
import { EventApproveClient } from '@/app/dashboard/kota/alk/event/[id]/approve/approve-client'

export default async function BrimEventApprovePage({
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
    select: { divisi: true, username: true },
  })
  if (!pengurus || pengurus.divisi !== 'brim' || !isNasionalBrim(pengurus.username)) {
    redirect('/dashboard/kota/brim')
  }

  const event = await getEventDetail(Number(id))
  if (!event) redirect('/dashboard/kota/brim')

  return <EventApproveClient event={event} role="brim" />
}
