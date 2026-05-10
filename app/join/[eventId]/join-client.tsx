'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui'
import type { EventSummary } from '@/lib/actions/event'
import { getPesertaById } from '@/lib/actions/peserta'
import { createRegistrasi } from '@/lib/actions/registrasi'

const JOIN_LABELS: Record<number, string> = {
  0: 'Join Member',
  1: 'Join Squad',
  2: 'Join Core',
}

export function JoinClient({ event, isRegistered }: { event: EventSummary | null; isRegistered: boolean }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const posterSrc = event?.posterUrl ?? 'https://picsum.photos/seed/levelup-event/400/700'
  const [loading, setLoading] = useState(false)
  const [userLevel, setUserLevel] = useState<number | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    const idPeserta = session?.user?.idPeserta
    if (!idPeserta) return
    getPesertaById(idPeserta).then((p) => {
      if (p) setUserLevel(Number(p.userlevel))
    })
  }, [status, session])

  const joinLabel = userLevel !== null ? JOIN_LABELS[userLevel] : 'Join / Daftar'
  const showButton = userLevel === null || userLevel < 3

  async function handleJoin() {
    if (!event) return
    const daftarUrl = `/daftar?eventId=${event.id_event}`
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(daftarUrl)}`)
      return
    }
    const idPeserta = session.user?.idPeserta
    if (!idPeserta) { router.push(daftarUrl); return }
    setLoading(true)
    const peserta = await getPesertaById(idPeserta)
    if (peserta?.nowa) {
      await createRegistrasi(idPeserta, event.id_event)
      router.push('/dashboard')
    } else {
      router.push(daftarUrl)
    }
  }

  if (isRegistered) {
    return (
      <main className="min-h-screen bg-black flex flex-col relative">
        <button
          onClick={() => router.back()}
          className="absolute top-12 left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
          aria-label="Kembali"
        >
          ←
        </button>
        <img
          src={posterSrc}
          alt={event?.nama_event ?? 'Event Poster'}
          className="w-full object-contain"
          style={{ minHeight: '100dvh' }}
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center">

      {/* Mobile: full screen card — Desktop: centered phone-like card */}
      <div
        className="relative bg-surface flex flex-col overflow-hidden w-full md:w-[390px] md:rounded-2xl md:shadow-lg"
        style={{ height: '100dvh', maxHeight: '100dvh' }}
      >
        {/* Poster */}
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

        {/* Info + action */}
        <div className="shrink-0 bg-surface px-5 pt-4 pb-safe flex flex-col gap-4"
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

          {showButton && (
            <Button fullWidth size="lg" onClick={handleJoin} disabled={loading}>
              {loading ? 'Mendaftar...' : joinLabel}
            </Button>
          )}
        </div>
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
