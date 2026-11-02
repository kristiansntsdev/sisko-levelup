'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Loading, useLoad } from '@/components/demo-preview/alk'
import { ALK_EVENT_BASE } from '@/components/demo-preview/clone/alk-v2/paths'
import { DanaClient } from '@/components/demo-preview/clone/kota/dana-client'
import { snapshot, subscribe } from '@/components/demo-preview/db'
import { ReimburseProgress } from '@/components/demo-preview/reimburse-progress'
import { getEventDetail } from '@/components/demo-preview/shim/actions/event'
import { getReimburseForEvent } from '@/components/demo-preview/shim/actions/reimburse'

export default function AlkV2DanaPage() {
  const { id } = useParams<{ id: string }>()
  const data = useLoad(async () => {
    const event = await getEventDetail(Number(id))
    return { event, reimburse: event ? await getReimburseForEvent(event.id_event) : null }
  })
  // The real page re-renders on the server after each change; here the demo store drives it, so the approval
  // status (and the Cetak Surat link) follow the Pusat/Keuangan simulation buttons.
  const db = useSyncExternalStore(subscribe, snapshot, () => null)
  const [fresh, setFresh] = useState<Awaited<ReturnType<typeof getReimburseForEvent>>>()
  useEffect(() => {
    if (!db) return
    let live = true
    getReimburseForEvent(Number(id)).then((r) => live && setFresh(r))
    return () => {
      live = false
    }
  }, [db, id])
  if (!data?.event) return <Loading />
  const event = data.event
  const reimburse = fresh ?? data.reimburse
  return (
    // The real form is a min-h-screen <main>; relax it so the demo's status panel sits right under the form.
    <div className="[&>main]:min-h-0">
      <DanaClient
        key={reimburse?.approvenasional ?? 'new'}
        idEvent={event.id_event}
        namaEvent={event.nama_event}
        tglDisplay={event.tglDisplay}
        jumlahPeserta={event.registrasi.length}
        reimburse={reimburse}
        backUrl={`${ALK_EVENT_BASE}/${event.id_event}`}
        suratHref={`/demo-preview/surat-keuangan/${event.id_event}`}
      />
      <ReimburseProgress idEvent={event.id_event} />
    </div>
  )
}
