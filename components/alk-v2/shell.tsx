'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import { paper } from '@/components/landing/paper'
import { ID_FONTS } from '@/components/pwa/member-card'
import { ALK_BASE } from './paths'
import { HomeIcon, Icon } from './ui'

const FOCUS = 'rounded-2xl focus-visible:outline-2 focus-visible:outline-[#ffd83d]'

// The Dana form and QA panels are shared with the legacy /dashboard/kota pages and use the app's theme variables.
// Overriding them here gives them the paper look in Sekretariat without changing those pages.
const PAPER_VARS = {
  '--accent': '#e02a2f',
  '--accent-light': 'rgba(224,42,47,.1)',
  '--accent-dark': '#c21f24',
  '--surface': '#fffdf7',
  '--bg': 'transparent',
  '--fg': '#161616',
  '--fg2': '#44403c',
  '--muted': '#57534e',
  '--subtle': '#78716c',
  '--border': 'rgba(22,22,22,.15)',
} as CSSProperties

type Tab = {
  href: string
  label: string
  fab?: boolean
  match: string[]
  icon?: ReactNode
}

const TABS: Tab[] = [
  { href: ALK_BASE, label: 'Beranda', icon: <HomeIcon />, match: [ALK_BASE] },
  {
    href: `${ALK_BASE}/anggota`,
    label: 'Anggota',
    icon: <Icon name="users" sw={1.7} />,
    match: [`${ALK_BASE}/anggota`, `${ALK_BASE}/approval`],
  },
  {
    href: `${ALK_BASE}/scanner`,
    label: 'Scan',
    fab: true,
    match: [`${ALK_BASE}/scanner`],
  },
  {
    href: `${ALK_BASE}/event`,
    label: 'Event',
    icon: <Icon name="calendar" sw={1.7} />,
    match: [`${ALK_BASE}/event`],
  },
  {
    href: `${ALK_BASE}/lainnya`,
    label: 'Lainnya',
    icon: <Icon name="grid" sw={1.7} />,
    match: [`${ALK_BASE}/lainnya`],
  },
]

function pathMatches(pathname: string, match: string[]) {
  return match.some((m) => {
    if (m === ALK_BASE) return pathname === ALK_BASE
    return pathname === m || pathname.startsWith(m + '/')
  })
}

/** Hide bottom nav on full-screen subflows (form / detail / approve / dana). */
export function shouldHideAlkNav(pathname: string) {
  if (pathname.includes('/event/new')) return true
  if (/\/event\/\d+/.test(pathname)) return true
  if (pathname.includes('/anggota/baru')) return true
  return false
}

export function AlkBottomNav() {
  const pathname = usePathname()
  if (shouldHideAlkNav(pathname)) return null

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
                    <Icon name="scan" className="w-7 h-7 text-white" sw={1.8} />
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

export function AlkShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const hideNav = shouldHideAlkNav(pathname)
  return (
    <div className={`${ID_FONTS} min-h-screen bg-[#efe8da] font-[family-name:var(--font-id-mono)] text-[#161616]`} style={{ ...paper(), ...PAPER_VARS }}>
      <div className={`mx-auto w-full max-w-[430px] min-h-screen ${hideNav ? '' : 'pb-24'}`}>{children}</div>
      <AlkBottomNav />
    </div>
  )
}
