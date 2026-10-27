import { redirect } from 'next/navigation'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { getEventDetail } from '@/lib/actions/event'
import { EventApproveV2Client } from '@/components/alk-v2/event-approve'
import { ALK_BASE } from '@/components/alk-v2/paths'

export default async function AlkV2ApprovePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pengurus = await requireAlkPengurus()
  if (!pengurus.isNasional) redirect(ALK_BASE)

  const event = await getEventDetail(Number(id))
  if (!event) redirect(ALK_BASE)

  return (
    <EventApproveV2Client
      event={{
        id_event: event.id_event,
        nama_event: event.nama_event,
        tglDisplay: event.tglDisplay,
        posterUrl: event.posterUrl,
        approvenasional: event.approvenasional,
        approvebrimnas: event.approvebrimnas,
        notenasional: event.notenasional,
      }}
      role="alk"
      backHref={ALK_BASE}
    />
  )
}
