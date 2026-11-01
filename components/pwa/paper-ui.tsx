'use client'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { paper, torn } from '@/components/landing/paper'
import { fit, ID_FONTS, Sparkle } from '@/components/pwa/member-card'
import { Icon, LOGO, type IconName } from '@/components/pwa/ui'

// Member pages styled with the landing colors (paper, ink, red, yellow) and the member card's Anton + Space Mono.
// MemberShell provides the paper background; pages outside it pass `standalone` to PaperMain instead.
export const RED = '#e02a2f'
export const ANTON = 'font-[family-name:var(--font-id-display)] uppercase'
export const MONO = 'font-[family-name:var(--font-id-mono)]'
export const LABEL = `${MONO} uppercase tracking-[.14em]`
export const PRESS = 'active:scale-[.98] transition'
export const LIFTED = 'shadow-[0_14px_24px_-10px_rgba(40,30,10,.5)]'
export const PANEL = `rounded-[14px] bg-[#fffdf7] text-[#161616] ${LIFTED}`
export const TAPE = 'absolute w-[64px] h-[18px] -rotate-38 bg-[#ffd83d]/85'
export const TORN_EDGE = { clipPath: torn(6, 4, 'lr', 2) }
// The torn clip-path sits on the inner Strip so it can't cut off the shadow or focus outline set here.
export const BTN_SHELL = `rounded-sm drop-shadow-[0_5px_8px_rgba(40,30,10,.28)] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#161616] ${PRESS}`
export const BTN = `block w-full ${BTN_SHELL}`
export const ROWS = 'divide-y-2 divide-dotted divide-[#161616]/20'
/** Event registration state: list card stub and detail page stamp. */
export const REG_TONE = {
  OPEN: 'bg-[#e02a2f] text-white',
  FULL: 'bg-[#ffd83d] text-[#161616]',
  CLOSED: 'bg-[#d6d0c4] text-[#57534e]',
} as const

const STRIP_TONE = {
  red: 'bg-[#e02a2f] text-white',
  ink: 'bg-[#161616] text-[#ffd83d]',
  muted: 'bg-[#d6d0c4] text-[#57534e]',
} as const

export function Strip({ children, tone = 'red', className = '' }: { children: ReactNode; tone?: keyof typeof STRIP_TONE; className?: string }) {
  return (
    <span className={`${ANTON} flex items-center justify-center gap-2 py-3 text-[19px] tracking-[.03em] ${STRIP_TONE[tone]} ${className}`} style={TORN_EDGE}>
      {children}
    </span>
  )
}

export function PaperMain({ children, standalone = false }: { children: ReactNode; standalone?: boolean }) {
  return (
    <main
      className={standalone ? `${ID_FONTS} min-h-screen bg-[#efe8da] text-[#161616] font-[family-name:var(--font-proto)]` : ID_FONTS}
      style={standalone ? paper() : undefined}
    >
      {/* iOS Add to Home Screen (black-translucent) keeps white status bar text, unreadable on paper. Height is 0 in Safari. */}
      <div aria-hidden className="sticky top-0 z-20 h-[env(safe-area-inset-top)] bg-[#161616]" />
      {standalone ? <div className="mx-auto w-full max-w-[430px] min-h-screen flex flex-col">{children}</div> : children}
    </main>
  )
}

export function IconButton({ icon, label, onClick, className = 'rotate-3' }: { icon: IconName; label: string; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`w-11 h-11 shrink-0 rounded-xl bg-[#fffdf7] text-[#161616] flex items-center justify-center ${LIFTED} ${PRESS} ${className}`}
    >
      <Icon name={icon} className="w-5 h-5" />
    </button>
  )
}

export function Chip({ name, className }: { name: IconName; className: string }) {
  return (
    <span className={`w-9 h-9 shrink-0 rounded-[10px] -rotate-3 flex items-center justify-center ${className}`}>
      <Icon name={name} className="w-[18px] h-[18px]" />
    </span>
  )
}

/** Label above value, so long values wrap instead of being cut off. */
export function InfoRow({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Chip name={icon} className="bg-[#ffd83d]" />
      <span className="min-w-0 flex-1">
        <span className={`${LABEL} block text-[9.5px] text-[#57534e]`}>{label}</span>
        <span className={`${MONO} block text-[13px] font-bold break-words`}>{children}</span>
      </span>
    </div>
  )
}

