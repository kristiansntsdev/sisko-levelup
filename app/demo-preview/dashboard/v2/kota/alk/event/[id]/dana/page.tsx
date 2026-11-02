'use client'
import { useParams } from 'next/navigation'
import { Loading, useLoad } from '@/components/demo-preview/alk'
import { ALK_EVENT_BASE } from '@/components/demo-preview/clone/alk-v2/paths'
import { DanaClient } from '@/components/demo-preview/clone/kota/dana-client'
import { ReimburseProgress } from '@/components/demo-preview/reimburse-progress'
import { getEventDetail } from '@/components/demo-preview/shim/actions/event'
import { getReimburseForEvent } from '@/components/demo-preview/shim/actions/reimburse'

export default function AlkV2DanaPage() {
  const { id } = useParams<{ id: string }>()
  const data = useLoad(async () => {
    const event = await getEventDetail(Number(id))
    return { event, reimburse: event ? await getReimburseForEvent(event.id_event) : null }
  })
  if (!data?.event) return <Loading />
  const { event, reimburse } = data
  return (
    // The real form is a min-h-screen <main>; relax it so the demo's status panel sits right under the form.
    <div className="[&>main]:min-h-0">
      <DanaClient
        idEvent={event.id_event}
        namaEvent={event.nama_event}
        tglDisplay={event.tglDisplay}
        jumlahPeserta={event.registrasi.length}
        reimburse={reimburse}
        backUrl={`${ALK_EVENT_BASE}/${event.id_event}`}
      />
      <ReimburseProgress idEvent={event.id_event} />
    </div>
  )
}
