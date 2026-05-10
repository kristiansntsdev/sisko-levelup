'use client'
import { useRouter } from 'next/navigation'
import { Button, Alert, Card } from '@/components/ui'

const PESERTA = [
  { id: 1, nama: 'Budi Santoso', gereja: 'GBI Bethel' },
  { id: 2, nama: 'Siti Rahayu', gereja: 'GPDI Maranatha' },
]

export default function DataPesertaPage() {
  const router = useRouter()

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

      <div className="flex flex-col gap-3">
        {PESERTA.map((p) => (
          <Card key={p.id} className="p-4">
            <p className="font-medium text-fg">{p.nama}</p>
            <p className="text-xs text-muted mt-0.5">{p.gereja}</p>
          </Card>
        ))}
      </div>

      <Button variant="secondary" fullWidth onClick={() => router.push('/alk/scanner')}>
        Scan Lagi
      </Button>
    </main>
  )
}
