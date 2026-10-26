'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { HomeIcon, Icon, PAGE_BG } from './ui'

type Tab = {
  href: string
  label: string
  fab?: boolean
  match: string[]
  icon?: ReactNode
}

const TABS: Tab[] = [
  { href: '/dashboard', label: 'Beranda', icon: <HomeIcon />, match: ['/dashboard', '/dashboard/kartu'] },
  { href: '/dashboard/riwayat', label: 'Riwayat', icon: <Icon name="history" sw={1.7} />, match: ['/dashboard/riwayat'] },
  { href: '/dashboard/tiket', label: 'Tiket', fab: true, match: ['/dashboard/tiket'] },
  { href: '/dashboard/kesaksian', label: 'Kesaksian', icon: <Icon name="chat" sw={1.7} />, match: ['/dashboard/kesaksian'] },
  { href: '/dashboard/profil', label: 'Profil', icon: <Icon name="user" sw={1.7} />, match: ['/dashboard/profil'] },
]

function pathMatches(pathname: string, match: string[]) {
  return match.some((m) => pathname === m || (m !== '/dashboard' && pathname.startsWith(m + '/')))
}

/** Hide bottom nav on full-screen flows and admin kota dashboards. */
export function shouldHideMemberNav(pathname: string) {
  if (pathname.startsWith('/dashboard/kota')) return true
  if (pathname.startsWith('/login') || pathname.startsWith('/daftar')) return true
  if (pathname.startsWith('/events') || pathname.startsWith('/join/')) return true
  if (/^\/dashboard\/tiket\/\d+/.test(pathname)) return true
  if (pathname.startsWith('/absen/')) return true
  return false
}

function isMemberShellPath(pathname: string) {
  if (!pathname.startsWith('/dashboard')) return false
  if (pathname.startsWith('/dashboard/kota')) return false
  return true
}

export function MemberBottomNav() {
  const pathname = usePathname()
  if (shouldHideMemberNav(pathname)) return null

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-[430px] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="relative grid grid-cols-5 items-end rounded-[28px] bg-white/95 backdrop-blur shadow-[0_-8px_30px_-12px_rgba(80,20,25,.35)] ring-1 ring-slate-100 px-1 pt-2 pb-1.5">
          {TABS.map((t) => {
            const active = pathMatches(pathname, t.match)
            if (t.fab) {
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className="relative -mt-7 flex flex-col items-center"
                  aria-label={t.label}
                >
                  <span
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(201,35,44,.75)] ${
                      active ? 'bg-[#a81d24]' : 'bg-[#c9232c]'
                    }`}
                  >
                    <Icon name="ticket" className="w-7 h-7 text-white" sw={1.8} />
                  </span>
                  <span className={`text-[10px] font-semibold mt-1 ${active ? 'text-[#c9232c]' : 'text-slate-400'}`}>
                    {t.label}
                  </span>
                </Link>
              )
            }
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex flex-col items-center gap-0.5 py-1 ${active ? 'text-[#c9232c]' : 'text-slate-400'}`}
              >
                <span className={active ? 'text-[#c9232c]' : ''}>{t.icon}</span>
                <span className="text-[10px] font-semibold">{t.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export function MemberShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  // Admin kota keeps its own shell — don't wrap with PWA chrome
  if (!isMemberShellPath(pathname)) return <>{children}</>

  const hideNav = shouldHideMemberNav(pathname)
  return (
    <div className={`min-h-screen ${PAGE_BG} font-[family-name:var(--font-proto)] text-slate-800`}>
      <div className={`mx-auto w-full max-w-[430px] min-h-screen ${hideNav ? '' : 'pb-24'}`}>{children}</div>
      <MemberBottomNav />
    </div>
  )
}
