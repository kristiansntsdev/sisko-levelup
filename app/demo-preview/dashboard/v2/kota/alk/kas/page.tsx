'use client'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Loading, useAlk } from '@/components/demo-preview/alk'
import { KasV2Client } from '@/components/demo-preview/clone/alk-v2/kas'
import { snapshot, subscribe } from '@/components/demo-preview/db'
import { getAllEventsByKotalevelup } from '@/components/demo-preview/shim/actions/event'
import { getKasKota } from '@/components/demo-preview/shim/actions/kas-kota'

type Data = { kas: Awaited<ReturnType<typeof getKasKota>>; events: Awaited<ReturnType<typeof getAllEventsByKotalevelup>> }

export default function AlkV2KasPage() {
  const alk = useAlk()
  const db = useSyncExternalStore(subscribe, snapshot, () => null)
  const [data, setData] = useState<Data | null>(null)
  const cabang = alk?.cabang
  // Reload whenever the demo store changes, the way revalidatePath re-renders the real page after a write.
  useEffect(() => {
    if (!db || !cabang) return
    Promise.all([getKasKota(Number(cabang)), getAllEventsByKotalevelup(cabang)]).then(([kas, events]) => setData({ kas, events }))
  }, [db, cabang])
  if (!alk || !data) return <Loading />
  // No exportHref: the Excel route is the real API and the demo must never call it.
  return <KasV2Client kas={data.kas} events={data.events} namaCabang={alk.namaCabang} />
}
