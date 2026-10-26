import { redirect } from 'next/navigation'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { getEventDetail } from '@/lib/actions/event'
import { EventForm } from '@/components/kota/event-form'
import { ALK_EVENT_BASE } from '@/components/alk-v2/paths'

export default async function AlkV2EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pengurus = await requireAlkPengurus()
  const event = await getEventDetail(Number(id))
  if (!event) redirect(ALK_EVENT_BASE)

  return (
    <EventForm
      mode="edit"
      idCabang={pengurus.cabang}
      mapsApiKey={process.env.GMAPS_API_KEY ?? ''}
      event={event}
      backUrl={`${ALK_EVENT_BASE}/${event.id_event}`}
      eventBasePath={ALK_EVENT_BASE}
      isNasional={pengurus.isNasional}
    />
  )
}
