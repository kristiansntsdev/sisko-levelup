'use client'
import { useRouter } from 'next/navigation'
import { BackBar, PaperHeader, PaperMain } from '@/components/pwa/paper-ui'
import { AirFeed } from '@/components/air-hidup/feed'
import { useAir } from '@/components/demo-preview/air-hidup'
import { getAirHidupFeed, getAirKotaSaya, toggleAmin } from '@/components/demo-preview/shim/actions/air-hidup'

// Demo-only page: the real app will serve this at /dashboard/air-hidup for every member (city bars only for Core and above).
export default function AirHidupFeedPage() {
  const router = useRouter()
  const feed = useAir(getAirHidupFeed)
  const mine = useAir(getAirKotaSaya)

  if (!feed) return <main className="flex min-h-screen items-center justify-center" />

  return (
    <PaperMain>
      <BackBar title="Air Hidup" onBack={() => router.push('/demo-preview/dashboard')} />
      <PaperHeader sticker="Kabar dari kota-kota" title="Aliran Air Hidup" />
      <div className="mt-4 px-5 pb-8">
        <AirFeed nasional={feed.nasional} kota={mine ? feed.kota : undefined} laporan={feed.laporan} onAmin={(id) => void toggleAmin(id)} />
      </div>
    </PaperMain>
  )
}
