'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import type { EventSummary } from '@/lib/actions/event'

export function JoinClient({ event }: { event: EventSummary | null }) {
  const router = useRouter()
  const posterSrc = event?.posterUrl ?? 'https://picsum.photos/seed/levelup-event/400/700'

  return (
    <main className="w-full bg-surface flex flex-col overflow-hidden" style={{ height: '100dvh' }}>

      {/* Poster fills all available space */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <img
          src={posterSrc}
          alt={event?.nama_event ?? 'Event Poster'}
          className="absolute inset-0 w-full h-full object-cover object-top"
        />

        {/* Fade to white at bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #ffffff)' }}
        />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-12 left-4 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
          style={{ background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(8px)' }}
          aria-label="Kembali"
        >
          ←
        </button>
      </div>

      {/* Info + action — fixed at bottom, no gray gap */}
      <div className="shrink-0 bg-surface px-5 pt-4 pb-safe flex flex-col gap-4 max-w-lg mx-auto w-full"
           style={{ borderTop: '1px solid var(--border)' }}>
        {event ? (
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-fg">{event.nama_event}</h1>
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <CalendarIcon />
              <span>{event.tglDisplay} · {event.jamevent}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Event tidak ditemukan</p>
        )}

        <Button fullWidth size="lg" onClick={() => router.push('/login')}>
          Join / Daftar
        </Button>
      </div>
    </main>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}
