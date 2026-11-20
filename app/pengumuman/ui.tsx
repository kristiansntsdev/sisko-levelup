'use client'
import Link from 'next/link'
import { useActionState, useState, type ReactNode } from 'react'
import { loginPengumuman, logoutPengumuman } from '@/lib/actions/pengumuman'
import type { ItemPengumuman } from '@/lib/push/pengumuman'
import type { PenggunaPush, RingkasanPush } from '@/lib/push/pengguna'
import type { Platform } from '@/lib/push/target'
import { paper } from '@/components/landing/paper'
import { ID_FONTS, Sparkle } from '@/components/pwa/member-card'
import {
  ANTON, BTN_SHELL, ERROR, LABEL, LIFTED, LogoChip, MONO, PANEL, PAPER_INPUT, PaperNote, RED, StickerLabel, Strip, TORN_EDGE,
} from '@/components/pwa/paper-ui'
import { Icon } from '@/components/pwa/ui'
import { Waktu } from '@/components/pwa/waktu'

/** Halaman admin desktop-first (tetap responsif): lebar penuh sampai 6xl, bukan kolom HP 430px. */
export const WRAP = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'
const INPUT = PAPER_INPUT.replace('text-[16px]', 'text-[15px]')

function Halaman({ children }: { children: ReactNode }) {
  return (
    <main className={`${ID_FONTS} min-h-screen bg-[#efe8da] text-[#161616] font-[family-name:var(--font-proto)]`} style={paper()}>
      {children}
    </main>
  )
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginPengumuman, null)
  const [lihat, setLihat] = useState(false)
  return (
    <Halaman>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <LogoChip />
          </div>
          <form action={action} className={`relative ${PANEL} p-6 space-y-5`}>
            <span aria-hidden className="absolute -top-2 left-1/2 -translate-x-1/2 rotate-2 w-20 h-4 bg-[#ffd83d]/85" />
            <div>
              <StickerLabel>Pusat · Notifikasi HP</StickerLabel>
              <h1 className={`${ANTON} mt-3 text-[32px] leading-none`}>Pengumuman</h1>
              <p className={`${MONO} mt-2 text-[12px] text-[#57534e]`}>Masukkan password untuk mengelola pengumuman.</p>
            </div>
            <label className="block">
              <span className={`${LABEL} block mb-1.5 text-[10px] font-bold text-[#44403c]`}>Password</span>
              <span className="relative block">
                <input name="password" type={lihat ? 'text' : 'password'} autoComplete="current-password" required autoFocus className={`${INPUT} pr-12`} />
                <button
                  type="button"
                  onClick={() => setLihat((v) => !v)}
                  aria-label={lihat ? 'Sembunyikan password' : 'Tampilkan password'}
                  aria-pressed={lihat}
                  className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-[#57534e] hover:text-[#161616]"
                >
                  <Icon name={lihat ? 'eyeOff' : 'eye'} className="w-5 h-5" />
                </button>
              </span>
            </label>
            {state?.error && <p role="alert" className={ERROR}>{state.error}</p>}
            <button type="submit" disabled={pending} className={`block w-full ${BTN_SHELL}`}>
              <Strip>{pending ? 'Memeriksa…' : 'Masuk'}</Strip>
            </button>
          </form>
        </div>
      </div>
    </Halaman>
  )
}

const TAB: { key: 'daftar' | 'pengguna'; href: string; label: string; icon: 'megaphone' | 'users' }[] = [
  { key: 'daftar', href: '/pengumuman', label: 'Daftar Pengumuman', icon: 'megaphone' },
  { key: 'pengguna', href: '/pengumuman/pengguna', label: 'Pengguna Aktif', icon: 'users' },
]

export function BuatButton({ className = '' }: { className?: string }) {
  return (
    <Link href="/pengumuman/baru" className={`block ${BTN_SHELL} ${className}`}>
      <Strip className="px-5 py-2.5 text-[17px]">
        <Icon name="plus" className="w-5 h-5" />
        Buat Pengumuman
      </Strip>
    </Link>
  )
}

