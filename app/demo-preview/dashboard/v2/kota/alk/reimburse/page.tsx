'use client'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Loading } from '@/components/demo-preview/alk'
import { ReimburseListV2Client } from '@/components/demo-preview/clone/alk-v2/reimburse'
import { snapshot, subscribe } from '@/components/demo-preview/db'
import { listReimburseSekretariat } from '@/components/demo-preview/shim/actions/reimburse'

export default function AlkV2ReimbursePage() {
  const db = useSyncExternalStore(subscribe, snapshot, () => null)
  const [data, setData] = useState<Awaited<ReturnType<typeof listReimburseSekretariat>>>(null)
  // Reload whenever the demo store changes so the list follows the Pusat/Keuangan simulation buttons.
  useEffect(() => {
    if (db) listReimburseSekretariat().then(setData)
  }, [db])
  if (!db || !data) return <Loading />
  return <ReimburseListV2Client isNasional={data.isNasional} items={data.items} />
}
