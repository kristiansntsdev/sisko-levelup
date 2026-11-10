'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BackBar, PaperHeader, PaperMain } from '@/components/pwa/paper-ui'
import { LaporForm } from '@/components/air-hidup/lapor-form'
import { AIR_PIC, useAir } from '@/components/demo-preview/air-hidup'
import { alirkanKe, getPicDashboard, kirimLaporanWw } from '@/components/demo-preview/shim/actions/air-hidup'
import { fileToDataUrl } from '@/components/demo-preview/shim/util'

// Demo-only page: the real app will serve this at /dashboard/pic/lapor.
export default function LaporWwPage() {
  const router = useRouter()
  const data = useAir(getPicDashboard)

  useEffect(() => {
    if (data === null) router.replace('/demo-preview/dashboard')
  }, [data, router])

  if (!data) return <main className="flex min-h-screen items-center justify-center" />

  return (
    <PaperMain>
      <BackBar title="Lapor WW" onBack={() => router.push(AIR_PIC)} />
      <PaperHeader sticker="Pelaporan WW" title={data.namaKota} />
      <div className="mt-4 px-5 pb-8">
        <LaporForm
          namaKota={data.namaKota}
          today={data.today}
          kotaLain={data.kotaLain}
          onSubmit={kirimLaporanWw}
          onAlirkan={async (id, cabang) => {
            await alirkanKe(id, cabang)
          }}
          toPhoto={(f) => fileToDataUrl(f, 900, 0.78)}
          onDone={() => router.push(AIR_PIC)}
        />
      </div>
    </PaperMain>
  )
}
