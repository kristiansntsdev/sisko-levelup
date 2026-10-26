import { redirect } from 'next/navigation'
import { getEventById } from '@/lib/actions/event'
import { countActiveRegistrasi, findRegistrasiId } from '@/lib/actions/registrasi'
import { auth } from '@/auth'
import { isOnlineEvent } from '@/lib/event-link'
import { JoinClient } from './join-client'

export default async function JoinPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const [event, session] = await Promise.all([
    getEventById(Number(eventId)),
    auth(),
  ])

  // QR / linkevent lama masih menunjuk ke sini — event Online dialihkan ke
  // halaman absen sekali-scan.
  if (event && isOnlineEvent(event.jenisevent)) redirect(`/absen/${event.id_event}`)

  const idPeserta = session?.user?.idPeserta
  const [registrasiId, registered] = await Promise.all([
    idPeserta ? findRegistrasiId(idPeserta, Number(eventId)) : null,
    event ? countActiveRegistrasi(event.id_event) : 0,
  ])

  return (
    <JoinClient
      event={event}
      isRegistered={registrasiId != null}
      registrasiId={registrasiId}
      registered={registered}
    />
  )
}
