import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getEventDetail } from '@/lib/actions/event'
import { getDanaForm, getReimburseForEvent } from '@/lib/actions/reimburse'
import { countHadirUnik } from '@/lib/dana-approval'
import { DanaClient } from './dana-client'

export default async function EventDanaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const cookieStore = await cookies()
  const pengurusId = cookieStore.get('pengurus_id')?.value
  if (!pengurusId) redirect('/admin')

  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk') redirect('/admin')

  const event = await getEventDetail(Number(id))
  if (!event) redirect('/dashboard/kota/alk')

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
      suratHref={`/surat-keuangan/${event.id_event}`}
    />
  )
}