export function Shell({ aktif, judul, children }: { aktif: 'daftar' | 'pengguna' | 'baru'; judul?: string; children: ReactNode }) {
  return (
    <Halaman>
      <header className="border-b-2 border-dotted border-[#161616]/25">
        <div className={`${WRAP} pt-6 pb-5 flex flex-wrap items-center gap-x-6 gap-y-4`}>
          <LogoChip />
          <div className="min-w-0">
            <StickerLabel>Pusat · Notifikasi HP</StickerLabel>
            <h1 className={`${ANTON} mt-2 flex items-center gap-2 text-[32px] sm:text-[40px] leading-none`}>
              {judul ?? 'Pengumuman'}
              <Sparkle size={20} fill={RED} />
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {aktif !== 'baru' && <BuatButton />}
            <form action={logoutPengumuman}>
              <button type="submit" className={`${LABEL} text-[11px] font-bold text-[#57534e] underline underline-offset-4 decoration-dotted hover:text-[#161616]`}>
                Keluar
              </button>
            </form>
          </div>
        </div>
        <nav className={`${WRAP} flex gap-1 overflow-x-auto`} aria-label="Menu pengumuman">
          {TAB.map((t) => {
            const on = aktif === t.key
            return (
              <Link
                key={t.key}
                href={t.href}
                aria-current={on ? 'page' : undefined}
                className={`${LABEL} shrink-0 flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold transition ${
                  on ? 'bg-[#161616] text-[#ffd83d]' : 'text-[#44403c] hover:bg-[#161616]/[.06]'
                }`}
                style={on ? TORN_EDGE : undefined}
              >
                <Icon name={t.icon} className="w-4 h-4" />
                {t.label}
              </Link>
            )
          })}
        </nav>
      </header>
      <div className={`${WRAP} py-6 lg:py-8`}>{children}</div>
    </Halaman>
  )
}

export function Stat({ label, nilai, tone = 'plain' }: { label: string; nilai: ReactNode; tone?: 'plain' | 'red' | 'gold' }) {
  const warna = tone === 'red' ? 'text-[#e02a2f]' : 'text-[#161616]'
  return (
    <div className={`${PANEL} relative px-4 py-3.5`}>
      {tone === 'gold' && <span aria-hidden className="absolute -top-1.5 right-4 rotate-6 w-10 h-3 bg-[#ffd83d]/90" />}
      <p className={`${LABEL} text-[9.5px] font-bold text-[#57534e]`}>{label}</p>
      <p className={`${ANTON} mt-1 text-[30px] leading-none ${warna}`}>{nilai}</p>
    </div>
  )
}

function Halamanasi({ halaman, total, perHalaman, href }: { halaman: number; total: number; perHalaman: number; href: (p: number) => string }) {
  const akhir = Math.max(1, Math.ceil(total / perHalaman))
  if (akhir <= 1) return null
  const tombol = (p: number, label: string, mati: boolean) =>
    mati ? (
      <span className={`${LABEL} px-3 py-2 text-[10.5px] font-bold text-[#57534e]/50`}>{label}</span>
    ) : (
      <Link href={href(p)} className={`${LABEL} px-3 py-2 text-[10.5px] font-bold ring-2 ring-inset ring-[#161616] hover:bg-[#161616] hover:text-[#ffd83d] transition`}>
        {label}
      </Link>
    )
  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <p className={`${MONO} text-[12px] text-[#57534e]`}>
        Halaman {halaman} dari {akhir} · {total} data
      </p>
      <div className="flex gap-2">
        {tombol(halaman - 1, '← Sebelumnya', halaman <= 1)}
        {tombol(halaman + 1, 'Berikutnya →', halaman >= akhir)}
      </div>
    </div>
  )
}

function Kosong({ children, aksi }: { children: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="rounded-[14px] border-2 border-dashed border-[#161616]/30 px-6 py-14 text-center">
      <p className={`${MONO} text-[13px] text-[#44403c]`}>{children}</p>
      {aksi && <div className="mt-5 inline-block">{aksi}</div>}
    </div>
  )
}

