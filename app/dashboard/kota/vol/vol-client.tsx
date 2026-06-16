'use client'
import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, Button } from '@/components/ui'
import {
  KotaShell, KotaTab,
  EventDateCard, getEventStatus,
} from '@/components/kota'
import type { EventDashboard } from '@/lib/actions/event'
import { logoutPengurus } from '@/app/admin/actions'

interface Pengurus {
  id_pengurus: number
  nama: string
  kotalevelup: string
  divisi: string | null
}

interface VolClientProps {
  pengurus: Pengurus
  events: EventDashboard[]
  namaCabang: string
}

// ── Icons ──────────────────────────────────────────────────────
function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>
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

// ── Beranda tab ────────────────────────────────────────────────
function BerandaTab({
  pengurus,
  events,
  namaCabang,
}: {
  pengurus: Pengurus
  events: EventDashboard[]
  namaCabang: string
}) {
  const router = useRouter()
  const now = new Date()

  const thisMonthEvents = useMemo(() => {
    return events.filter((e) => {
      const d = new Date(e.tglMs)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
  }, [events]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const initials = pengurus.nama.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-[480px] mx-auto px-4 flex flex-col gap-4 pb-6">
      {/* Greeting */}
      <div className="flex items-center gap-3 pt-5">
        <Avatar initials={initials} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold text-fg truncate">{getGreeting()}, {pengurus.nama}</p>
          <p className="text-[12px] text-muted mt-0.5">Pengurus VOL · {namaCabang}</p>
        </div>
      </div>

      {/* Summary tile */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-surface border border-border rounded-card p-4 flex flex-col gap-1">
          <p className="text-[11px] text-muted uppercase tracking-wider">Total</p>
          <p className="text-[20px] font-bold text-accent leading-tight">{events.length}</p>
          <p className="text-[11px] text-muted">event</p>
        </div>
        <div className="bg-surface border border-border rounded-card p-4 flex flex-col gap-1">
          <p className="text-[11px] text-muted uppercase tracking-wider">Aktif</p>
          <p className="text-[20px] font-bold text-green leading-tight">{counts.ongoing + counts.upcoming}</p>
          <p className="text-[11px] text-muted">event</p>
        </div>
        <div className="bg-surface border border-border rounded-card p-4 flex flex-col gap-1">
          <p className="text-[11px] text-muted uppercase tracking-wider">Selesai</p>
          <p className="text-[20px] font-bold text-fg2 leading-tight">{counts.past}</p>
          <p className="text-[11px] text-muted">event</p>
        </div>
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
              <EventDateCard
                key={e.id_event}
                event={e}
                onClick={() => router.push(`/dashboard/kota/vol/event/${e.id_event}`)}
              />
            ))}
          </div>
        )}
      </div>
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
    { label: 'Divisi', value: (pengurus.divisi ?? 'vol').toUpperCase() },
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
        <p className="text-[13px] text-muted">Pengurus · VOL</p>
        <span className="mt-1.5 text-[12px] font-semibold text-accent bg-accent-light px-2.5 py-1 rounded-full">
          {(pengurus.divisi ?? 'vol').toUpperCase()}
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

      <p className="text-center text-[11px] text-subtle pb-2">Dashboard VOL · sisko-v2</p>
    </div>
  )
}

// ── Shell ──────────────────────────────────────────────────────
const TABS: KotaTab[] = [
  { id: 'beranda', label: 'Beranda', icon: <HomeIcon /> },
  { id: 'akun',    label: 'Akun',    icon: <UserIcon /> },
]

export function VolClient({ pengurus, events, namaCabang }: VolClientProps) {
  const [activeTab, setActiveTab] = useState('beranda')

  const tabContent = {
    beranda: <BerandaTab pengurus={pengurus} events={events} namaCabang={namaCabang} />,
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
