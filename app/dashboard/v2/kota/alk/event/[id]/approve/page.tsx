import { redirect } from 'next/navigation'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { getEventDetail } from '@/lib/actions/event'
import { getReimburseForEvent } from '@/lib/actions/reimburse'
import { EventApproveClient } from '@/app/dashboard/kota/alk/event/[id]/approve/approve-client'
import { ALK_BASE } from '@/components/alk-v2/paths'

export default async function AlkV2ApprovePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pengurus = await requireAlkPengurus()
  if (!pengurus.isNasional) redirect(ALK_BASE)

  const event = await getEventDetail(Number(id))
  if (!event) redirect(ALK_BASE)

  const reimburse = await getReimburseForEvent(event.id_event)

  return (
    <EventApproveClient
      event={event}
      role="alk"
      reimburse={reimburse}
      backHref={ALK_BASE}
    />
  )
}
