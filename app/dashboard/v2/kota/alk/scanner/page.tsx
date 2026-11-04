import { requireAlkPengurus } from '@/lib/alk-auth'
import { db } from '@/lib/db'
import { ScanClient, type ScanEvent } from '@/components/alk-v2/scan'

export default async function AlkV2ScannerPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>
}) {
  const pengurus = await requireAlkPengurus()
  const sp = await searchParams
  const initialEventId = Number(sp.eventId) || undefined

  const where = pengurus.isNasional
    ? { approvenasional: '1' }
    : { id_cabang: pengurus.cabang, approvenasional: '1' }

  const rows = await db.event.findMany({
    where,
    orderBy: { tglevent: 'desc' },
    take: 80,
    select: {
      id_event: true,
      nama_event: true,
      tglevent: true,
      jamevent: true,
      jamselesaievent: true,
      jenisevent: true,
      alamatevent: true,
      radius: true,
    },
  })

  const events: ScanEvent[] = rows.map((e) => {
    const ms = e.tglevent instanceof Date ? e.tglevent.getTime() : 0
    return {
      id_event: e.id_event,
      nama_event: e.nama_event,
      tglMs: ms,
      tglDisplay: ms
        ? e.tglevent.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC',
        })
        : 'Tanggal tidak valid',
      jamevent: e.jamevent,
      jamselesaievent: e.jamselesaievent,
      jenisevent: e.jenisevent ?? '',
      alamatevent: e.alamatevent,
      radius: e.radius,
    }
  })

  return <ScanClient events={events} initialEventId={initialEventId} />
}
