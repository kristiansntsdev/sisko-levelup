'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui'
import { getPesertaById } from '@/lib/actions/peserta'
import { getCabangs, getEventsByKotalevelup, type CabangOption, type EventListItem } from '@/lib/actions/event'

const PAGE_SIZE = 10

export default function EventsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [cabangs, setCabangs] = useState<CabangOption[]>([])
  const [selectedCabang, setSelectedCabang] = useState<string>('')
  const [events, setEvents] = useState<EventListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // Load cabang list once
  useEffect(() => {
    getCabangs().then(setCabangs)
  }, [])

  // Set default cabang from peserta's kotalevelup
  useEffect(() => {
    const idPeserta = session?.user?.idPeserta
    if (!idPeserta) return
    getPesertaById(idPeserta).then((p) => {
      if (p) setSelectedCabang(p.kotalevelup)
    })
  }, [session?.user?.idPeserta])

  // Fetch events when cabang or page changes
  useEffect(() => {
    if (!selectedCabang) return
    setLoading(true)
    getEventsByKotalevelup(selectedCabang, page).then(({ events, total }) => {
      setEvents(events)
      setTotal(total)
      setLoading(false)
    })
  }, [selectedCabang, page])

  function handleCabangChange(id: string) {
    setSelectedCabang(id)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const now = Date.now()

  return (
    <main className="min-h-screen bg-bg">

      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-sm mx-auto px-4 py-3 relative flex items-center justify-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="absolute left-4 flex items-center gap-1 text-sm font-medium text-accent"
          >
            ← Kembali
          </button>
          <h1 className="text-base font-bold text-fg">Semua Event</h1>
        </div>
      </header>

      <div className="max-w-sm mx-auto px-4 py-5 flex flex-col gap-4 pb-safe">

        {/* City dropdown */}
        <select
          value={selectedCabang}
          onChange={(e) => handleCabangChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface text-fg text-sm px-3 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="" disabled>Pilih kota...</option>
          {cabangs.map((c) => (
            <option key={c.id} value={c.id}>{c.nama}</option>
          ))}
        </select>

        {/* Event list */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-surface animate-pulse" style={{ border: '1px solid var(--border)' }}>
                <div className="w-full bg-muted/20" style={{ aspectRatio: '3/4' }} />
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="h-4 w-32 rounded bg-muted/20" />
                  <div className="h-8 w-16 rounded-lg bg-muted/20" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted text-center py-12">Tidak ada event ditemukan.</p>
        ) : (
          events.map((event) => {
            const isFuture = now < event.tglMs
            return (
              <div
                key={event.id_event}
                className="rounded-2xl overflow-hidden bg-surface"
                style={{ border: '1px solid var(--border)' }}
              >
                <img
                  src={event.posterUrl}
                  alt="Event poster"
                  className="w-full object-cover object-top"
                  style={{ aspectRatio: '3/4' }}
                />
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">
                    {event.tglDisplay} · {event.jamevent}
                  </span>
                  {isFuture && (
                    <Button
                      size="sm"
                      onClick={() => router.push(`/join/${event.id_event}`)}
                      className="shrink-0"
                    >
                      Daftar
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm font-medium text-accent disabled:text-muted disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <span className="text-xs text-muted">
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-sm font-medium text-accent disabled:text-muted disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
