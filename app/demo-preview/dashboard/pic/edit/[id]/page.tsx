'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { EditLaporScreen } from '@/components/air-hidup/screens'
import { AIR_PIC, useAir } from '@/components/demo-preview/air-hidup'
import { getEditLaporan, perbaruiLaporanWw } from '@/components/demo-preview/shim/actions/air-hidup'

// Demo-only page: the real app serves this at /dashboard/pic/edit/[id].
export default function EditLaporanWwPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const data = useAir(() => getEditLaporan(Number(id)))

  useEffect(() => {
    if (data === null) router.replace(AIR_PIC)
  }, [data, router])

  if (!data) return <main className="flex min-h-screen items-center justify-center" />
  return <EditLaporScreen data={data} picHref={AIR_PIC} onSubmit={perbaruiLaporanWw} />
}
