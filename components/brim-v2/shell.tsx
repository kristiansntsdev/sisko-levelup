'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { paper } from '@/components/landing/paper'
import { ID_FONTS } from '@/components/pwa/member-card'
import { PAPER_VARS } from '@/components/alk-v2/shell'
import { HomeIcon, Icon } from '@/components/alk-v2/ui'
import { BRIM_ARTIKEL_BASE, BRIM_BASE, BRIM_EVENT_BASE } from './paths'

const FOCUS = 'rounded-2xl focus-visible:outline-2 focus-visible:outline-[#ffd83d]'

const TABS: { href: string; label: string; icon: ReactNode; match: string }[] = [
  { href: BRIM_BASE, label: 'Beranda', icon: <HomeIcon />, match: BRIM_BASE },
  { href: BRIM_EVENT_BASE, label: 'Event', icon: <Icon name="calendar" sw={1.7} />, match: BRIM_EVENT_BASE },
  { href: BRIM_ARTIKEL_BASE, label: 'Artikel', icon: <Icon name="megaphone" sw={1.7} />, match: BRIM_ARTIKEL_BASE },
  { href: `${BRIM_BASE}/lainnya`, label: 'Lainnya', icon: <Icon name="grid" sw={1.7} />, match: `${BRIM_BASE}/lainnya` },
]

function active(pathname: string, match: string) {
  if (match === BRIM_BASE) return pathname === BRIM_BASE
  return pathname === match || pathname.startsWith(match + '/')
}

/** Full-screen subflows: approve detail, article form + detail. */
export function shouldHideBrimNav(pathname: string) {
  if (/\/event\/\d+/.test(pathname)) return true
  if (pathname.startsWith(`${BRIM_ARTIKEL_BASE}/`)) return true
  return false
}

function BrimBottomNav() {
  const pathname = usePathname()
  if (shouldHideBrimNav(pathname)) return null
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-[430px] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-4 items-end rounded-[28px] bg-[#161616] shadow-[0_-8px_30px_-12px_rgba(40,30,10,.55)] px-1 pt-2 pb-1.5">
          {TABS.map((t) => {
            const on = active(pathname, t.match)
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={on ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-1 ${FOCUS} ${on ? 'text-[#ffd83d]' : 'text-[#fbf6ec]/70'}`}
              >
                {t.icon}
                <span className="text-[10px] font-semibold">{t.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export function BrimShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const hideNav = shouldHideBrimNav(pathname)
  return (
    <div className={`${ID_FONTS} min-h-screen bg-[#efe8da] font-[family-name:var(--font-id-mono)] text-[#161616]`} style={{ ...paper(), ...PAPER_VARS }}>
      <div className={`mx-auto w-full max-w-[430px] min-h-screen ${hideNav ? '' : 'pb-24'}`}>{children}</div>
      <BrimBottomNav />
    </div>
  )
}
