import { requireBrimNasionalPage } from '@/lib/brim-auth'
import { getAllEventsByKotalevelup } from '@/lib/actions/event'
import { EventsListClient } from '@/components/brim-v2/events'

export default async function BrimV2EventPage() {
  await requireBrimNasionalPage()
  const events = await getAllEventsByKotalevelup(null)
  return <EventsListClient events={events} />
}
