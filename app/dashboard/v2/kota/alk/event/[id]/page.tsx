import { redirect } from 'next/navigation'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { getEventDetail } from '@/lib/actions/event'
import { getReimburseForEvent } from '@/lib/actions/reimburse'
import { EventDetailPage } from '@/components/kota/event-detail-page'
import { ALK_BASE, ALK_EVENT_BASE } from '@/components/alk-v2/paths'
import Link from 'next/link'

export default async function AlkV2EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pengurus = await requireAlkPengurus()
  const event = await getEventDetail(Number(id))
  if (!event) redirect(`${ALK_BASE}/event`)

  const reimburse = await getReimburseForEvent(event.id_event)

  return (
    <div>
      {pengurus.isNasional && (
        <div className="max-w-[480px] mx-auto px-4 pt-3">
          <Link
            href={`${ALK_EVENT_BASE}/${event.id_event}/approve`}
            className="block text-center text-[13px] font-bold text-white bg-[#c9232c] rounded-xl py-2.5"
          >
            Approval Sekretariat
          </Link>
        </div>
      )}
      <EventDetailPage
        event={event}
        backUrl={`${ALK_BASE}/event`}
        reimburse={reimburse}
        eventBasePath={ALK_EVENT_BASE}
      />
    </div>
  )
}
