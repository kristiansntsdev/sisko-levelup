'use client'
import { Loading, useAlk } from '@/components/demo-preview/alk'
import { ALK_BASE, ALK_EVENT_BASE } from '@/components/demo-preview/clone/alk-v2/paths'
import { EventForm } from '@/components/demo-preview/clone/kota/event-form'

export default function AlkV2NewEventPage() {
  const alk = useAlk()
  if (!alk) return <Loading />
  return <EventForm mode="create" idCabang={alk.cabang} mapsApiKey="" backUrl={`${ALK_BASE}/event`} eventBasePath={ALK_EVENT_BASE} isNasional={false} variant="v2" />
}
