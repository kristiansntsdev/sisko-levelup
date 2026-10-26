import { EventForm } from '@/components/kota/event-form'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { ALK_BASE, ALK_EVENT_BASE } from '@/components/alk-v2/paths'

export default async function AlkV2NewEventPage() {
  const pengurus = await requireAlkPengurus()
  return (
    <EventForm
      mode="create"
      idCabang={pengurus.cabang}
      mapsApiKey={process.env.GMAPS_API_KEY ?? ''}
      backUrl={`${ALK_BASE}/event`}
      eventBasePath={ALK_EVENT_BASE}
      isNasional={pengurus.isNasional}
    />
  )
}
