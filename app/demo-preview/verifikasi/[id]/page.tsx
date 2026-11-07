'use client'
// Demo version of app/verifikasi/[kode]: same page component, data from the localStorage store of this browser
// (a QR scanned on another device finds nothing, because the demo data never leaves the browser that made it).
import { useParams } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { Loading } from '@/components/demo-preview/alk'
import { snapshot, subscribe } from '@/components/demo-preview/db'
import { demoDanaView } from '@/components/demo-preview/shim/actions/reimburse'
import { buildSuratVerifikasi } from '@/lib/surat-verifikasi'
import { SuratVerifikasiPage, SuratVerifikasiTidakAda } from '@/components/dana/surat-verifikasi'

export default function DemoVerifikasiPage() {
  const { id } = useParams<{ id: string }>()
  const db = useSyncExternalStore(subscribe, snapshot, () => null)
  if (!db) return <Loading />
  const view = demoDanaView(Number(id))
  if (!view?.verifikasiUrl) return <SuratVerifikasiTidakAda />
  return <SuratVerifikasiPage data={buildSuratVerifikasi(view)} />
}
