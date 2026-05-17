import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getEventDetail } from '@/lib/actions/event'
import { EventForm } from '@/components/kota/event-form'

export default async function EditEventPage({
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
    select: { divisi: true, kotalevelup: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk') redirect('/admin')

  const event = await getEventDetail(Number(id))
  if (!event) redirect('/dashboard/kota/alk')

  return (
    <EventForm
      mode="edit"
      idCabang={pengurus.kotalevelup}
      mapsApiKey={process.env.GMAPS_API_KEY ?? ''}
      event={event}
      backUrl={`/dashboard/kota/alk/event/${id}`}
    />
  )
}
