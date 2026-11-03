'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { paper } from '@/components/landing/paper'
import { HomeIcon, Icon } from './ui'

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

const TICKET_DETAIL = /^\/dashboard\/tiket\/\d+/
const PEMURIDAN_STORY = /^\/dashboard\/pemuridan\/[^/]+/

function pathMatches(pathname: string, match: string[]) {
  return match.some((m) => pathname === m || (m !== '/dashboard' && pathname.startsWith(m + '/')))
}

function isKotaAdminPath(pathname: string) {
  return pathname.startsWith('/dashboard/kota') || pathname.startsWith('/dashboard/v2/kota')
}

/** Hide bottom nav on full-screen flows and admin kota dashboards. */
export function shouldHideMemberNav(pathname: string) {
  if (isKotaAdminPath(pathname)) return true
  if (pathname.startsWith('/login') || pathname.startsWith('/daftar')) return true
  if (pathname.startsWith('/events') || pathname.startsWith('/join/')) return true
  if (TICKET_DETAIL.test(pathname) || PEMURIDAN_STORY.test(pathname)) return true
  if (pathname.startsWith('/absen/')) return true
  return false
}

function isMemberShellPath(pathname: string) {
  if (!pathname.startsWith('/dashboard')) return false
  if (isKotaAdminPath(pathname)) return false
  return true
}

const FOCUS = 'rounded-2xl focus-visible:outline-2 focus-visible:outline-[#ffd83d]'

export function MemberBottomNav() {
  const pathname = usePathname()
  if (shouldHideMemberNav(pathname)) return null

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-[430px] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="relative grid grid-cols-5 items-end rounded-[28px] bg-[#161616] shadow-[0_-8px_30px_-12px_rgba(40,30,10,.55)] px-1 pt-2 pb-1.5">
          {TABS.map((t) => {
            const active = pathMatches(pathname, t.match)
            const tone = active ? 'text-[#ffd83d]' : 'text-[#fbf6ec]/70'
            if (t.fab) {
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className="group relative -mt-7 flex flex-col items-center outline-none"
                  aria-label={t.label}
                  aria-current={active ? 'page' : undefined}
                >
                  <span
                    className={`w-14 h-14 rounded-full flex items-center justify-center bg-[#e02a2f] ring-4 shadow-[0_10px_24px_-8px_rgba(224,42,47,.75)] group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-[#fbf6ec] ${
                      active ? 'ring-[#ffd83d]' : 'ring-[#161616]'
                    }`}
                  >
                    <Icon name="ticket" className="w-7 h-7 text-white" sw={1.8} />
                  </span>
                  <span className={`text-[10px] font-semibold mt-1 ${tone}`}>{t.label}</span>
                </Link>
              )
            }
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-1 ${FOCUS} ${tone}`}
              >
                <span>{t.icon}</span>
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
    <div className="min-h-screen bg-[#efe8da] font-[family-name:var(--font-proto)] text-slate-800" style={paper()}>
      <div className={`mx-auto w-full max-w-[430px] min-h-screen ${hideNav ? '' : 'pb-24'}`}>{children}</div>
      <MemberBottomNav />
    </div>
  )
}
