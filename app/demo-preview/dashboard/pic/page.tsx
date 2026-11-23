'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PicScreen } from '@/components/air-hidup/screens'
import { AIR_BERANDA, AIR_FEED, AIR_LAPOR, airEdit, useAir } from '@/components/demo-preview/air-hidup'
import { getPicData, toggleAmin } from '@/components/demo-preview/shim/actions/air-hidup'
import { useSession } from '@/components/demo-preview/shim/session'

// Demo-only page: the real app serves this at /dashboard/pic (app/dashboard/pic) with server actions instead of the shim.
export default function PicDashboardPage() {
  const router = useRouter()
  const { status } = useSession()
  const data = useAir(getPicData)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/demo-preview/login')
    if (data === null) router.replace(AIR_BERANDA) // not a PIC
  }, [status, data, router])

  if (!data) return <main className="flex min-h-screen items-center justify-center" />
  return <PicScreen data={data} berandaHref={AIR_BERANDA} laporHref={AIR_LAPOR} feedHref={AIR_FEED} editHref={airEdit} toggleAmin={toggleAmin} />
}
