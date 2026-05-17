'use client'
import { useState, useMemo, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, Button } from '@/components/ui'
import {
  KotaShell, KotaTab,
  EventDateCard, getEventStatus,
  SummaryTile, HeroCard, FilterTabs,
  KasTab,
} from '@/components/kota'
import type { KasKotaData } from '@/components/kota'
import type { EventDashboard } from '@/lib/actions/event'
import { logoutPengurus } from '@/app/admin/actions'

interface Pengurus {
  id_pengurus: number
  nama: string
  kotalevelup: string
  divisi: string | null
}

interface AlkClientProps {
  pengurus: Pengurus
  events: EventDashboard[]
  namaCabang: string
  kasKota: KasKotaData
}

// ── Icons ──────────────────────────────────────────────────────
function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>
    </svg>
  )
}
function WalletIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <path d="M16 12h2"/>
      <path d="M2 10h20"/>
    </svg>
  )
}
function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

// ── Helpers ────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

const FILTER_KEYS = ['all', 'approved', 'pending'] as const
const FILTER_LABELS: Record<string, string> = {
  all: 'Semua', approved: 'Disetujui', pending: 'Belum Approve',
}

// ── QR Sheet ──────────────────────────────────────────────────
function QRSheet({ events, onClose }: { events: EventDashboard[]; onClose: () => void }) {
  const [selectedId, setSelectedId] = useState<number>(events[0]?.id_event ?? 0)
  const [origin, setOrigin] = useState('')

  useEffect(() => { setOrigin(window.location.origin) }, [])

  const joinUrl = origin && selectedId ? `${origin}/join/${selectedId}` : ''
  const qrSrc = joinUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(joinUrl)}`
    : ''

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[480px] mx-auto bg-surface rounded-t-[24px] px-5 pt-3 pb-10">
        <div className="w-9 h-1 rounded-full bg-border mx-auto mb-5" />
        <p className="text-[18px] font-bold text-fg mb-4">Generate QR Event</p>

        {events.length === 0 ? (
          <p className="text-[14px] text-muted text-center py-6">Tidak ada event bulan ini.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[13px] font-medium text-fg2 mb-1.5">Pilih Event</p>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(Number(e.target.value))}
                className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent appearance-none"
              >
                {events.map((e) => (
                  <option key={e.id_event} value={e.id_event}>{e.nama_event}</option>
                ))}
              </select>
            </div>

            {qrSrc && (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-2 rounded-[16px] border border-border shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrSrc} alt="QR Event" width={260} height={260} className="rounded-[8px]" />
                </div>
                <p className="text-[11px] text-muted text-center px-4">
                  Peserta scan QR ini untuk mendaftar ke event
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Scan Sheet ────────────────────────────────────────────────
function ScanSheet({ events, onClose }: { events: EventDashboard[]; onClose: () => void }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<number>(events[0]?.id_event ?? 0)

  function handleStart() {
    if (!selectedId) return
    onClose()
    router.push(`/dashboard/kota/alk/scanner?eventId=${selectedId}`)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[480px] mx-auto bg-surface rounded-t-[24px] px-5 pt-3 pb-10">
        <div className="w-9 h-1 rounded-full bg-border mx-auto mb-5" />
        <p className="text-[18px] font-bold text-fg mb-4">Scan QR Event</p>

        {events.length === 0 ? (
          <p className="text-[14px] text-muted text-center py-6">Tidak ada event bulan ini.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[13px] font-medium text-fg2 mb-1.5">Pilih Event</p>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(Number(e.target.value))}
                className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent appearance-none"
              >
                {events.map((e) => (
                  <option key={e.id_event} value={e.id_event}>{e.nama_event}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleStart}
              disabled={!selectedId}
              className="w-full py-3.5 rounded-input bg-green text-white font-semibold text-[15px] disabled:opacity-50 transition-opacity"
            >
              Mulai Scan
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace('.', ',')} jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(1).replace('.', ',')} rb`
  return `Rp ${n}`
}

