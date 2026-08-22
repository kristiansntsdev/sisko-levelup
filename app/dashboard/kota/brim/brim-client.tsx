'use client'
import { startTransition, useActionState, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui'
import { KotaShell, type KotaTab, EventDateCard, HeroCard, FilterTabs, eventMatchesQuery } from '@/components/kota'
import { logoutPengurus } from '@/app/admin/actions'
import { savePengaturanKota } from '@/lib/actions/brim'
import type { EventDashboard } from '@/lib/actions/event'
import { hasBrimRejectNote } from '@/lib/event-approval'

interface Pengaturan {
  logo: string
}

interface Props {
  nama: string
  kotalevelup: string
  pengaturan: Pick<Pengaturan, 'logo'> | null
  events: EventDashboard[]
  isNasional: boolean
}

// ── Icons ───────────────────────────────────────────────────────
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
function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
function FlyerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
      <rect x="4" y="3" width="16" height="18" rx="2"/>
      <path d="M8 8h8M8 12h8M8 16h5"/>
    </svg>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 10) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ── Home tab ────────────────────────────────────────────────────
function HomeTab({ nama, kotalevelup }: { nama: string; kotalevelup: string }) {
  const router = useRouter()
  return (
    <div className="max-w-[480px] mx-auto px-4 flex flex-col gap-4 pb-6">
      <div className="pt-5 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-accent">{getInitials(nama)}</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-fg leading-snug">{getGreeting()}, {nama}</h1>
          <p className="text-xs text-muted mt-0.5">Pengurus BRIM · {kotalevelup}</p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <p className="font-semibold text-fg">Menu</p>
        <button
          type="button"
          onClick={() => router.push('/dashboard/kota/brim/pamflet')}
          className="text-left"
        >
          <Card variant="elevated" className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
                  <FlyerIcon />
                </div>
                <div>
                  <p className="font-semibold text-fg">Flyer Generator</p>
                  <p className="text-xs text-muted mt-0.5">Buat pamflet acara dalam hitungan detik</p>
                </div>
              </div>
              <span className="text-muted text-lg">→</span>
            </div>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard/kota/brim/dokumentasi')}
          className="text-left"
        >
          <Card variant="elevated" className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12l-10 10L2 12 7 2h10z"/>
                    <path d="M22 12H2"/><path d="M12 22V12"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-fg">Dokumentasi Kota</p>
                  <p className="text-xs text-muted mt-0.5">Link Drive & akses anggota per event</p>
                </div>
              </div>
              <span className="text-muted text-lg">→</span>
            </div>
          </Card>
        </button>
      </section>
    </div>
  )
}

const EVENT_PAGE_SIZE = 10
const NASIONAL_FILTER_KEYS = ['all', 'seluruh_kota', 'khusus', 'pending', 'rejected'] as const
const NASIONAL_FILTER_LABELS: Record<(typeof NASIONAL_FILTER_KEYS)[number], string> = {
  all: 'Semua',
  seluruh_kota: 'Seluruh Kota',
  khusus: 'Khusus',
  pending: 'Belum Approve',
  rejected: 'Ditolak',
}

