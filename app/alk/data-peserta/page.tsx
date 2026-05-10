'use client'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Alert, Card } from '@/components/ui'

function DataPesertaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nama = searchParams.get('nama') ?? ''
  const gereja = searchParams.get('gereja') ?? ''

  return (
    <main className="max-w-sm mx-auto min-h-screen bg-bg px-4 py-8 pb-safe flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-fg">Data Peserta</h1>
        <button
          onClick={() => router.push('/alk')}
          className="text-sm text-muted hover:text-fg transition-colors"
        >
          ← Kembali
        </button>
      </header>

      <Alert
        variant="success"
        title="ABSEN BERHASIL"
        description="Peserta berhasil diabsen."
      />

      {nama && (
        <Card className="p-4">
          <p className="font-medium text-fg">{nama}</p>
          {gereja && <p className="text-xs text-muted mt-0.5">{gereja}</p>}
        </Card>
      )}

      <Button
        variant="secondary"
        fullWidth
        onClick={() => router.back()}
      >
        Scan Lagi
      </Button>
    </main>
  )
}

export default function DataPesertaPage() {
  return (
    <Suspense>
      <DataPesertaContent />
    </Suspense>
  )
}
