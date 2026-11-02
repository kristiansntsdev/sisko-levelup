'use client'
import { useParams } from 'next/navigation'
import { Loading, useAlk, useLoad } from '@/components/demo-preview/alk'
import { ALK_EVENT_BASE } from '@/components/demo-preview/clone/alk-v2/paths'
import { EventForm } from '@/components/demo-preview/clone/kota/event-form'
import { getEventDetail } from '@/components/demo-preview/shim/actions/event'

export default function AlkV2EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const alk = useAlk()
  const event = useLoad(() => getEventDetail(Number(id)))
  if (!alk || !event) return <Loading />
  return <EventForm mode="edit" idCabang={alk.cabang} mapsApiKey="" event={event} backUrl={`${ALK_EVENT_BASE}/${event.id_event}`} eventBasePath={ALK_EVENT_BASE} isNasional={false} variant="v2" />
}
