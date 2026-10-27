'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { EventDashboard } from '@/lib/actions/event'
import { PAGE_SIZE_EVENT, Pager, SearchBox } from './list-tools'
import {
  ALK_EVENT_BASE,
  CARD,
  DateBlock,
  Empty,
  H3,
  PageHero,
  Pill,
  StatTriple,
  type PillTone,
} from './ui'

function eventStatus(e: EventDashboard): { label: string; tone: PillTone; bucket: 'open' | 'done' } {
  const end = e.tglMs
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  if (e.approvenasional === '0' && e.notenasional) return { label: 'Ditolak', tone: 'red', bucket: 'open' }
  if (e.approvenasional !== '1') return { label: 'Review', tone: 'amber', bucket: 'open' }
  if (end && end + dayMs < now) return { label: 'Selesai', tone: 'slate', bucket: 'done' }
  if (end && end <= now && end + dayMs >= now) return { label: 'Berlangsung', tone: 'green', bucket: 'open' }
  return { label: 'Terjadwal', tone: 'sky', bucket: 'open' }
}

function monDay(tglMs: number): { d: string; m: string } {
  if (!tglMs) return { d: '—', m: '—' }
  const d = new Date(tglMs)
  return {
    d: String(d.getUTCDate()).padStart(2, '0'),
    m: d.toLocaleDateString('id-ID', { month: 'short', timeZone: 'UTC' }).replace('.', '').toUpperCase().slice(0, 3),
  }
}

function matchesQuery(e: EventDashboard, needle: string) {
  if (!needle) return true
  return `${e.id_event} ${e.nama_event} ${e.alamatevent} ${e.tglDisplay} ${e.jamevent} ${e.jenisevent} ${eventStatus(e).label}`
    .toLowerCase()
    .includes(needle)
}

function EventItem({ e }: { e: EventDashboard }) {
  const st = eventStatus(e)
  const { d, m } = monDay(e.tglMs)
  return (
    <Link
      href={`${ALK_EVENT_BASE}/${e.id_event}`}
      className={`w-full ${CARD} p-3.5 flex items-center gap-3.5 text-left active:scale-[.99] transition`}
    >
      <DateBlock d={d} m={m} tone={st.bucket === 'done' ? 'slate' : st.label === 'Berlangsung' ? 'solid' : 'red'} />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[14px] text-[#3b1417] truncate">{e.nama_event}</p>
        <p className="text-[12px] text-slate-500 truncate mt-0.5">
          {e.jamevent} · {e.alamatevent || e.jenisevent}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Pill tone={st.tone}>{st.label}</Pill>
          {e.jenisevent && <Pill tone="gold">{e.jenisevent}</Pill>}
        </div>
      </div>
    </Link>
  )
}

export function EventsListClient({
  events,
  isNasional,
}: {
  events: EventDashboard[]
  isNasional: boolean
}) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [openPage, setOpenPage] = useState(0)
  const [donePage, setDonePage] = useState(0)

  const needle = q.trim().toLowerCase()
  const filtered = useMemo(() => events.filter((e) => matchesQuery(e, needle)), [events, needle])

  const open = useMemo(
    () => filtered.filter((e) => eventStatus(e).bucket === 'open').sort((a, b) => a.tglMs - b.tglMs),
    [filtered],
  )
  const done = useMemo(
    () => filtered.filter((e) => eventStatus(e).bucket === 'done').sort((a, b) => b.tglMs - a.tglMs),
    [filtered],
  )

  // Stats stay global (unfiltered) so StatTriple doesn't jump while searching
  const terjadwal = events.filter((e) => {
    const s = eventStatus(e)
    return s.label === 'Terjadwal' || s.label === 'Berlangsung'
  }).length
  const review = events.filter((e) => {
    const s = eventStatus(e)
    return s.label === 'Review' || s.label === 'Ditolak'
  }).length
  const doneAll = events.filter((e) => eventStatus(e).bucket === 'done').length

  const openPages = Math.max(1, Math.ceil(open.length / PAGE_SIZE_EVENT))
  const donePages = Math.max(1, Math.ceil(done.length / PAGE_SIZE_EVENT))
  const pagedOpen = open.slice(openPage * PAGE_SIZE_EVENT, (openPage + 1) * PAGE_SIZE_EVENT)
  const pagedDone = done.slice(donePage * PAGE_SIZE_EVENT, (donePage + 1) * PAGE_SIZE_EVENT)

  return (
    <section>
      <PageHero
        title="Pengajuan Event"
        sub={isNasional ? 'Semua kota · jadwal & absensi' : 'Jadwal, absensi & sesi kegiatan'}
        action={{ label: 'Buat Event', onClick: () => router.push(`${ALK_EVENT_BASE}/new`) }}
        pb="pb-20"
      />
      <div className="px-5 -mt-12 relative pb-4 space-y-4">
        <StatTriple
          items={[
            [terjadwal, 'Terjadwal', 'text-[#c9232c]'],
            [review, 'Belum approve', 'text-amber-500'],
            [doneAll, 'Selesai', 'text-slate-400'],
          ]}
        />
        <SearchBox
          value={q}
          onChange={(v) => {
            setQ(v)
            setOpenPage(0)
            setDonePage(0)
          }}
          placeholder="Cari nama, tanggal, atau ID event..."
        />
        <div>
          <h3 className={`${H3} mb-3`}>Berlangsung &amp; Mendatang</h3>
          <div className="space-y-3">
            {pagedOpen.length ? pagedOpen.map((e) => <EventItem key={e.id_event} e={e} />) : <Empty>Belum ada kegiatan</Empty>}
          </div>
          <Pager page={openPage} totalPages={openPages} onChange={setOpenPage} />
        </div>
        {(done.length > 0 || needle) && (
          <div>
            <h3 className={`${H3} mb-3`}>Selesai</h3>
            <div className="space-y-3">
              {pagedDone.length ? pagedDone.map((e) => <EventItem key={e.id_event} e={e} />) : <Empty>Tidak ada yang cocok</Empty>}
            </div>
            <Pager page={donePage} totalPages={donePages} onChange={setDonePage} />
          </div>
        )}
      </div>
    </section>
  )
}
