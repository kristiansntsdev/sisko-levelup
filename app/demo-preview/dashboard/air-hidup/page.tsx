'use client'
import { AliranScreen } from '@/components/air-hidup/screens'
import { AIR_BERANDA, useAir } from '@/components/demo-preview/air-hidup'
import { getAliranData, toggleAmin } from '@/components/demo-preview/shim/actions/air-hidup'

// Demo-only page: the real app serves this at /dashboard/air-hidup for every member (city bars only for LevelUP Pusat).
export default function AirHidupFeedPage() {
  const data = useAir(getAliranData)
  if (!data) return <main className="flex min-h-screen items-center justify-center" />
  return <AliranScreen data={data} berandaHref={AIR_BERANDA} toggleAmin={toggleAmin} />
}