// ── Beranda tab ────────────────────────────────────────────────
function BerandaTab({ pengurus, events, namaCabang, saldo }: { pengurus: Pengurus; events: EventDashboard[]; namaCabang: string; saldo: number }) {
  const router = useRouter()
  const [showQR, setShowQR] = useState(false)
  const [showScan, setShowScan] = useState(false)

  const now = new Date()

  const counts = useMemo(() => {
    let upcoming = 0, ongoing = 0, past = 0
    for (const e of events) {
      const s = getEventStatus(e.tglMs)
      if (s === 'upcoming') upcoming++
      else if (s === 'ongoing') ongoing++
      else past++
    }
    return { upcoming, ongoing, past }
  }, [events])

  const thisMonthEvents = useMemo(() => {
    return events.filter((e) => {
      const d = new Date(e.tglMs)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
  }, [events]) // eslint-disable-line react-hooks/exhaustive-deps

  const initials = pengurus.nama.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-[480px] mx-auto px-4 flex flex-col gap-4 pb-6">
      {/* Greeting */}
      <div className="flex items-center gap-3 pt-5">
        <Avatar initials={initials} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold text-fg truncate">{getGreeting()}, {pengurus.nama}</p>
          <p className="text-[12px] text-muted mt-0.5">Pengurus ALK · {namaCabang}</p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-surface border border-border rounded-card p-4 flex flex-col gap-1">
          <p className="text-[11px] text-muted uppercase tracking-wider">Saldo Kas</p>
          <p className="text-[20px] font-bold text-green leading-tight">{fmtShort(saldo)}</p>
        </div>
        <div className="bg-surface border border-border rounded-card p-4 flex flex-col gap-1">
          <p className="text-[11px] text-muted uppercase tracking-wider">Total Event</p>
          <p className="text-[20px] font-bold text-accent leading-tight">{events.length}</p>
          <p className="text-[11px] text-muted">event</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setShowQR(true)}
          className="bg-surface border border-border rounded-card p-3.5 flex flex-col items-start gap-2 cursor-pointer text-left transition-all hover:border-accent hover:bg-accent-light"
        >
          <div className="w-9 h-9 rounded-[10px] bg-purple-light text-purple flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path d="M14 14h3v3"/><path d="M17 21v-3h3"/><path d="M14 21h3"/>
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-fg leading-tight">Generate QR</span>
        </button>
        <button
          onClick={() => setShowScan(true)}
          className="bg-surface border border-border rounded-card p-3.5 flex flex-col items-start gap-2 cursor-pointer text-left transition-all hover:border-accent hover:bg-accent-light"
        >
          <div className="w-9 h-9 rounded-[10px] bg-green-light text-green flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-fg leading-tight">Scan QR</span>
        </button>
      </div>

      {/* This month events */}
      <div>
        <p className="text-[15px] font-bold text-fg mb-2.5">Event {monthName}</p>
        {thisMonthEvents.length === 0 ? (
          <div className="bg-surface border border-border rounded-card px-4 py-8 flex flex-col items-center">
            <p className="text-[13px] text-muted">Tidak ada event bulan ini.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {thisMonthEvents.map((e) => (
              <EventDateCard key={e.id_event} event={e} onClick={() => router.push(`/dashboard/kota/alk/event/${e.id_event}`)} />
            ))}
          </div>
        )}
      </div>

      {showQR && (
        <QRSheet events={thisMonthEvents.length > 0 ? thisMonthEvents : events.slice(0, 10)} onClose={() => setShowQR(false)} />
      )}
      {showScan && (
        <ScanSheet events={thisMonthEvents.length > 0 ? thisMonthEvents : events.slice(0, 10)} onClose={() => setShowScan(false)} />
      )}
    </div>
  )
}

