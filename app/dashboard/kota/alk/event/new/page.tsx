import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { isNasionalAdmin, resolveEventCabang } from '@/lib/event-cabang'
import { EventForm } from '@/components/kota/event-form'

export default async function NewEventPage() {
  const cookieStore = await cookies()
  const pengurusId = cookieStore.get('pengurus_id')?.value
  if (!pengurusId) redirect('/admin')

  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { divisi: true, kotalevelup: true, username: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk') redirect('/admin')

  return (
    <EventForm
      mode="create"
      idCabang={resolveEventCabang(pengurus)}
      mapsApiKey={process.env.GMAPS_API_KEY ?? ''}
      backUrl="/dashboard/kota/alk"
      isNasional={isNasionalAdmin(pengurus.username)}
    />
  )
}
