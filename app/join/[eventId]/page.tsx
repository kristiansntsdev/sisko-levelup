import { redirect } from 'next/navigation'
import { getEventById } from '@/lib/actions/event'
import { countActiveRegistrasi, findRegistrasiMine } from '@/lib/actions/registrasi'
import { auth } from '@/auth'
import { isOnlineEvent } from '@/lib/event-link'
import { needsNasionalTicketApproval } from '@/lib/registrasi-status'
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

  // Online biasa → absen sekali-scan. Event nasional butuh approve tiket dulu
  // lewat halaman ini, baru absen dari tiket setelah disetujui.
  if (
    event &&
    isOnlineEvent(event.jenisevent) &&
    !needsNasionalTicketApproval(event.wwtype)
  ) {
    redirect(`/absen/${event.id_event}`)
  }

  const idPeserta = session?.user?.idPeserta
  const [mine, registered] = await Promise.all([
    idPeserta ? findRegistrasiMine(idPeserta, Number(eventId)) : null,
    event ? countActiveRegistrasi(event.id_event) : 0,
  ])

  const pendingApproval = mine?.status === 'pending'
  const registrasiId = mine && mine.status !== 'pending' ? mine.id : null

  return (
    <JoinClient
      event={event}
      isRegistered={registrasiId != null}
      registrasiId={registrasiId}
      pendingApproval={pendingApproval}
      registered={registered}
    />
  )
}
