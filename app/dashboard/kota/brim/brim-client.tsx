'use client'
import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui'
import { KotaShell, type KotaTab } from '@/components/kota'
import { logoutPengurus } from '@/app/admin/actions'
import { savePengaturanKota } from '@/lib/actions/brim'

interface Pengaturan {
  logo: string
}

interface Props {
  nama: string
  kotalevelup: string
  pengaturan: Pick<Pengaturan, 'logo'> | null
}

// ── Icons ───────────────────────────────────────────────────────
function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>
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
          <p className="text-xs text-muted mt-0.5">Pengurus BRIM · LevelUP {kotalevelup}</p>
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
      </section>
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
    action(fd)
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
  { id: 'settings', label: 'Pengaturan', icon: <SettingsIcon /> },
]

export function BrimClient({ nama, kotalevelup, pengaturan }: Props) {
  const [activeTab, setActiveTab] = useState('home')

  const tabContent = {
    home: <HomeTab nama={nama} kotalevelup={kotalevelup} />,
    settings: <SettingsTab pengaturan={pengaturan} />,
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
