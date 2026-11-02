'use client'
import { Loading, useAlk, useLoad } from '@/components/demo-preview/alk'
import { EventsListClient } from '@/components/demo-preview/clone/alk-v2/events'
import { getAllEventsByKotalevelup, getCabangs } from '@/components/demo-preview/shim/actions/event'

export default function AlkV2EventsPage() {
  const alk = useAlk()
  const data = useLoad(async () => {
    const [events, cabangs] = await Promise.all([getAllEventsByKotalevelup(alk!.cabang), getCabangs()])
    return { events, cabangs }
  })
  if (!alk || !data) return <Loading />
  return <EventsListClient events={data.events} isNasional={false} cabangs={data.cabangs} />
}
