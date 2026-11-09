import { redirect } from 'next/navigation'
import { requireBrimNasionalPage } from '@/lib/brim-auth'
import { getEventDetail } from '@/lib/actions/event'
import { EventApproveV2Client } from '@/components/alk-v2/event-approve'
import { FlyerQaSummary } from '@/components/kota/flyer-qa-summary'
import { BeritaAcaraQaSummary } from '@/components/kota/berita-acara-qa-summary'
import { BRIM_EVENT_BASE } from '@/components/brim-v2/paths'

export default async function BrimV2EventApprovePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireBrimNasionalPage()
  const event = await getEventDetail(Number(id))
  if (!event) redirect(BRIM_EVENT_BASE)

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
      role="brim"
      backHref={BRIM_EVENT_BASE}
      qa={
        <>
          <FlyerQaSummary eventId={event.id_event} initial={event.flyerQa} live={false} />
          <BeritaAcaraQaSummary eventId={event.id_event} initial={event.beritaAcaraQa} live={false} />
        </>
      }
    />
  )
}