// ── Event tab ──────────────────────────────────────────────────
function EventTab({ events }: { events: EventDashboard[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState('all')

  const { filtered, counts } = useMemo(() => {
    const isApproved = (e: EventDashboard) => e.approvenasional === '1'
    const counts = { all: events.length, approved: 0, pending: 0 }
    for (const e of events) {
      if (isApproved(e)) counts.approved++
      else counts.pending++
    }
    const sorted = [...events].sort((a, b) => b.tglMs - a.tglMs)
    return {
      filtered: filter === 'all' ? sorted
        : filter === 'approved' ? sorted.filter(isApproved)
        : sorted.filter((e) => !isApproved(e)),
      counts,
    }
  }, [events, filter])

  const filterTabs = FILTER_KEYS.map((k) => ({ key: k, label: FILTER_LABELS[k], count: counts[k] }))

  return (
    <div className="max-w-[480px] mx-auto px-4 flex flex-col gap-4 pb-6">
      <div className="pt-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-fg">Event</h1>
          <p className="text-[12px] text-muted mt-0.5">
            {counts.approved} disetujui · {counts.pending} belum approve
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/kota/alk/event/new')}
          className="mt-1 shrink-0 px-3.5 py-2 bg-accent text-white rounded-full text-[13px] font-semibold flex items-center gap-1.5"
        >
          <span>+</span> Buat Event
        </button>
      </div>

      <HeroCard
        label="Total Event Wilayah"
        amount={`${events.length} event`}
        meta={[
          { label: 'Disetujui', value: counts.approved },
          { label: 'Belum Approve', value: counts.pending },
        ]}
      />

      <FilterTabs tabs={filterTabs} active={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-muted">Tidak ada event.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((e) => (
            <EventDateCard key={e.id_event} event={e} onClick={() => router.push(`/dashboard/kota/alk/event/${e.id_event}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Akun tab ───────────────────────────────────────────────────
function AkunTab({ pengurus, namaCabang }: { pengurus: Pengurus; namaCabang: string }) {
  const [pending, startTransition] = useTransition()
  const initials = pengurus.nama.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  function handleLogout() {
    startTransition(async () => { await logoutPengurus() })
  }

  const menuRows = [
    { label: 'Divisi', value: (pengurus.divisi ?? 'alk').toUpperCase() },
    { label: 'Wilayah', value: namaCabang },
  ]

  return (
    <div className="max-w-[480px] mx-auto px-4 flex flex-col gap-4 pb-6">
      <div style={{ paddingTop: 18 }} />

      {/* Profile card */}
      <div className="bg-surface border border-border rounded-[20px] px-[18px] py-6 flex flex-col items-center gap-1 text-center">
        <div className="w-[84px] h-[84px] rounded-full bg-accent text-white flex items-center justify-center text-[28px] font-bold mb-2">
          {initials}
        </div>
        <p className="text-[18px] font-bold text-fg">{pengurus.nama}</p>
        <p className="text-[13px] text-muted">Pengurus · ALK</p>
        <span className="mt-1.5 text-[12px] font-semibold text-accent bg-accent-light px-2.5 py-1 rounded-full">
          {(pengurus.divisi ?? 'alk').toUpperCase()}
        </span>
      </div>

      {/* Info rows */}
      <div className="bg-surface border border-border rounded-[16px] overflow-hidden">
        {menuRows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center gap-3.5 px-4 py-3.5 ${i > 0 ? 'border-t border-border' : ''}`}
          >
            <p className="text-[14px] font-medium text-fg flex-1">{row.label}</p>
            <p className="text-[13px] text-muted">{row.value}</p>
            <ChevronIcon />
          </div>
        ))}
      </div>

      {/* Logout */}
      <Button
        variant="danger"
        fullWidth
        size="lg"
        onClick={handleLogout}
        loading={pending}
      >
        Keluar
      </Button>

      <p className="text-center text-[11px] text-subtle pb-2">Dashboard ALK · sisko-v2</p>
    </div>
  )
}

// ── Shell ──────────────────────────────────────────────────────
const TABS: KotaTab[] = [
  { id: 'beranda', label: 'Beranda', icon: <HomeIcon /> },
  { id: 'event',   label: 'Event',   icon: <CalendarIcon /> },
  { id: 'kas',     label: 'Kas',     icon: <WalletIcon /> },
  { id: 'akun',    label: 'Akun',    icon: <UserIcon /> },
]

export function AlkClient({ pengurus, events, namaCabang, kasKota }: AlkClientProps) {
  const [activeTab, setActiveTab] = useState('beranda')

  const tabContent = {
    beranda: <BerandaTab pengurus={pengurus} events={events} namaCabang={namaCabang} saldo={kasKota.saldo} />,
    event:   <EventTab events={events} />,
    kas:     <KasTab kasKota={kasKota} />,
    akun:    <AkunTab pengurus={pengurus} namaCabang={namaCabang} />,
  }

  return (
    <KotaShell
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabContent={tabContent}
    >
      {null}
    </KotaShell>
  )
}
