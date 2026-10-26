'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getPesertaById } from '@/lib/actions/peserta'
import { getCabangs, getEventsByKotalevelup, type CabangOption, type EventListItem } from '@/lib/actions/event'
import {
  EventThumb,
  Icon,
  PAGE_BG,
  PlainBar,
  Sheet,
  SheetHead,
  TintIcon,
} from '@/components/pwa/ui'

const PAGE_SIZE = 10
const REG_TAB = { OPEN: 'bg-[#c9232c]', FULL: 'bg-[#b1953a]', CLOSED: 'bg-stone-400' } as const

function EventCard({ e, onClick }: { e: EventListItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex h-[104px] rounded-[22px] overflow-hidden shadow-[0_12px_26px_-14px_rgba(80,20,25,.5)] text-left active:scale-[.99] transition ${REG_TAB[e.regState]}`}
    >
      <EventThumb src={e.posterUrl} className="w-[104px] h-full shrink-0" />
      <div className="flex-1 min-w-0 bg-white rounded-r-[20px] px-3.5 flex flex-col justify-center">
        <p className="text-[12px] font-semibold text-[#96792a] truncate">
          {e.category}
          <span className="font-medium text-stone-400"> · {e.cabangName}</span>
        </p>
        <p className="text-[15.5px] font-bold text-[#3b1417] truncate mt-0.5">{e.nama_event}</p>
        <p className="text-[12.5px] text-slate-500 truncate mt-1">{e.tglRange}</p>
      </div>
      <div className="w-9 shrink-0 flex items-center justify-center">
        <span className="-rotate-90 text-white text-[12px] font-extrabold tracking-[.14em] whitespace-nowrap">
          {e.regState}
        </span>
      </div>
    </button>
  )
}

export default function EventsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [cabangs, setCabangs] = useState<CabangOption[]>([])
  const [myKota, setMyKota] = useState('')
  const [selectedCabang, setSelectedCabang] = useState('')
  const [events, setEvents] = useState<EventListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [venue, setVenue] = useState('All')
  const [kotaOpen, setKotaOpen] = useState(false)

  useEffect(() => {
    getCabangs().then(setCabangs)
  }, [])

  useEffect(() => {
    const idPeserta = session?.user?.idPeserta
    if (!idPeserta) return
    getPesertaById(idPeserta).then((p) => {
      if (p?.kotalevelup) {
        setMyKota(p.kotalevelup)
        setSelectedCabang((cur) => cur || p.kotalevelup)
      }
    })
  }, [session?.user?.idPeserta])

  useEffect(() => {
    if (!selectedCabang) return
    setLoading(true)
    getEventsByKotalevelup(selectedCabang, page).then(({ events: ev, total: t }) => {
      setEvents(ev)
      setTotal(t)
      setLoading(false)
    })
  }, [selectedCabang, page])

  const venues = useMemo(
    () => ['All', ...new Set(events.map((e) => e.jenisevent).filter(Boolean))],
    [events],
  )

  const needle = q.trim().toLowerCase()
  const shown = events.filter(
    (e) =>
      (venue === 'All' || e.jenisevent === venue) &&
      (!needle || `${e.nama_event} ${e.category}`.toLowerCase().includes(needle)),
  )

  const kotaLabel =
    selectedCabang === 'all'
      ? 'Semua Kota'
      : cabangs.find((c) => c.id === selectedCabang)?.nama ?? 'Pilih LevelUP...'

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function pickKota(id: string) {
    setSelectedCabang(id)
    setVenue('All')
    setPage(1)
    setKotaOpen(false)
  }

  return (
    <main className={`min-h-screen ${PAGE_BG} font-[family-name:var(--font-proto)] text-slate-800`}>
      <div className="mx-auto w-full max-w-[430px] min-h-screen pb-safe">
        <PlainBar
          title="Events"
          close={() => router.push('/dashboard')}
          right={
            <button
              type="button"
              onClick={() => router.push('/dashboard/tiket')}
              aria-label="My Tickets"
              className="w-11 h-11 flex items-center justify-center rounded-full active:bg-white/10"
            >
              <Icon name="ticket" className="w-7 h-7" sw={1.5} />
            </button>
          }
        />

        <div className="px-4 pt-4 pb-6">
          <label className="flex items-center gap-2.5 rounded-full bg-white ring-1 ring-[#efe3cc] shadow-[0_6px_18px_-12px_rgba(80,20,25,.4)] px-4 py-3 focus-within:ring-2 focus-within:ring-[#c9232c] transition">
            <Icon name="search" className="w-5 h-5 text-[#c9232c]" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="flex-1 min-w-0 bg-transparent outline-none text-[16px] placeholder:text-stone-400"
            />
          </label>

          <button
            type="button"
            onClick={() => setKotaOpen(true)}
            className="mt-3 w-full flex items-center gap-3 rounded-2xl bg-white ring-1 ring-[#efe3cc] shadow-[0_6px_18px_-12px_rgba(80,20,25,.4)] px-3.5 py-2.5 text-left active:scale-[.99] transition"
          >
            <TintIcon name="pin" tint="red" size="w-9 h-9 rounded-xl" icon="w-[18px] h-[18px]" />
            <span className="flex-1 min-w-0">
              <span className="block text-[10.5px] font-bold tracking-[.14em] uppercase text-[#96792a]">LevelUP Kota</span>
              <span className="block font-bold text-[15px] text-[#3b1417] truncate">{kotaLabel}</span>
            </span>
            <span className="text-[12px] font-semibold text-[#c9232c] flex items-center gap-0.5">
              Ganti
              <Icon name="down" className="w-4 h-4" sw={2.4} />
            </span>
          </button>

          <div className="flex gap-3 mt-4 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {venues.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVenue(v)}
                className={`shrink-0 h-10 px-5 rounded-full border-2 text-[14px] font-semibold tracking-wide transition ${
                  v === venue ? 'border-[#c9232c] text-[#c9232c] bg-[#fbeceb]' : 'border-[#e7dccb] text-stone-500 bg-white'
                } ${v === 'All' ? '' : 'uppercase'}`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {loading ? (
              <p className="text-center text-sm text-slate-400 py-10">Memuat...</p>
            ) : shown.length ? (
              shown.map((e) => (
                <EventCard key={e.id_event} e={e} onClick={() => router.push(`/join/${e.id_event}`)} />
              ))
            ) : (
              <p className="text-center text-slate-400 text-[14px] py-10">
                {events.length ? 'Tidak ada event yang cocok' : `Belum ada event di ${kotaLabel}`}
              </p>
            )}
          </div>

          {totalPages > 1 && !needle && venue === 'All' && (
            <div className="flex items-center justify-between gap-3 pt-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm font-semibold text-[#c9232c] disabled:text-slate-300"
              >
                ← Prev
              </button>
              <span className="text-xs text-slate-400">
                Halaman {page} dari {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="text-sm font-semibold text-[#c9232c] disabled:text-slate-300"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      <Sheet open={kotaOpen} onClose={() => setKotaOpen(false)}>
        <SheetHead title="Pilih LevelUP Kota" sub="Event nasional selalu tampil di semua kota" />
        <div className="space-y-2">
          {([['all', 'Semua Kota'], ...cabangs.map((c): [string, string] => [c.id, c.nama])] as [string, string][]).map(
            ([id, nama]) => {
              const on = id === selectedCabang
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => pickKota(id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition ${
                    on ? 'ring-2 ring-[#c9232c] bg-[#fbeceb]/60' : 'ring-1 ring-[#efe3cc] bg-white'
                  }`}
                >
                  <TintIcon name={id === 'all' ? 'grid' : 'pin'} tint={on ? 'red' : 'gold'} size="w-9 h-9 rounded-xl" icon="w-[18px] h-[18px]" />
                  <span className="flex-1 min-w-0">
                    <span className={`block font-bold text-[14.5px] truncate ${on ? 'text-[#c9232c]' : 'text-[#3b1417]'}`}>
                      {nama}
                      {id === myKota && <span className="text-[11px] font-semibold text-[#96792a]"> · Kota kamu</span>}
                    </span>
                  </span>
                  {on && <Icon name="check" className="w-5 h-5 text-[#c9232c]" sw={2.6} />}
                </button>
              )
            },
          )}
        </div>
      </Sheet>
    </main>
  )
}
