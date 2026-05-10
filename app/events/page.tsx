'use client'
import { useRouter } from 'next/navigation'
import { Button, Card, Input } from '@/components/ui'

const EVENTS = [
  { id: '1', name: 'Retreat Core', date: '27 Mei 2026', location: 'Ngawi' },
  { id: '2', name: 'Retreat Core', date: '27 Mei 2026', location: 'Ngawi' },
  { id: '3', name: 'Retreat Core', date: '27 Mei 2026', location: 'Ngawi' },
]

export default function EventsPage() {
  const router = useRouter()

  return (
    <main className="max-w-sm mx-auto min-h-screen bg-bg px-4 py-8 pb-safe flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-fg">List Semua Event</h1>
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center text-muted hover:text-fg transition-colors"
        >
          ✕
        </button>
      </header>

      <Input placeholder="ngawi" />

      <div className="flex flex-col gap-3">
        {EVENTS.map((event, i) => (
          <Card key={`${event.id}-${i}`} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-fg truncate">{event.name}</p>
                <p className="text-xs text-muted mt-0.5">{event.date}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/join/${event.id}`)}
              >
                join
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </main>
  )
}
