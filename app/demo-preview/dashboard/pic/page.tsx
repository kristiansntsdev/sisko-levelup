'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PaperHeader, PaperMain, BackBar } from '@/components/pwa/paper-ui'
import { Sheet, SheetHead } from '@/components/pwa/ui'
import { BTN, Strip } from '@/components/pwa/paper-ui'
import { PicDashboard } from '@/components/air-hidup/pic-dashboard'
import { AIR_FEED, AIR_LAPOR, useAir } from '@/components/demo-preview/air-hidup'
import { getPicDashboard, toggleAmin } from '@/components/demo-preview/shim/actions/air-hidup'
import { useSession } from '@/components/demo-preview/shim/session'

// Demo-only page: the real app will serve this at /dashboard/pic with server actions instead of the shim.
export default function PicDashboardPage() {
  const router = useRouter()
  const { status } = useSession()
  const data = useAir(getPicDashboard)
  const [soon, setSoon] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/demo-preview/login')
    if (data === null) router.replace('/demo-preview/dashboard') // not a PIC
  }, [status, data, router])

  if (!data) return <main className="flex min-h-screen items-center justify-center" />

  return (
    <PaperMain>
      <BackBar title="Dashboard PIC" onBack={() => router.push('/demo-preview/dashboard')} />
      <PaperHeader sticker="Dashboard PIC" title={data.namaKota} />
      <div className="mt-4 px-5 pb-8">
        <PicDashboard
          kota={data.kota}
          masuk={data.masuk}
          laporanKota={data.laporanKota}
          laporHref={AIR_LAPOR}
          feedHref={AIR_FEED}
          onAmin={(id) => void toggleAmin(id)}
          onSoon={setSoon}
        />
      </div>
      <Sheet open={Boolean(soon)} onClose={() => setSoon(null)}>
        <SheetHead title={soon ?? ''} sub="Alat ini segera hadir." />
        <button type="button" onClick={() => setSoon(null)} className={BTN}>
          <Strip>Tutup</Strip>
        </button>
      </Sheet>
    </PaperMain>
  )
}
