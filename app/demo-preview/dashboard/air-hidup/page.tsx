'use client'
import { useRouter } from 'next/navigation'
import { BackBar, PaperHeader, PaperMain } from '@/components/pwa/paper-ui'
import { AirFeed } from '@/components/air-hidup/feed'
import { useAir } from '@/components/demo-preview/air-hidup'
import { bolehLihatAirTiapKota, getAirHidupFeed, toggleAmin } from '@/components/demo-preview/shim/actions/air-hidup'

// Demo-only page: the real app will serve this at /dashboard/air-hidup for every member (city bars only for LevelUP Pusat, userlevel 5).
export default function AirHidupFeedPage() {
  const router = useRouter()
  const feed = useAir(getAirHidupFeed)
  const boleh = useAir(bolehLihatAirTiapKota)

  if (!feed) return <main className="flex min-h-screen items-center justify-center" />

  return (
    <PaperMain>
      <BackBar title="Air Hidup" onBack={() => router.push('/demo-preview/dashboard')} />
      <PaperHeader sticker="Kabar dari kota-kota" title="Aliran Air Hidup" />
      <div className="mt-4 px-5 pb-8">
        <AirFeed nasional={feed.nasional} kota={boleh ? feed.kota : undefined} laporan={feed.laporan} onAmin={(id) => void toggleAmin(id)} />
      </div>
    </PaperMain>
  )
}
