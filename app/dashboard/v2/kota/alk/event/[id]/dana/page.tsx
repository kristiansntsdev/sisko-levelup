import { redirect } from 'next/navigation'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { getEventDetail } from '@/lib/actions/event'
import { getDanaForm, getReimburseForEvent } from '@/lib/actions/reimburse'
import { countHadirUnik } from '@/lib/dana-approval'
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

  const [reimburse, form, hadir] = await Promise.all([
    getReimburseForEvent(event.id_event),
    getDanaForm(event.id_event),
    // Jumlah Peserta = peserta unik yang absen (sama dengan yang dilihat Korwil + Surat Keuangan), bukan registrasi
    countHadirUnik(event.id_event),
  ])

  return (
    <DanaClient
      idEvent={event.id_event}
      namaEvent={event.nama_event}
      tglDisplay={event.tglDisplay}
      jumlahPeserta={hadir}
      reimburse={reimburse}
      form={form}
      backUrl={`${ALK_EVENT_BASE}/${event.id_event}`}
      suratHref={`/surat-keuangan/${event.id_event}`}
    />
  )
}