const BELUM_MIGRASI = 'Tabel notifikasi belum ada di database. Jalankan prod-migrate (otomatis saat deploy) lalu muat ulang.'

// ───────────────────────── daftar pengumuman ─────────────────────────

const KOLOM_PENGUMUMAN = 'lg:grid lg:grid-cols-[150px_minmax(0,1fr)_200px_150px] lg:gap-6 lg:items-start'

export function DaftarPengumuman({
  siap,
  items,
  total,
  halaman,
  perHalaman,
  ringkasan,
}: {
  siap: boolean
  items: ItemPengumuman[]
  total: number
  halaman: number
  perHalaman: number
  ringkasan: RingkasanPush | null
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Pengumuman terkirim" nilai={total} tone="gold" />
        <Stat label="Perangkat aktif" nilai={ringkasan?.perangkat ?? '–'} tone="red" />
        <Stat label="Anggota aktif" nilai={ringkasan?.anggota ?? '–'} />
        <Stat label="Pengurus aktif" nilai={ringkasan?.pengurus ?? '–'} />
      </div>

      {!siap ? (
        <PaperNote>{BELUM_MIGRASI}</PaperNote>
      ) : items.length === 0 ? (
        <Kosong aksi={<BuatButton />}>Belum ada pengumuman. Kirim yang pertama ke nomormu sendiri dulu untuk mencoba.</Kosong>
      ) : (
        <section className={`${PANEL} overflow-hidden`}>
          <div className={`hidden ${KOLOM_PENGUMUMAN} px-5 py-3 border-b-2 border-[#161616] ${LABEL} text-[10px] font-bold text-[#44403c]`}>
            <span>Waktu</span>
            <span>Pengumuman</span>
            <span>Penerima</span>
            <span className="text-right">Terkirim</span>
          </div>
          <ul className="divide-y-2 divide-dotted divide-[#161616]/20">
            {items.map((p) => {
              const persen = p.perangkat ? Math.round((p.terkirim / p.perangkat) * 100) : 0
              return (
                <li key={p.id} className={`${KOLOM_PENGUMUMAN} px-5 py-4 flex flex-col gap-3 hover:bg-[#efe8da]/40 transition`}>
                  <Waktu ms={p.waktuMs} className={`${MONO} block text-[12px] text-[#57534e] lg:pt-1`} />
                  <div className="flex gap-4 min-w-0">
                    {p.gambar && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.gambar} alt="" className={`w-16 h-16 shrink-0 rounded-[8px] object-cover bg-[#efe8da] ring-1 ring-[#161616]/15 -rotate-2 ${LIFTED}`} />
                    )}
                    <div className="min-w-0">
                      <p className={`${ANTON} text-[19px] leading-tight tracking-[.01em]`}>{p.judul}</p>
                      <p className={`${MONO} mt-1 text-[12.5px] leading-relaxed text-[#44403c] break-words`}>{p.isi}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <p className={`${LABEL} inline-flex items-center gap-1 text-[9.5px] font-bold text-[#57534e]`}>
                          <Icon name="link" className="w-3 h-3" />
                          {p.url || 'Halaman pengumuman'}
                        </p>
                        <a
                          href={`/dashboard/pengumuman/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`${LABEL} inline-flex items-center gap-1 text-[9.5px] font-bold text-[#c21f24] underline underline-offset-4 decoration-dotted`}
                        >
                          <Icon name="eye" className="w-3 h-3" />
                          Lihat
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex lg:flex-col items-center lg:items-start gap-2">
                    <span
                      className={`${LABEL} inline-block -rotate-2 px-2 py-1 text-[10px] font-bold ${
                        p.semua ? 'bg-[#e02a2f] text-white' : 'ring-2 ring-[#161616] text-[#161616]'
                      }`}
                    >
                      {p.target}
                    </span>
                    <span className={`${MONO} text-[11.5px] text-[#57534e]`}>{p.cocok} penerima cocok</span>
                  </div>
                  <div className="lg:text-right">
                    <p className={`${ANTON} text-[26px] leading-none`}>
                      {p.terkirim}
                      <span className={`${MONO} text-[13px] text-[#57534e] font-bold tracking-normal`}> / {p.perangkat}</span>
                    </p>
                    <p className={`${LABEL} mt-1 text-[9.5px] font-bold text-[#57534e]`}>perangkat</p>
                    <div className="mt-2 h-1.5 w-full max-w-[150px] lg:ml-auto rounded-full bg-[#161616]/10 overflow-hidden">
                      <div className="h-full bg-[#ffd83d]" style={{ width: `${persen}%` }} />
                    </div>
                    {p.gagal > 0 && <p className={`${MONO} mt-1 text-[11px] font-bold text-[#c21f24]`}>{p.gagal} gagal</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      <Halamanasi halaman={halaman} total={total} perHalaman={perHalaman} href={(p) => `/pengumuman?page=${p}`} />
    </div>
  )
}

// ───────────────────────── pengguna aktif ─────────────────────────

const PLATFORM_TONE: Record<Platform, string> = {
  iOS: 'bg-[#161616] text-[#fbf6ec]',
  Android: 'bg-[#ffd83d] text-[#161616]',
  Desktop: 'ring-2 ring-inset ring-[#161616] text-[#161616]',
  Lainnya: 'ring-2 ring-inset ring-[#57534e]/50 text-[#57534e]',
}

const KOLOM_PENGGUNA = 'lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_170px_150px_150px_80px] lg:gap-5 lg:items-center'

export type FilterView = { q: string; kota: string; jenis: string; halaman: number }

export function PenggunaAktif({
  siap,
  ringkasan,
  items,
  total,
  perHalaman,
  filter,
  kota,
}: {
  siap: boolean
  ringkasan: RingkasanPush
  items: PenggunaPush[]
  total: number
  perHalaman: number
  filter: FilterView
  kota: { id: string; nama: string }[]
}) {
  const qs = (p: number) => {
    const u = new URLSearchParams()
    if (filter.q) u.set('q', filter.q)
    if (filter.kota) u.set('kota', filter.kota)
    if (filter.jenis && filter.jenis !== 'semua') u.set('jenis', filter.jenis)
    if (p > 1) u.set('page', String(p))
    const s = u.toString()
    return `/pengumuman/pengguna${s ? `?${s}` : ''}`
  }
  const SELECT = `${INPUT} appearance-none pr-9 bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23161616' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center]`

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Stat label="Perangkat" nilai={ringkasan.perangkat} tone="red" />
        <Stat label="Anggota" nilai={ringkasan.anggota} tone="gold" />
        <Stat label="Pengurus" nilai={ringkasan.pengurus} />
        <Stat label="iPhone" nilai={ringkasan.platform.iOS} />
        <Stat label="Android" nilai={ringkasan.platform.Android} />
        <Stat label="Desktop" nilai={ringkasan.platform.Desktop + ringkasan.platform.Lainnya} />
      </div>

      <form method="get" action="/pengumuman/pengguna" className={`${PANEL} p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_240px_180px_auto] lg:items-end`}>
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className={`${LABEL} block mb-1.5 text-[10px] font-bold text-[#44403c]`}>Cari nama</span>
          <input name="q" defaultValue={filter.q} placeholder="Nama anggota / pengurus…" className={INPUT} />
        </label>
        <label className="block">
          <span className={`${LABEL} block mb-1.5 text-[10px] font-bold text-[#44403c]`}>Kota</span>
          <select name="kota" defaultValue={filter.kota} onChange={(e) => e.currentTarget.form?.requestSubmit()} className={SELECT}>
            <option value="">Semua kota</option>
            {kota.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={`${LABEL} block mb-1.5 text-[10px] font-bold text-[#44403c]`}>Jenis</span>
          <select name="jenis" defaultValue={filter.jenis} onChange={(e) => e.currentTarget.form?.requestSubmit()} className={SELECT}>
            <option value="semua">Anggota & pengurus</option>
            <option value="anggota">Anggota</option>
            <option value="pengurus">Pengurus</option>
          </select>
        </label>
        <button type="submit" className={`block ${BTN_SHELL} sm:col-span-2 lg:col-span-1`}>
          <Strip tone="ink" className="px-6 py-[11px] text-[16px]">
            <Icon name="search" className="w-4 h-4" />
            Cari
          </Strip>
        </button>
      </form>

      {!siap ? (
        <PaperNote>{BELUM_MIGRASI}</PaperNote>
      ) : items.length === 0 ? (
        <Kosong>
          {filter.q || filter.kota || filter.jenis !== 'semua'
            ? 'Tidak ada pengguna yang cocok dengan filter ini.'
            : 'Belum ada yang mengaktifkan notifikasi. Anggota mengaktifkannya dari Beranda atau Profil → Notifikasi HP.'}
        </Kosong>
      ) : (
        <section className={`${PANEL} overflow-hidden`}>
          <div className={`hidden ${KOLOM_PENGGUNA} px-5 py-3 border-b-2 border-[#161616] ${LABEL} text-[10px] font-bold text-[#44403c]`}>
            <span>Nama</span>
            <span>Kota</span>
            <span>Peran</span>
            <span>Perangkat</span>
            <span>Aktif sejak</span>
            <span>Terakhir buka app</span>
            <span className="text-right">Aksi</span>
          </div>
          <ul className="divide-y-2 divide-dotted divide-[#161616]/20">
            {items.map((u) => (
              <li key={u.key} className={`${KOLOM_PENGGUNA} px-5 py-3.5 grid grid-cols-2 gap-x-4 gap-y-2 hover:bg-[#efe8da]/40 transition`}>
                <div className="col-span-2 lg:col-span-1 flex items-center gap-3 min-w-0">
                  <span
                    className={`w-9 h-9 shrink-0 rounded-[10px] -rotate-3 flex items-center justify-center ${
                      u.tipe === 'pengurus' ? 'bg-[#161616] text-[#ffd83d]' : 'bg-[#e02a2f] text-white'
                    }`}
                  >
                    <Icon name={u.tipe === 'pengurus' ? 'shield' : 'user'} className="w-[18px] h-[18px]" />
                  </span>
                  <p className={`${ANTON} min-w-0 truncate text-[16px] tracking-[.02em]`}>{u.nama}</p>
                </div>
                <p className={`${MONO} text-[12.5px] text-[#161616] truncate`}>{u.kota}</p>
                <p className={`${MONO} text-[12px] text-[#44403c]`}>
                  {u.tipe === 'pengurus' ? 'Pengurus · ' : ''}
                  {u.peran}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(u.perangkat) as [Platform, number][]).map(([p, n]) => (
                    <span key={p} className={`${LABEL} rounded-[4px] px-1.5 py-0.5 text-[9.5px] font-bold ${PLATFORM_TONE[p]}`}>
                      {p}
                      {n > 1 ? ` ×${n}` : ''}
                    </span>
                  ))}
                </div>
                <p className={`${MONO} text-[11.5px] text-[#57534e]`}>
                  <span className="lg:hidden">Sejak </span>
                  <Waktu ms={u.sejakMs} />
                </p>
                <p className={`${MONO} text-[11.5px] text-[#57534e]`}>
                  <span className="lg:hidden">Terakhir </span>
                  <Waktu ms={u.terakhirMs} />
                </p>
                <div className="col-span-2 lg:col-span-1 lg:text-right">
                  {u.tipe === 'anggota' ? (
                    <Link
                      href={`/pengumuman/baru?anggota=${u.id}`}
                      className={`${LABEL} inline-flex items-center gap-1 text-[10.5px] font-bold text-[#c21f24] underline underline-offset-4 decoration-dotted`}
                    >
                      <Icon name="send" className="w-3.5 h-3.5" />
                      Kirim
                    </Link>
                  ) : (
                    <span className={`${MONO} text-[11px] text-[#57534e]/60`}>–</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Halamanasi halaman={filter.halaman} total={total} perHalaman={perHalaman} href={qs} />
    </div>
  )
}
