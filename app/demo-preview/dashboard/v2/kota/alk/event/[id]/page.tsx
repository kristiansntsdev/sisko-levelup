'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loading, useLoad } from '@/components/demo-preview/alk'
import { ALK_BASE, ALK_EVENT_BASE } from '@/components/demo-preview/clone/alk-v2/paths'
import { EventDetailV2Client } from '@/components/demo-preview/clone/alk-v2/event-detail'
import { getEventDetail } from '@/components/demo-preview/shim/actions/event'
import { getReimburseForEvent } from '@/components/demo-preview/shim/actions/reimburse'

export default function AlkV2EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const data = useLoad(async () => {
    const event = await getEventDetail(Number(id))
    return { event, reimburse: event ? await getReimburseForEvent(event.id_event) : null }
  })
  useEffect(() => {
    if (data && !data.event) router.replace(`${ALK_BASE}/event`)
  }, [data, router])
  if (!data?.event) return <Loading />
  return <EventDetailV2Client event={data.event} backUrl={`${ALK_BASE}/event`} reimburse={data.reimburse} eventBasePath={ALK_EVENT_BASE} />
}
