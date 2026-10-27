'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { EventDashboard } from '@/lib/actions/event'
import { NASIONAL_EVENT_CABANG, NASIONAL_KHUSUS_VALUE } from '@/lib/event-cabang'
import { PAGE_SIZE_EVENT, Pager, SearchBox } from './list-tools'
import {
  ALK_EVENT_BASE,
  CARD,
  DateBlock,
  Empty,
  FLD,
  H3,
  PageHero,
  Pill,
  StatTriple,
  type PillTone,
} from './ui'

type ScopeFilter = 'all' | 'seluruh_kota' | 'khusus' | 'pending' | 'rejected'
type WwFilter = 'all' | 'bulanan' | 'jfe' | 'nasional'
type SortKey = 'tgl' | 'nama'
type SortDir = 'asc' | 'desc'

const SCOPE_TABS: { key: ScopeFilter; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'seluruh_kota', label: 'Seluruh Kota' },
  { key: 'khusus', label: 'Khusus' },
  { key: 'pending', label: 'Belum Approve' },
  { key: 'rejected', label: 'Ditolak' },
]

const WW_TABS: { key: WwFilter; label: string }[] = [
  { key: 'all', label: 'Semua WW' },
  { key: 'bulanan', label: 'Bulanan' },
  { key: 'jfe', label: 'JFE' },
  { key: 'nasional', label: 'Nasional' },
]

function isKhusus(e: EventDashboard) {
  return e.khusus === NASIONAL_KHUSUS_VALUE || e.khusus === '1'
}

function isRejected(e: EventDashboard) {
  return e.approvenasional !== '1' && e.notenasional.trim() !== ''
}

function isPending(e: EventDashboard) {
  return e.approvenasional !== '1' && e.notenasional.trim() === ''
}

function eventStatus(e: EventDashboard): { label: string; tone: PillTone; bucket: 'open' | 'done' } {
  const end = e.tglMs
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  if (isRejected(e)) return { label: 'Ditolak', tone: 'red', bucket: 'open' }
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
  return `${e.id_event} ${e.nama_event} ${e.alamatevent} ${e.tglDisplay} ${e.jamevent} ${e.jenisevent} ${e.wwtype} ${e.cabangName} ${eventStatus(e).label}`
    .toLowerCase()
    .includes(needle)
}

