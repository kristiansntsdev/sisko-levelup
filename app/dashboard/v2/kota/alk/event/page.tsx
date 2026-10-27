import { requireAlkPengurus } from '@/lib/alk-auth'
import { getAllEventsByKotalevelup, getCabangs } from '@/lib/actions/event'
import { EventsListClient } from '@/components/alk-v2/events'

export default async function AlkV2EventsPage() {
  const pengurus = await requireAlkPengurus()
  const [events, cabangs] = await Promise.all([
    getAllEventsByKotalevelup(pengurus.isNasional ? null : pengurus.cabang),
    getCabangs(),
  ])
  return (
    <EventsListClient
      events={events}
      isNasional={pengurus.isNasional}
      cabangs={cabangs}
    />
  )
}
