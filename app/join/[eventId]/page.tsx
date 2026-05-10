import { getEventById } from '@/lib/actions/event'
import { JoinClient } from './join-client'

export default async function JoinPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const event = await getEventById(Number(eventId))

  return <JoinClient event={event} />
}
