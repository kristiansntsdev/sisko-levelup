import { redirect } from 'next/navigation'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { getEventDetail } from '@/lib/actions/event'
import { getReimburseForEvent } from '@/lib/actions/reimburse'
import { EventDetailV2Client } from '@/components/alk-v2/event-detail'
import { ALK_BASE, ALK_EVENT_BASE } from '@/components/alk-v2/paths'

export default async function AlkV2EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireAlkPengurus()
  const event = await getEventDetail(Number(id))
  if (!event) redirect(`${ALK_BASE}/event`)

  const reimburse = await getReimburseForEvent(event.id_event)

  return (
    <EventDetailV2Client
      event={event}
      backUrl={`${ALK_BASE}/event`}
      reimburse={reimburse}
      eventBasePath={ALK_EVENT_BASE}
    />
  )
}
