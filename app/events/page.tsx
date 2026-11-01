'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getPesertaById } from '@/lib/actions/peserta'
import { getCabangs, getEventsByKotalevelup, type CabangOption, type EventListItem } from '@/lib/actions/event'
import {
  ANTON,
  Chip,
  IconButton,
  LABEL,
  MONO,
  PANEL,
  PaperHeader,
  PaperMain,
  PRESS,
  REG_TONE,
  TicketCard,
} from '@/components/pwa/paper-ui'
import { Icon, Sheet, SheetHead } from '@/components/pwa/ui'

const PAGE_SIZE = 10
const PAGER = `${LABEL} text-[11px] font-bold rounded-full bg-[#fffdf7] px-3.5 py-2 disabled:opacity-40 ${PRESS}`

function EventCard({ e }: { e: EventListItem }) {
  return (
    <TicketCard
      href={`/join/${e.id_event}`}
      poster={e.posterUrl}
      label={
        <>
          {e.category}
          {e.cabangName !== e.category && ` · ${e.cabangName}`}
        </>
      }
      title={e.nama_event}
      meta={e.tglRange}
      stub={<span className={`${ANTON} -rotate-90 text-[15px] tracking-[.1em] whitespace-nowrap`}>{e.regState}</span>}
      stubClassName={`w-10 ${REG_TONE[e.regState]}`}
    />
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
    <PaperMain standalone>
      <PaperHeader
        title="Events"
        leading={<IconButton icon="x" label="Tutup" onClick={() => router.push('/dashboard')} className="-rotate-3" />}
        action={<IconButton icon="ticket" label="My Tickets" onClick={() => router.push('/dashboard/tiket')} />}
      />

      <div className="px-5 pt-3 pb-8">
        <label className={`flex items-center gap-2.5 rounded-full bg-[#fffdf7] px-4 py-3 shadow-[0_14px_24px_-14px_rgba(40,30,10,.5)] focus-within:outline-2 focus-within:outline-[#161616]`}>
          <Icon name="search" className="w-5 h-5 shrink-0 text-[#c21f24]" sw={2.2} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            className={`${MONO} flex-1 min-w-0 bg-transparent outline-none text-[16px] text-[#161616] placeholder:text-[#57534e]`}
          />
        </label>

        <button type="button" onClick={() => setKotaOpen(true)} className={`mt-3 w-full flex items-center gap-3 px-3.5 py-2.5 text-left ${PANEL} ${PRESS}`}>
          <Chip name="pin" className="bg-[#e02a2f] text-white" />
          <span className="flex-1 min-w-0">
            <span className={`${LABEL} block text-[9.5px] text-[#57534e]`}>LevelUP Kota</span>
            <span className={`${ANTON} block text-[18px] leading-tight tracking-[.01em] truncate`}>{kotaLabel}</span>
          </span>
          <span className={`${LABEL} text-[10.5px] font-bold text-[#c21f24] flex items-center gap-0.5`}>
            Ganti
            <Icon name="down" className="w-4 h-4" sw={2.4} />
          </span>
        </button>

        <div className="flex gap-2 mt-4 overflow-x-auto -mx-5 px-5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {venues.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={v === venue}
              onClick={() => setVenue(v)}
              className={`${LABEL} shrink-0 h-9 px-4 rounded-full text-[11px] font-bold ${PRESS} ${
                v === venue ? 'bg-[#161616] text-[#ffd83d]' : 'bg-[#fffdf7] text-[#161616]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <p className={`${LABEL} text-center text-[12px] text-[#57534e] py-10`}>Memuat...</p>
          ) : shown.length ? (
            shown.map((e) => <EventCard key={e.id_event} e={e} />)
          ) : (
            <p className={`${LABEL} rounded-[14px] border-2 border-dotted border-[#161616]/30 text-center text-[11px] leading-relaxed text-[#57534e] py-8 px-5`}>
              {events.length ? 'Tidak ada event yang cocok' : `Belum ada event di ${kotaLabel}`}
            </p>
          )}
        </div>

        {totalPages > 1 && !needle && venue === 'All' && (
          <div className="flex items-center justify-between gap-3 pt-5">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={PAGER}>
              ← Prev
            </button>
            <span className={`${MONO} text-[11px] font-bold text-[#44403c]`}>
              Halaman {page} dari {totalPages}
            </span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className={PAGER}>
              Next →
            </button>
          </div>
        )}
      </div>

      <Sheet open={kotaOpen} onClose={() => setKotaOpen(false)}>
        <SheetHead title="Pilih LevelUP Kota" sub="Event dari pusat selalu tampil di semua kota" />
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
                    on ? 'ring-2 ring-[#161616] bg-[#ffd83d]/25' : 'ring-1 ring-[#161616]/15 bg-white'
                  }`}
                >
                  <Chip name={id === 'all' ? 'grid' : 'pin'} className={on ? 'bg-[#ffd83d] text-[#161616]' : 'bg-[#161616]/[.07] text-[#161616]'} />
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-[14.5px] text-[#161616] truncate">
                      {nama}
                      {id === myKota && <span className="text-[11px] font-semibold text-[#c21f24]"> · Kota kamu</span>}
                    </span>
                  </span>
                  {on && <Icon name="check" className="w-5 h-5 text-[#161616]" sw={2.6} />}
                </button>
              )
            },
          )}
        </div>
      </Sheet>
    </PaperMain>
  )
}
