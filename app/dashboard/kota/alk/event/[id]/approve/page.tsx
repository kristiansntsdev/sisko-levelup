import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getEventDetail } from '@/lib/actions/event'
import { isNasionalAdmin } from '@/lib/event-cabang'
import { EventApproveClient } from './approve-client'

export default async function AlkEventApprovePage({
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
  if (!pengurus || pengurus.divisi !== 'alk' || !isNasionalAdmin(pengurus.username)) {
    redirect('/dashboard/kota/alk')
  }

  const event = await getEventDetail(Number(id))
  if (!event) redirect('/dashboard/kota/alk')

  return <EventApproveClient event={event} />
}
