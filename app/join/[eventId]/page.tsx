import { getEventById } from '@/lib/actions/event'
import { checkRegistrasi } from '@/lib/actions/registrasi'
import { auth } from '@/auth'
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

  const idPeserta = (session?.user as any)?.idPeserta as number | undefined
  const isRegistered = idPeserta
    ? await checkRegistrasi(idPeserta, Number(eventId))
    : false

  return <JoinClient event={event} isRegistered={isRegistered} />
}
