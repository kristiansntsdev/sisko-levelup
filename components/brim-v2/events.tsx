'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { EventDashboard } from '@/lib/actions/event'
import { hasBrimRejectNote } from '@/lib/event-approval'
import { ANTON, LABEL, MONO, PANEL, PaperHeader, PaperMain, PRESS } from '@/components/pwa/paper-ui'
import { PAGE_SIZE_EVENT, Pager, SearchBox } from '@/components/alk-v2/list-tools'
import { DateBlock, Empty, Pill, type PillTone } from '@/components/alk-v2/ui'
import { BRIM_EVENT_BASE } from './paths'

type Filter = 'pending' | 'rejected' | 'approved' | 'seluruh_kota' | 'khusus' | 'all'

const TABS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'Belum Approve' },
  { key: 'rejected', label: 'Ditolak' },
  { key: 'approved', label: 'Sudah Approve' },
  { key: 'seluruh_kota', label: 'Seluruh Kota' },
  { key: 'khusus', label: 'Khusus' },
  { key: 'all', label: 'Semua' },
]

const isApproved = (e: EventDashboard) => e.approvebrimnas === '1'
const isRejected = (e: EventDashboard) => !isApproved(e) && hasBrimRejectNote(e.notenasional)
const isPending = (e: EventDashboard) => !isApproved(e) && !hasBrimRejectNote(e.notenasional)

function brimStatus(e: EventDashboard): { label: string; tone: PillTone } {
  if (isApproved(e)) return { label: 'Brim OK', tone: 'green' }
  if (isRejected(e)) return { label: 'Ditolak Brim', tone: 'red' }
  return { label: 'Belum Brim', tone: 'amber' }
}

function monDay(tglMs: number): { d: string; m: string } {
  if (!tglMs) return { d: '—', m: '—' }
  const d = new Date(tglMs)
  return {
    d: String(d.getUTCDate()).padStart(2, '0'),
    m: d.toLocaleDateString('id-ID', { month: 'short', timeZone: 'UTC' }).replace('.', '').toUpperCase().slice(0, 3),
  }
}

function matches(e: EventDashboard, needle: string) {
  if (!needle) return true
  return `${e.id_event} ${e.nama_event} ${e.alamatevent} ${e.tglDisplay} ${e.jamevent} ${e.jenisevent} ${e.wwtype} ${e.cabangName}`
    .toLowerCase()
    .includes(needle)
}

function EventItem({ e }: { e: EventDashboard }) {
  const st = brimStatus(e)
  const { d, m } = monDay(e.tglMs)
  return (
    <Link href={`${BRIM_EVENT_BASE}/${e.id_event}`} className={`w-full p-3.5 flex items-center gap-3.5 text-left ${PANEL} ${PRESS}`}>
      <DateBlock d={d} m={m} tone={isApproved(e) ? 'slate' : 'red'} />
      <div className="min-w-0 flex-1">
        <p className={`${ANTON} text-[18px] leading-[1.12] tracking-[.01em] line-clamp-2`}>{e.nama_event}</p>
        <p className={`${MONO} text-[11px] text-[#44403c] truncate mt-1`}>
          {e.jamevent} · {e.cabangName || 'Nasional'}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Pill tone={st.tone}>{st.label}</Pill>
          <Pill tone={e.approvenasional === '1' ? 'sky' : 'slate'}>{e.approvenasional === '1' ? 'ALK OK' : 'Belum ALK'}</Pill>
        </div>
      </div>
    </Link>
  )
}

export function EventsListClient({ events }: { events: EventDashboard[] }) {
  const [filter, setFilter] = useState<Filter>('pending')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => [...events].sort((a, b) => b.tglMs - a.tglMs), [events])
  const counts = useMemo(
    () => ({
      pending: sorted.filter(isPending).length,
      rejected: sorted.filter(isRejected).length,
      approved: sorted.filter(isApproved).length,
      seluruh_kota: sorted.filter((e) => e.khusus !== '1').length,
      khusus: sorted.filter((e) => e.khusus === '1').length,
      all: sorted.length,
    }),
    [sorted],
  )

  const needle = q.trim().toLowerCase()
  const filtered = useMemo(() => {
    const base =
      filter === 'pending' ? sorted.filter(isPending)
      : filter === 'rejected' ? sorted.filter(isRejected)
      : filter === 'approved' ? sorted.filter(isApproved)
      : filter === 'seluruh_kota' ? sorted.filter((e) => e.khusus !== '1')
      : filter === 'khusus' ? sorted.filter((e) => e.khusus === '1')
      : sorted
    return needle ? sorted.filter((e) => matches(e, needle)) : base
  }, [sorted, filter, needle])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE_EVENT))
  const safePage = Math.min(page, totalPages - 1)
  // While searching, show every match across all filters (same as the legacy BRIM tab).
  const paged = needle ? filtered : filtered.slice(safePage * PAGE_SIZE_EVENT, (safePage + 1) * PAGE_SIZE_EVENT)

  return (
    <PaperMain>
      <PaperHeader sticker="BRIM Nasional" title="Approval Event" />
      <div className="px-5 mt-4 space-y-3 pb-4">
        <SearchBox
          value={q}
          onChange={(v) => {
            setQ(v)
            setPage(0)
          }}
          placeholder="Cari nama, kota, tanggal, atau ID…"
        />
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => {
            const on = !needle && t.key === filter
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setFilter(t.key)
                  setQ('')
                  setPage(0)
                }}
                className={`${LABEL} shrink-0 h-9 px-3.5 rounded-full text-[10.5px] font-bold ${PRESS} ${on ? 'bg-[#161616] text-[#ffd83d]' : 'bg-[#fffdf7] text-[#161616]'}`}
              >
                {t.label}
                <span className={on ? ' text-[#fbf6ec]' : ' text-[#c21f24]'}> {counts[t.key]}</span>
              </button>
            )
          })}
        </div>

        {paged.length === 0 ? (
          <Empty>{needle ? 'Event tidak ditemukan.' : 'Tidak ada event di filter ini.'}</Empty>
        ) : (
          <div className="space-y-2.5">
            {paged.map((e) => (
              <EventItem key={e.id_event} e={e} />
            ))}
          </div>
        )}
        {!needle && <Pager page={safePage} totalPages={totalPages} onChange={setPage} />}
      </div>
    </PaperMain>
  )
}