function ChipRow<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string; count?: number }[]
  active: T
  onChange: (k: T) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((t) => {
        const on = t.key === active
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-semibold ring-1 transition ${
              on
                ? 'bg-[#c9232c] text-white ring-[#c9232c]'
                : 'bg-white text-slate-600 ring-slate-200'
            }`}
          >
            {t.label}
            {t.count != null && <span className={on ? ' text-white/80' : ' text-slate-400'}> · {t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

function SortBar({
  sortKey,
  sortDir,
  onChange,
}: {
  sortKey: SortKey
  sortDir: SortDir
  onChange: (key: SortKey, dir: SortDir) => void
}) {
  const btn = (key: SortKey, dir: SortDir, label: string) => {
    const on = sortKey === key && sortDir === dir
    return (
      <button
        type="button"
        onClick={() => onChange(key, dir)}
        className={`px-2.5 py-1.5 rounded-lg text-[12px] font-semibold ring-1 transition ${
          on ? 'bg-[#3b1417] text-white ring-[#3b1417]' : 'bg-white text-slate-600 ring-slate-200'
        }`}
      >
        {label}
      </button>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Sort</span>
      {btn('tgl', 'asc', 'Tgl ↑')}
      {btn('tgl', 'desc', 'Tgl ↓')}
      {btn('nama', 'asc', 'Nama A–Z')}
      {btn('nama', 'desc', 'Nama Z–A')}
    </div>
  )
}

function EventItem({ e }: { e: EventDashboard }) {
  const st = eventStatus(e)
  const { d, m } = monDay(e.tglMs)
  const ww =
    e.wwtype === 'jfe' ? 'JFE' : e.wwtype === 'nasional' ? 'Nasional' : e.wwtype === 'bulanan' ? 'Bulanan' : ''
  return (
    <Link
      href={`${ALK_EVENT_BASE}/${e.id_event}`}
      className={`w-full ${CARD} p-3.5 flex items-center gap-3.5 text-left active:scale-[.99] transition`}
    >
      <DateBlock d={d} m={m} tone={st.bucket === 'done' ? 'slate' : st.label === 'Berlangsung' ? 'solid' : 'red'} />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[14px] text-[#3b1417] truncate">{e.nama_event}</p>
        <p className="text-[12px] text-slate-500 truncate mt-0.5">
          {e.jamevent} · {e.cabangName}
          {e.alamatevent ? ` · ${e.alamatevent}` : ''}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Pill tone={st.tone}>{st.label}</Pill>
          {e.jenisevent && <Pill tone="gold">{e.jenisevent}</Pill>}
          {ww && <Pill tone="slate">{ww}</Pill>}
        </div>
      </div>
    </Link>
  )
}

export type CabangOption = { id: string; nama: string }

export function EventsListClient({
  events,
  isNasional,
  cabangs,
}: {
  events: EventDashboard[]
  isNasional: boolean
  cabangs: CabangOption[]
}) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [scope, setScope] = useState<ScopeFilter>('all')
  const [ww, setWw] = useState<WwFilter>('all')
  const [kota, setKota] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('tgl')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [openPage, setOpenPage] = useState(0)
  const [donePage, setDonePage] = useState(0)

  function resetPages() {
    setOpenPage(0)
    setDonePage(0)
  }

  const scopeCounts = useMemo(() => {
    let seluruh = 0
    let khusus = 0
    let pending = 0
    let rejected = 0
    for (const e of events) {
      if (e.id_cabang === NASIONAL_EVENT_CABANG && !isKhusus(e)) seluruh++
      if (isKhusus(e)) khusus++
      if (isPending(e)) pending++
      if (isRejected(e)) rejected++
    }
    return { all: events.length, seluruh_kota: seluruh, khusus, pending, rejected }
  }, [events])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let list = events.filter((e) => matchesQuery(e, needle))

    if (scope === 'seluruh_kota') {
      list = list.filter((e) => e.id_cabang === NASIONAL_EVENT_CABANG && !isKhusus(e))
    } else if (scope === 'khusus') {
      list = list.filter(isKhusus)
    } else if (scope === 'pending') {
      list = list.filter(isPending)
    } else if (scope === 'rejected') {
      list = list.filter(isRejected)
    }

    if (ww !== 'all') list = list.filter((e) => e.wwtype === ww)
    if (kota !== 'all') list = list.filter((e) => e.id_cabang === kota)

    const dir = sortDir === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      if (sortKey === 'nama') {
        return a.nama_event.localeCompare(b.nama_event, 'id') * dir
      }
      return (a.tglMs - b.tglMs) * dir || a.nama_event.localeCompare(b.nama_event, 'id')
    })
    return list
  }, [events, q, scope, ww, kota, sortKey, sortDir])

  const open = useMemo(
    () => filtered.filter((e) => eventStatus(e).bucket === 'open'),
    [filtered],
  )
  const done = useMemo(
    () => filtered.filter((e) => eventStatus(e).bucket === 'done'),
    [filtered],
  )

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

  const kotaOptions = useMemo(() => {
    const used = new Set(events.map((e) => e.id_cabang))
    return cabangs.filter((c) => used.has(c.id) || c.id === NASIONAL_EVENT_CABANG)
  }, [cabangs, events])

  return (
    <section>
      <PageHero
        title="Pengajuan Event"
        sub={isNasional ? 'Semua kota · jadwal & absensi' : 'Jadwal, absensi & sesi kegiatan'}
        action={{ label: 'Buat Event', onClick: () => router.push(`${ALK_EVENT_BASE}/new`) }}
        pb="pb-20"
      />
      <div className="px-5 -mt-12 relative pb-4 space-y-3">
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
            resetPages()
          }}
          placeholder="Cari nama, tanggal, atau ID event..."
        />

        <ChipRow
          tabs={SCOPE_TABS.map((t) => ({ ...t, count: scopeCounts[t.key] }))}
          active={scope}
          onChange={(k) => {
            setScope(k)
            resetPages()
          }}
        />

        <ChipRow
          tabs={WW_TABS}
          active={ww}
          onChange={(k) => {
            setWw(k)
            resetPages()
          }}
        />

        <div className="grid grid-cols-1 gap-2">
          <label className="block">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              LevelUP Kota
            </span>
            <select
              value={kota}
              onChange={(e) => {
                setKota(e.target.value)
                resetPages()
              }}
              className={FLD}
            >
              <option value="all">Semua kota</option>
              <option value={NASIONAL_EVENT_CABANG}>Nasional</option>
              {kotaOptions
                .filter((c) => c.id !== NASIONAL_EVENT_CABANG)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <SortBar
          sortKey={sortKey}
          sortDir={sortDir}
          onChange={(key, dir) => {
            setSortKey(key)
            setSortDir(dir)
            resetPages()
          }}
        />

        <div>
          <h3 className={`${H3} mb-3`}>
            Berlangsung &amp; Mendatang
            <span className="text-[13px] font-semibold text-slate-400"> · {open.length}</span>
          </h3>
          <div className="space-y-3">
            {pagedOpen.length ? pagedOpen.map((e) => <EventItem key={e.id_event} e={e} />) : <Empty>Belum ada kegiatan</Empty>}
          </div>
          <Pager page={openPage} totalPages={openPages} onChange={setOpenPage} />
        </div>
        {(done.length > 0 || q || scope !== 'all' || ww !== 'all' || kota !== 'all') && (
          <div>
            <h3 className={`${H3} mb-3`}>
              Selesai
              <span className="text-[13px] font-semibold text-slate-400"> · {done.length}</span>
            </h3>
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
