'use client'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@/components/ui'

export default function TiketPage() {
  const router = useRouter()

  return (
    <main className="max-w-sm mx-auto min-h-screen bg-bg px-4 py-12 pb-safe flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-fg">Tiket Kamu</h1>
        <p className="text-sm text-muted mt-1">Tunjukkan QR ini saat absen</p>
      </div>

      <Card variant="elevated" className="w-full p-6 flex flex-col items-center gap-5">
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TIKET-023&color=1c1917&bgcolor=ffffff"
          alt="QR Code Tiket"
          width={200}
          height={200}
          className="rounded-input"
        />
        <div className="w-full border-t border-border pt-4 text-center">
          <p className="text-xs text-muted uppercase tracking-wider">Nomor Tiket</p>
          <p className="text-2xl font-bold text-fg mt-1">Tiket #023</p>
        </div>
      </Card>

      <div className="w-full flex flex-col gap-3">
        <Button variant="secondary" fullWidth onClick={() => router.push('/dashboard')}>
          Lihat Akun
        </Button>
      </div>
    </main>
  )
}