function EventTab({ events }: { events: EventDashboard[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')

  const { filtered, counts, filterTabs } = useMemo(() => {
    const sorted = [...events].sort((a, b) => b.tglMs - a.tglMs)
    const seluruh = sorted.filter((e) => e.khusus !== '1')
    const khusus = sorted.filter((e) => e.khusus === '1')
    const pending = sorted.filter(
      (e) => e.approvebrimnas !== '1' && !hasBrimRejectNote(e.notenasional),
    )
    const rejected = sorted.filter(
      (e) => e.approvebrimnas !== '1' && hasBrimRejectNote(e.notenasional),
    )
    const counts = {
      all: events.length,
      seluruh_kota: seluruh.length,
      khusus: khusus.length,
      pending: pending.length,
      rejected: rejected.length,
    }
    const filtered =
      filter === 'seluruh_kota' ? seluruh
      : filter === 'khusus' ? khusus
      : filter === 'pending' ? pending
      : filter === 'rejected' ? rejected
      : sorted
    const filterTabs = NASIONAL_FILTER_KEYS.map((k) => ({
      key: k,
      label: NASIONAL_FILTER_LABELS[k],
      count: counts[k],
    }))
    return { filtered, counts, filterTabs }
  }, [events, filter])

  const searched = useMemo(() => {
    if (!q.trim()) return filtered
    return [...events]
      .sort((a, b) => b.tglMs - a.tglMs)
      .filter((e) => eventMatchesQuery(e, q))
  }, [events, filtered, q])
  const searching = q.trim() !== ''
  const totalPages = Math.max(1, Math.ceil(searched.length / EVENT_PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paged = searching
    ? searched
    : searched.slice(safePage * EVENT_PAGE_SIZE, (safePage + 1) * EVENT_PAGE_SIZE)

  return (
    <div className="max-w-[480px] mx-auto px-4 flex flex-col gap-4 pb-6">
      <div className="pt-5">
        <h1 className="text-[22px] font-bold text-fg">Event</h1>
        <p className="text-[12px] text-muted mt-0.5">
          {counts.pending} belum approve Brim · {counts.rejected} ditolak Brim
        </p>
      </div>

      <HeroCard
        label="Total Event Nasional"
        amount={`${events.length} event`}
        meta={[
          { label: 'Belum Approve', value: counts.pending },
          { label: 'Ditolak', value: counts.rejected },
        ]}
      />

      <FilterTabs
        tabs={filterTabs}
        active={filter}
        onChange={(next) => {
          setFilter(next)
          setPage(0)
        }}
      />

      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setPage(0)
        }}
        placeholder="Cari nama, alamat, tanggal, atau ID…"
        className="w-full rounded-[14px] border border-border bg-surface px-3.5 py-3 text-[14px] text-fg placeholder:text-subtle focus:outline-none focus:border-accent"
      />

      {searched.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-muted">{searching ? 'Event tidak ditemukan.' : 'Tidak ada event.'}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {paged.map((e) => (
              <EventDateCard
                key={e.id_event}
                event={e}
                onClick={() => router.push(`/dashboard/kota/brim/event/${e.id_event}/approve`)}
                action={
                  e.approvebrimnas !== '1' ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/kota/brim/event/${e.id_event}/approve`)}
                      className="w-full py-2.5 bg-accent text-white rounded-[12px] text-[13px] font-semibold cursor-pointer hover:opacity-90"
                    >
                      Lihat Event
                    </button>
                  ) : undefined
                }
              />
            ))}
          </div>
          {!searching && totalPages > 1 ? (
            <div className="flex items-center justify-between gap-2 pt-1 pb-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="text-[13px] px-3 py-1.5 rounded-[10px] border border-border bg-surface cursor-pointer disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-[12px] text-muted">
                {safePage + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="text-[13px] px-3 py-1.5 rounded-[10px] border border-border bg-surface cursor-pointer disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

// ── Settings tab ────────────────────────────────────────────────
function SettingsTab({ pengaturan }: { pengaturan: Pengaturan | null }) {
  const [state, action, pending] = useActionState(savePengaturanKota, null)
  const [logoutPending, startLogout] = useTransition()
  const [logo, setLogo] = useState(pengaturan?.logo ?? '')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setLogo(pengaturan?.logo ?? '') }, [pengaturan])

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => setLogo(String(ev.target?.result ?? ''))
    r.readAsDataURL(f)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('logo', logo)
    startTransition(() => action(fd))
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 pb-8">
      <div className="pt-5 mb-5">
        <h1 className="text-[22px] font-bold text-fg">Pengaturan</h1>
        <p className="text-[12px] text-muted mt-0.5">Logo kota untuk elemen flyer</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <p className="text-[15px] font-semibold text-fg">Logo Kota</p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl border border-border bg-surface flex items-center justify-center shrink-0 overflow-hidden">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Logo kota" className="w-full h-full object-contain p-2" />
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 border-2 border-dashed border-border rounded-xl text-sm font-semibold text-muted hover:border-accent hover:text-accent transition-colors"
              >
                {logo ? 'Ganti logo' : 'Upload logo'}
              </button>
              {logo && (
                <button type="button" onClick={() => setLogo('')} className="text-xs text-red-500 font-medium text-left">
                  Hapus
                </button>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleLogoUpload} />
        </section>

        {state?.error && <p className="text-sm text-red-500 font-medium">{state.error}</p>}
        {state?.success && <p className="text-sm text-green-600 font-medium">Logo tersimpan.</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3.5 rounded-2xl bg-accent text-white font-semibold text-sm disabled:opacity-60"
        >
          {pending ? 'Menyimpan…' : 'Simpan'}
        </button>

        <div className="pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => startLogout(async () => { await logoutPengurus() })}
            disabled={logoutPending}
            className="w-full py-3.5 rounded-2xl border border-border text-muted font-semibold text-sm disabled:opacity-60"
          >
            {logoutPending ? 'Keluar…' : 'Keluar'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Shell ───────────────────────────────────────────────────────
const TABS: KotaTab[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon /> },
  { id: 'event', label: 'Event', icon: <CalendarIcon /> },
  { id: 'settings', label: 'Pengaturan', icon: <SettingsIcon /> },
]

const TABS_KOTA: KotaTab[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon /> },
  { id: 'settings', label: 'Pengaturan', icon: <SettingsIcon /> },
]

export function BrimClient({ nama, kotalevelup, pengaturan, events, isNasional }: Props) {
  const [activeTab, setActiveTab] = useState('home')

  const tabContent = {
    home: <HomeTab nama={nama} kotalevelup={kotalevelup} />,
    event: <EventTab events={events} />,
    settings: <SettingsTab pengaturan={pengaturan} />,
  }

  return (
    <KotaShell
      tabs={isNasional ? TABS : TABS_KOTA}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabContent={tabContent}
    >
      {null}
    </KotaShell>
  )
}
