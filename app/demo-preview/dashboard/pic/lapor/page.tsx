'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LaporScreen } from '@/components/air-hidup/screens'
import { AIR_BERANDA, AIR_PIC, useAir } from '@/components/demo-preview/air-hidup'
import { getPicData, kirimLaporanWw } from '@/components/demo-preview/shim/actions/air-hidup'

// Demo-only page: the real app serves this at /dashboard/pic/lapor.
export default function LaporWwPage() {
  const router = useRouter()
  const data = useAir(getPicData)

  useEffect(() => {
    if (data === null) router.replace(AIR_BERANDA)
  }, [data, router])

  if (!data) return <main className="flex min-h-screen items-center justify-center" />
  return <LaporScreen namaKota={data.namaKota} today={data.today} anggota={data.anggota} picHref={AIR_PIC} onSubmit={kirimLaporanWw} />
}
