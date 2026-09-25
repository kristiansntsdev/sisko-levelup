import { redirect } from 'next/navigation'
import { getEventById } from '@/lib/actions/event'
import { checkRegistrasi } from '@/lib/actions/registrasi'
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

  const idPeserta = (session?.user as any)?.idPeserta as number | undefined
  const isRegistered = idPeserta
    ? await checkRegistrasi(idPeserta, Number(eventId))
    : false

  return <JoinClient event={event} isRegistered={isRegistered} />
}
