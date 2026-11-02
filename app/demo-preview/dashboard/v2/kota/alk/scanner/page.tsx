'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loading, useAlk, useLoad } from '@/components/demo-preview/alk'
import { ScanClient, type ScanEvent } from '@/components/demo-preview/clone/alk-v2/scan'
import { getDb } from '@/components/demo-preview/db'
import { dayMs, fmtLong } from '@/components/demo-preview/shim/util'
import { ScanSimulator } from '@/components/demo-preview/scan-simulator'

function ScannerPage() {
  const alk = useAlk()
  const sp = useSearchParams()
  const events = useLoad(async (): Promise<ScanEvent[]> => {
    const d = getDb()
    return d.event
      .filter((e) => e.id_cabang === alk!.cabang && e.approvenasional === '1')
      .sort((a, b) => b.tglevent.localeCompare(a.tglevent))
      .map((e) => ({
        id_event: e.id_event,
        nama_event: e.nama_event,
        tglMs: dayMs(e.tglevent),
        tglDisplay: fmtLong(e.tglevent),
        jamevent: e.jamevent,
        jamselesaievent: e.jamselesaievent,
        jenisevent: e.jenisevent,
        alamatevent: e.alamatevent,
        radius: e.radius,
        hadir: d.absen.filter((a) => a.id_event === e.id_event).length,
      }))
  })
  if (!alk || !events) return <Loading />
  return (
    <>
      <ScanClient events={events} initialEventId={Number(sp.get('eventId')) || undefined} />
      <ScanSimulator eventId={Number(sp.get('eventId')) || events[0]?.id_event} />
    </>
  )
}

export default function AlkV2ScannerPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ScannerPage />
    </Suspense>
  )
}
