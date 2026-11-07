'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Loading, useLoad } from '@/components/demo-preview/alk'
import { ALK_EVENT_BASE } from '@/components/demo-preview/clone/alk-v2/paths'
import { DanaClient } from '@/components/demo-preview/clone/kota/dana-client'
import { snapshot, subscribe } from '@/components/demo-preview/db'
import { ReimburseProgress } from '@/components/demo-preview/reimburse-progress'
import { getEventDetail } from '@/components/demo-preview/shim/actions/event'
import { getDanaForm, getReimburseForEvent } from '@/components/demo-preview/shim/actions/reimburse'

export default function AlkV2DanaPage() {
  const { id } = useParams<{ id: string }>()
  const data = useLoad(async () => {
    const event = await getEventDetail(Number(id))
    return {
      event,
      reimburse: event ? await getReimburseForEvent(event.id_event) : null,
      form: event ? await getDanaForm(event.id_event) : null,
    }
  })
  // The real page re-renders on the server after each change; here the demo store drives it, so the approval
  // status follows the Korwil/PIC/Keuangan simulation buttons.
  const db = useSyncExternalStore(subscribe, snapshot, () => null)
  const [fresh, setFresh] = useState<{
    reimburse: Awaited<ReturnType<typeof getReimburseForEvent>>
    form: Awaited<ReturnType<typeof getDanaForm>>
  }>()
  useEffect(() => {
    if (!db) return
    let live = true
    Promise.all([getReimburseForEvent(Number(id)), getDanaForm(Number(id))]).then(
      ([reimburse, form]) => live && setFresh({ reimburse, form }),
    )
    return () => {
      live = false
    }
  }, [db, id])
  if (!data?.event) return <Loading />
  const event = data.event
  const reimburse = fresh ? fresh.reimburse : data.reimburse
  const form = fresh ? fresh.form : data.form
  return (
    // The real form is a min-h-screen <main>; relax it so the demo's status panel sits right under the form.
    <div className="[&>main]:min-h-0">
      <DanaClient
        key={reimburse ? `${reimburse.approvepphtgd}-${reimburse.approvenasional}-${reimburse.approvekeuangan}` : 'new'}
        idEvent={event.id_event}
        namaEvent={event.nama_event}
        tglDisplay={event.tglDisplay}
        jumlahPeserta={new Set(event.absen.map((a) => a.id_peserta)).size}
        reimburse={reimburse}
        form={form}
        backUrl={`${ALK_EVENT_BASE}/${event.id_event}`}
      />
      <ReimburseProgress idEvent={event.id_event} />
    </div>
  )
}
