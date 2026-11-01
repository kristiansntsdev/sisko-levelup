'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { EventDashboard } from '@/lib/actions/event'
import { NASIONAL_EVENT_CABANG, NASIONAL_KHUSUS_VALUE } from '@/lib/event-cabang'
import { ANTON, BTN_SHELL, LABEL, MONO, PANEL, PaperHeader, PaperMain, PRESS, SectionHead, Strip } from '@/components/pwa/paper-ui'
import { PAGE_SIZE_EVENT, Pager, SearchBox } from './list-tools'
import {
  ALK_EVENT_BASE,
  DateBlock,
  Empty,
  FLD,
  Field,
  Icon,
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
    <div className="flex gap-2 overflow-x-auto -mx-5 px-5 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((t) => {
        const on = t.key === active
        return (
          <button
            key={t.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(t.key)}
            className={`${LABEL} shrink-0 h-9 px-3.5 rounded-full text-[10.5px] font-bold ${PRESS} ${on ? 'bg-[#161616] text-[#ffd83d]' : 'bg-[#fffdf7] text-[#161616]'}`}
          >
            {t.label}
            {t.count != null && <span className={on ? ' text-[#fbf6ec]' : ' text-[#c21f24]'}> {t.count}</span>}
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
        aria-pressed={on}
        onClick={() => onChange(key, dir)}
        className={`${MONO} px-2.5 py-1.5 rounded-[8px] text-[11px] font-bold ${PRESS} ${on ? 'bg-[#161616] text-[#ffd83d]' : 'bg-[#fffdf7] text-[#161616]'}`}
      >
        {label}
      </button>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={`${LABEL} text-[10px] font-bold text-[#44403c] mr-1`}>Sort</span>
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
    <Link href={`${ALK_EVENT_BASE}/${e.id_event}`} className={`w-full p-3.5 flex items-center gap-3.5 text-left ${PANEL} ${PRESS}`}>
      <DateBlock d={d} m={m} tone={st.bucket === 'done' ? 'slate' : st.label === 'Berlangsung' ? 'solid' : 'red'} />
      <div className="min-w-0 flex-1">
        <p className={`${ANTON} text-[18px] leading-[1.12] tracking-[.01em] line-clamp-2`}>{e.nama_event}</p>
        <p className={`${MONO} text-[11px] text-[#44403c] truncate mt-1`}>
          {e.jamevent} · {e.cabangName}
          {e.alamatevent ? ` · ${e.alamatevent}` : ''}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Pill tone={st.tone}>{st.label}</Pill>
          {e.jenisevent && <Pill tone="gold">{e.jenisevent}</Pill>}
          {ww && <Pill tone="gold">{ww}</Pill>}
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
    <PaperMain>
      <PaperHeader
        sticker={isNasional ? 'Semua kota · jadwal & absensi' : 'Jadwal, absensi & sesi kegiatan'}
        title="Pengajuan Event"
        action={
          <button type="button" onClick={() => router.push(`${ALK_EVENT_BASE}/new`)} className={`shrink-0 rotate-2 ${BTN_SHELL}`}>
            <Strip className="px-3.5 py-2 text-[15px] whitespace-nowrap">
              <Icon name="plus" className="w-4 h-4" sw={2.4} />
              Buat Event
            </Strip>
          </button>
        }
      />
      <div className="px-5 mt-5 pb-4 space-y-3">
        <StatTriple
          items={[
            [terjadwal, 'Terjadwal', 'text-[#c21f24]'],
            [review, 'Belum approve', 'text-[#161616]'],
            [doneAll, 'Selesai', 'text-[#57534e]'],
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

        <Field label="LevelUP Kota">
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
        </Field>

        <SortBar
          sortKey={sortKey}
          sortDir={sortDir}
          onChange={(key, dir) => {
            setSortKey(key)
            setSortDir(dir)
            resetPages()
          }}
        />

        <div className="pt-3">
          <SectionHead title="Berlangsung & Mendatang" count={open.length} />
          <div className="space-y-3">
            {pagedOpen.length ? pagedOpen.map((e) => <EventItem key={e.id_event} e={e} />) : <Empty>Belum ada kegiatan</Empty>}
          </div>
          <Pager page={openPage} totalPages={openPages} onChange={setOpenPage} />
        </div>
        {(done.length > 0 || q || scope !== 'all' || ww !== 'all' || kota !== 'all') && (
          <div className="pt-3">
            <SectionHead title="Selesai" count={done.length} />
            <div className="space-y-3">
              {pagedDone.length ? pagedDone.map((e) => <EventItem key={e.id_event} e={e} />) : <Empty>Tidak ada yang cocok</Empty>}
            </div>
            <Pager page={donePage} totalPages={donePages} onChange={setDonePage} />
          </div>
        )}
      </div>
    </PaperMain>
  )
}
