'use client'
import { useRouter } from 'next/navigation'
import { Badge, Card } from '@/components/ui'

export default function DashboardPage() {
  const router = useRouter()

  return (
    <main className="max-w-sm mx-auto min-h-screen bg-bg px-4 py-6 flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-fg">Hallo, Nama</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/join/1')}
            className="flex items-center gap-1 text-sm text-accent font-medium bg-accent-light px-3 py-1 rounded-full"
          >
            join squad <span>→</span>
          </button>
          <button className="w-7 h-7 rounded-full bg-red flex items-center justify-center text-white text-xs font-bold leading-none">
            ×
          </button>
        </div>
      </header>

      <div
        onClick={() => router.push('/dashboard/tiket/1')}
        className="cursor-pointer"
      >
        <Card variant="elevated" className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Tiket Aktif</p>
              <p className="text-base font-semibold text-fg mt-0.5">tiket event #1</p>
            </div>
            <span className="text-accent text-lg font-medium">→</span>
          </div>
        </Card>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm font-semibold text-fg">Event Terdekat</p>
          <Badge variant="amber">besok</Badge>
        </div>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-fg">Retreat Core</p>
              <p className="text-xs text-muted mt-0.5">27 Mei 2026</p>
            </div>
            <button
              onClick={() => router.push('/events')}
              className="text-sm text-accent font-medium"
            >
              Detail
            </button>
          </div>
        </Card>
      </section>

      <section>
        <p className="text-sm font-semibold text-fg mb-3">List Dokumentasi</p>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-5 flex flex-col items-center justify-center gap-2 aspect-square">
            <LockIcon />
            <p className="text-xs text-muted text-center">Dokumentasi 1</p>
          </Card>
          <Card className="p-5 flex flex-col items-center justify-center gap-2 aspect-square">
            <LockIcon />
            <p className="text-xs text-muted text-center">Dokumentasi 2</p>
          </Card>
        </div>
      </section>

      <button
        onClick={() => router.push('/events')}
        className="text-sm text-accent font-medium text-center mt-1"
      >
        List Semua Event →
      </button>
    </main>
  )
}

function LockIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-subtle"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}