/** Cover-cropped event thumbnail. Red backing because the fallback logo is white. */
export function Poster({ src, className = '' }: { src: string; className?: string }) {
  return (
    <span className={`relative block overflow-hidden bg-[#e02a2f] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src || LOGO} alt="" className={`absolute inset-0 w-full h-full ${src ? 'object-cover' : 'object-contain p-2'}`} />
    </span>
  )
}

/** Poster + details + perforated stub. Overflow-hidden makes the notches stop at the card edge, like real cut-outs. */
export function TicketCard({
  href,
  poster,
  label,
  title,
  meta,
  stamp,
  stub,
  stubClassName,
}: {
  href: string
  poster: string
  label: ReactNode
  title: string
  meta: string
  stamp?: ReactNode
  stub: ReactNode
  stubClassName: string
}) {
  return (
    <Link href={href} className={`relative flex overflow-hidden ${PANEL} ${PRESS}`}>
      <Poster src={poster} className="w-[88px] min-h-[116px] self-stretch shrink-0" />
      <span className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-center items-start">
        <span className={`${LABEL} block w-full text-[9.5px] text-[#57534e] truncate`}>{label}</span>
        <span className={`${ANTON} mt-1 text-[19px] leading-[1.12] tracking-[.01em] line-clamp-2`}>{title}</span>
        <span className={`${MONO} block mt-1 text-[11px] font-bold leading-snug`}>{meta}</span>
        {stamp && <span className="mt-2">{stamp}</span>}
      </span>
      <span className={`relative shrink-0 border-l-2 border-dashed border-[#161616]/40 flex flex-col items-center justify-center ${stubClassName}`}>
        <i aria-hidden className="absolute -left-[9px] -top-2 w-4 h-4 rounded-full bg-[#efe8da]" />
        <i aria-hidden className="absolute -left-[9px] -bottom-2 w-4 h-4 rounded-full bg-[#efe8da]" />
        {stub}
      </span>
    </Link>
  )
}

export const QR_STUB = 'w-[52px] bg-[#ffd83d]'

export function QrStubLabel() {
  return (
    <>
      <Icon name="qr" className="w-6 h-6" />
      <span className={`${LABEL} text-[9px] font-bold mt-0.5`}>QR</span>
    </>
  )
}

// 16px on purpose: iOS Safari zooms the page when focusing anything smaller.
export const PAPER_INPUT =
  'w-full min-w-0 rounded-[10px] bg-[#efe8da]/50 ring-1 ring-[#161616]/15 px-3.5 py-3 text-[16px] text-[#161616] outline-none transition placeholder:text-[#57534e]/75 focus:bg-white focus:ring-2 focus:ring-[#161616] disabled:opacity-50 disabled:cursor-not-allowed'
export const PAPER_INPUT_LOCKED =
  'w-full min-w-0 rounded-[10px] border-2 border-dotted border-[#161616]/25 px-3.5 py-2.5 text-[16px] text-[#57534e] [-webkit-text-fill-color:#57534e] outline-none cursor-not-allowed'

export function PaperField({ label, locked = false, children }: { label: string; locked?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className={`${LABEL} flex items-center gap-1 mb-1.5 text-[10px] font-bold text-[#44403c]`}>
        {label}
        {locked && <Icon name="lock" className="w-3 h-3" sw={2.4} />}
      </span>
      {children}
    </label>
  )
}

export function StickerLabel({ children }: { children: ReactNode }) {
  return (
    <p className={`${LABEL} inline-block -rotate-2 bg-[#161616] text-[#fbf6ec] text-[10.5px] font-bold px-3 py-1.5`} style={TORN_EDGE}>
      {children}
    </p>
  )
}

export function BackBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="px-5 pt-4 flex items-center gap-3 min-h-11">
      <IconButton icon="chevronLeft" label="Kembali" onClick={onBack} className="-rotate-3" />
      <StickerLabel>{title}</StickerLabel>
    </header>
  )
}

const STAMP: Record<string, string> = {
  Hadir: 'bg-[#ffd83d] text-[#161616]',
  Terdaftar: 'ring-2 ring-[#161616] text-[#161616]',
  'Tidak hadir': 'ring-2 ring-[#57534e] text-[#57534e]',
}

/** Ticket state: Hadir, Terdaftar or Tidak hadir. */
export function StateStamp({ state }: { state: string }) {
  return <span className={`${MONO} shrink-0 -rotate-6 rounded-[4px] px-2 py-1 text-[9.5px] font-bold uppercase ${STAMP[state] ?? STAMP.Terdaftar}`}>{state}</span>
}

export function PaperHeader({
  sticker,
  title,
  leading,
  action,
  children,
}: {
  sticker?: string
  title: string
  leading?: ReactNode
  action?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="px-5 pt-4">
      <div className="flex items-center justify-between gap-3 min-h-11">
        <div className="flex items-center gap-3 min-w-0">
          {leading}
          {sticker && <StickerLabel>{sticker}</StickerLabel>}
        </div>
        {action}
      </div>
      <div className="mt-1 flex items-start gap-2">
        {/* Own row and shrink-to-fit, so long names and titles stay on one line down to 360px screens */}
        <h1 className={`${ANTON} min-w-0 truncate text-[#161616] leading-[1.1] tracking-[.01em]`} style={{ fontSize: fit(title, 280, 44) }}>
          {title}
        </h1>
        <Sparkle size={22} fill={RED} className="mt-1 shrink-0" />
      </div>
      {children}
    </header>
  )
}

export function SectionHead({ title, action }: { title: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <h2 className={`${ANTON} flex items-center gap-2 text-[#161616] text-[26px] leading-none tracking-[.01em]`}>
        {title}
        <Sparkle size={15} fill={RED} />
      </h2>
      {action && (
        <Link href={action.href} className={`${LABEL} text-[11px] font-bold text-[#161616] underline underline-offset-4 decoration-dotted`}>
          {action.label}
        </Link>
      )}
    </div>
  )
}

export function PaperToast({ msg }: { msg: string | null }) {
  if (!msg) return null
  return (
    <div role="status" className={`${MONO} fixed bottom-24 left-1/2 z-50 -translate-x-1/2 w-max max-w-[90%] rounded-[4px] bg-[#161616] text-[#fbf6ec] text-[12.5px] font-bold px-3.5 py-2 shadow-lg`}>
      {msg}
    </div>
  )
}
