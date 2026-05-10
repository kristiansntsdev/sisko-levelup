'use client'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui'

export default function TiketDetailPage() {
  const router = useRouter()

  return (
    <main className="max-w-sm mx-auto min-h-screen bg-bg px-4 py-8 pb-safe flex flex-col">
      <button
        onClick={() => router.back()}
        className="text-sm text-muted hover:text-fg transition-colors mb-8 self-start"
      >
        ← Kembali
      </button>

      <div className="flex flex-col items-center gap-6">
        <Card variant="elevated" className="w-full p-6 flex flex-col items-center gap-5">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=TIKET-023&color=1c1917&bgcolor=ffffff"
            alt="QR Code Tiket"
            width={220}
            height={220}
            className="rounded-input"
          />
          <div className="w-full border-t border-border pt-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wider">Nomor Tiket</p>
            <p className="text-2xl font-bold text-fg mt-1">Tiket #023</p>
          </div>
        </Card>

        <p className="text-xs text-muted text-center">
          Tunjukkan QR ini kepada panitia saat absen
        </p>
      </div>
    </main>
  )
}
