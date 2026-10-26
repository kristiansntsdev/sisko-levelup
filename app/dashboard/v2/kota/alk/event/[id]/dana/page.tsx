import { redirect } from 'next/navigation'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { getEventDetail } from '@/lib/actions/event'
import { getReimburseForEvent } from '@/lib/actions/reimburse'
import { DanaClient } from '@/app/dashboard/kota/alk/event/[id]/dana/dana-client'
import { ALK_BASE, ALK_EVENT_BASE } from '@/components/alk-v2/paths'

export default async function AlkV2DanaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireAlkPengurus()
  const event = await getEventDetail(Number(id))
  if (!event) redirect(`${ALK_BASE}/event`)

  const reimburse = await getReimburseForEvent(event.id_event)

  return (
    <DanaClient
      idEvent={event.id_event}
      namaEvent={event.nama_event}
      tglDisplay={event.tglDisplay}
      jumlahPeserta={event.registrasi.length}
      reimburse={reimburse}
      backUrl={`${ALK_EVENT_BASE}/${event.id_event}`}
    />
  )
}
