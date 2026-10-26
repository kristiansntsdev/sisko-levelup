import { requireAlkPengurus } from '@/lib/alk-auth'
import { getAllEventsByKotalevelup } from '@/lib/actions/event'
import { EventsListClient } from '@/components/alk-v2/events'

export default async function AlkV2EventsPage() {
  const pengurus = await requireAlkPengurus()
  const events = await getAllEventsByKotalevelup(pengurus.isNasional ? null : pengurus.cabang)
  return <EventsListClient events={events} isNasional={pengurus.isNasional} />
}
