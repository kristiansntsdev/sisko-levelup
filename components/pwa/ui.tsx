'use client'
import Image from 'next/image'
import QRCode from 'qrcode'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { GoogleIcon, HomeIcon, Icon, type IconName } from '@/components/prototype/icons'
import type { MemberCardData } from '@/lib/pwa-member'

export { GoogleIcon, HomeIcon, Icon }
export type { IconName }

export const LOGO = '/prototype/levelup-logo.png'
export const fCard = 'font-[family-name:var(--font-proto-card)]'
export const BTN_RED =
  'rounded-2xl bg-[#c9232c] text-white font-bold shadow-[0_8px_20px_-6px_rgba(201,35,44,.6)] disabled:opacity-40 disabled:shadow-none transition active:scale-[.99]'
export const PAGE_BG = 'bg-[#faf7f2]'
export const CARD = 'bg-white rounded-2xl shadow-sm ring-1 ring-slate-100'
export const LIFT = 'bg-white rounded-2xl shadow-[0_10px_30px_-10px_rgba(80,20,25,.25)]'
export const GOLD_LINE = 'h-1.5 bg-linear-to-r from-[#e0c574] via-[#c3a54d] to-[#a98b35]'
export const FLD =
  'w-full min-w-0 rounded-xl bg-slate-50 ring-1 ring-slate-200 px-3.5 py-3 text-[15px] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#c9232c]'

export const TINT = {
  red: 'text-[#c9232c] bg-[#fbeceb] ring-1 ring-[#f3d3d3]',
  gold: 'text-[#96792a] bg-[#f8f0dd] ring-1 ring-[#ecdcb3]',
  slate: 'text-stone-600 bg-stone-100 ring-1 ring-stone-200/70',
  sky: 'text-sky-600 bg-sky-50 ring-1 ring-sky-100',
  amber: 'text-amber-600 bg-amber-50 ring-1 ring-amber-100',
  rose: 'text-rose-600 bg-rose-50 ring-1 ring-rose-100',
}
export type Tint = keyof typeof TINT

export const PILL = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  slate: 'bg-slate-100 text-slate-500 ring-slate-200',
  red: 'bg-[#fbeceb] text-[#c9232c] ring-[#f3d3d3]',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  gold: 'bg-[#f8f0dd] text-[#96792a] ring-[#ecdcb3]',
}
export type PillTone = keyof typeof PILL

const HERO_BG: CSSProperties = {
  background:
    'radial-gradient(90% 55% at 100% 0%, rgba(255,220,150,.16), transparent 60%),' +
    'radial-gradient(70% 45% at 0% 100%, rgba(40,0,5,.30), transparent 70%),' +
    'linear-gradient(180deg, #d73640 0%, #b3202a 48%, #8a1620 100%)',
}

const GOLD_BAND: CSSProperties = {
  background:
    'linear-gradient(100deg, transparent 30%, rgba(255,255,255,.35) 45%, transparent 60%),' +
    'linear-gradient(180deg, #e0c574 0%, #c3a54d 55%, #a98b35 100%)',
}

const SIM_BODY: CSSProperties = {
  backgroundColor: '#f4efe5',
  backgroundImage:
    'radial-gradient(ellipse 70% 60% at 55% 55%, rgba(255,255,255,.85), transparent 70%),' +
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='18'%3E%3Cg fill='none' stroke='%23b1953a' stroke-width='.5' opacity='.45'%3E%3Cpath d='M0 9 C10 1 30 1 40 9 S70 17 80 9'/%3E%3Cpath d='M0 4 C10 -4 30 -4 40 4 S70 12 80 4'/%3E%3Cpath d='M0 14 C10 6 30 6 40 14 S70 22 80 14'/%3E%3C/g%3E%3C/svg%3E"),` +
    'linear-gradient(180deg, #e9e0cc 0%, #f8f5ee 30%, #eee6d5 100%)',
}

export function Chevrons({ className = '' }: { className?: string }) {
  return (
    <svg className={`absolute pointer-events-none ${className}`} viewBox="0 0 130 50" fill="none" stroke="#fff" strokeWidth="11" aria-hidden="true">
      <path d="M6 4l21 21-21 21M48 4l21 21-21 21M90 4l21 21-21 21" />
    </svg>
  )
}

export function Hero({ className = '', children, decor = '-right-6 top-6 w-40' }: { className?: string; children: ReactNode; decor?: string }) {
  return (
    <div className={`relative overflow-hidden text-white px-5 ${className}`} style={HERO_BG}>
      {/* iOS Add to Home Screen (black-translucent) draws under the status bar. Inset is 0 in Safari. */}
      <div aria-hidden className="h-[env(safe-area-inset-top)]" />
      <Chevrons className={`${decor} opacity-[.12]`} />
      <div className="relative">{children}</div>
    </div>
  )
}

export function PageHero({
  title,
  sub,
  action,
  pb = 'pb-16',
}: {
  title: string
  sub?: ReactNode
  action?: { label: string; icon?: IconName; onClick: () => void }
  pb?: string
}) {
  return (
    <Hero className={`pt-6 md:pt-4 ${pb} rounded-b-[32px]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-extrabold text-[22px] leading-tight">{title}</h2>
          {sub && <p className="text-sm text-white/80 mt-1">{sub}</p>}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="shrink-0 flex items-center gap-1.5 bg-white text-[#c9232c] font-bold text-[13px] rounded-full pl-3 pr-4 py-2 shadow active:scale-95 transition"
          >
            <Icon name={action.icon ?? 'plus'} className="w-4 h-4" sw={2.4} />
            {action.label}
          </button>
        )}
      </div>
    </Hero>
  )
}

export function Logo({ className = 'h-9 w-auto' }: { className?: string }) {
  return <Image src={LOGO} alt="LevelUP — The Jeremiah Generation" width={623} height={243} className={className} />
}

// PNG not SVG: qrcode SVG draws modules as stroke; OS/browser dark mode remaps fill≠stroke → QR hilang.
export function Qr({ text, className = '' }: { text: string; className?: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let live = true
    QRCode.toDataURL(text, {
      margin: 1,
      width: 512,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    }).then((url) => { if (live) setSrc(url) })
    return () => { live = false }
  }, [text])
  return (
    <div
      className={`aspect-square bg-white ${className}`}
      style={{ colorScheme: 'only light', forcedColorAdjust: 'none' }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- data-URL QR; raster survives dark mode
        <img src={src} alt="" className="w-full h-auto block" />
      ) : null}
    </div>
  )
}

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 whitespace-nowrap ${PILL[tone]}`}>
      {children}
    </span>
  )
}

export function Avatar({ g, photo, className = 'w-full h-full' }: { g: string; photo?: string; className?: string }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt="" className={`${className} object-cover block`} />
  }
  const female = g === 'P'
  return (
    <svg
      viewBox="0 0 80 96"
      className={`${className} block bg-linear-to-b ${female ? 'from-[#f3e6d6] to-[#dcc6ab]' : 'from-[#dfe7f5] to-[#b9c6de]'}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {female && <path d="M21 44c0-16 8-25 19-25s19 9 19 25v20c-5 3-10 4-13 4H34c-3 0-8-1-13-4z" fill="#2a1d1a" />}
      <path d="M6 96c3-19 17-27 34-27s31 8 34 27z" fill={female ? '#8a2a3a' : '#223066'} />
      {!female && <path d="M33 69l7 11 7-11z" fill="#fff" />}
      <rect x="34" y="52" width="12" height="14" rx="4" fill="#d9a67f" />
      <ellipse cx="40" cy="40" rx={female ? 14 : 15} ry={female ? 16.5 : 17} fill={female ? '#ebc19c' : '#e6b890'} />
      {female ? (
        <path d="M25 39c1-11 7-18 15-18s14 7 15 18c-4-6-9-9-15-9-4 3-9 6-15 9z" fill="#2a1d1a" />
      ) : (
        <path d="M24 38c0-12 7-18 16-18s16 6 16 18c-2-6-7-9-16-9s-14 3-16 9z" fill="#1e1e24" />
      )}
    </svg>
  )
}

const CARD_W = 352

function FitCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      if (el.clientWidth) setZoom(el.clientWidth / CARD_W)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} className="w-full">
      <div style={{ width: CARD_W, zoom }}>{children}</div>
    </div>
  )
}

const CardLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-[10px] text-slate-500 font-medium mt-1 first:mt-0">{children}</p>
)

export function MemberCard({ m, onClick }: { m: MemberCardData; onClick?: () => void }) {
  return (
    <FitCard>
      <div
        onClick={onClick}
        className={`rounded-2xl overflow-hidden text-slate-900 shadow-[0_18px_40px_-12px_rgba(60,8,12,.6)] select-none ${onClick ? 'cursor-pointer active:scale-[.99] transition' : ''} ${fCard}`}
      >
        <div className="relative h-[46px] flex items-center justify-between pl-3 pr-4 border-b-2 border-[#c9232c]" style={GOLD_BAND}>
          <Logo className="h-[34px] w-auto drop-shadow-[0_1px_1px_rgba(90,15,20,.55)]" />
          <p className="font-semibold text-[#5a0f14]/85 text-[12px] tracking-[.2em]">MEMBER CARD</p>
        </div>
        <div className="relative" style={SIM_BODY}>
          <div className="flex gap-3 px-4 pt-2">
            <div className="w-[72px] h-[96px] shrink-0 mt-7 rounded-[44%] overflow-hidden ring-2 ring-white/80 shadow-sm">
              <Avatar g={m.gender} photo={m.photo} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#cf1b25] text-[12px] tracking-[.08em] leading-none">KARTU ANGGOTA</p>
              <p className="font-bold text-[22px] tracking-[.06em] leading-tight">{m.no}</p>
              <div className="flex gap-2 mt-1">
                <div className="flex-1 min-w-0 leading-[1.15] break-words">
                  <CardLabel>Nama/Name</CardLabel>
                  <p className="text-[14px] font-bold uppercase">{m.name.replace(/^\S+\.\s/, '')}</p>
                  <CardLabel>Tempat, Tgl Lahir/Birth</CardLabel>
                  <p className="text-[12px] font-bold uppercase">
                    {[m.pob, m.dob].filter((v) => v && v !== '—').join(', ') || '—'}
                  </p>
                  <CardLabel>Gereja/Church</CardLabel>
                  <p className="text-[12px] font-bold uppercase">{m.church}</p>
                  <CardLabel>Cabang</CardLabel>
                  <p className="text-[12px] font-bold uppercase">{m.city}</p>
                </div>
                <div className="w-[74px] shrink-0 flex flex-col items-center text-center -mt-1">
                  {/* Tamu / PIC / LevelUP Pusat: no "/ MEMBER" suffix */}
                  {m.tier === 'TAMU' || m.tier === 'PIC' || m.tier === 'LEVELUP PUSAT' ? (
                    <p className={`font-bold leading-[1.05] tracking-wide ${m.tier === 'LEVELUP PUSAT' ? 'text-[13px]' : 'text-[22px]'}`}>
                      {m.tier === 'LEVELUP PUSAT' ? <>LEVELUP<br />PUSAT</> : m.tier}
                    </p>
                  ) : m.tier.length > 4 ? (
                    <p className="text-[15px] font-bold leading-[1.05] tracking-wide">
                      {m.tier}
                      <br />/ MEMBER
                    </p>
                  ) : (
                    <p className="text-[22px] font-bold leading-[.95] tracking-wide">
                      {m.tier} /<br />
                      MEMBER
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 px-4 py-1.5 bg-[#e3d8bf]/60 flex items-center justify-end gap-2 text-[11px] font-[family-name:var(--font-proto)]">
            <span className="text-slate-600">Status Anggota</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <b className="text-[13px]">Aktif</b>
          </div>
        </div>
      </div>
    </FitCard>
  )
}

export function TintIcon({
  name,
  tint,
  size = 'w-10 h-10 rounded-xl',
  icon = 'w-5 h-5',
}: {
  name: IconName
  tint: Tint
  size?: string
  icon?: string
}) {
  return (
    <span className={`${size} shrink-0 flex items-center justify-center ${TINT[tint]}`}>
      <Icon name={name} className={icon} />
    </span>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold text-slate-600 mb-1.5">{label}</span>
      {children}
    </label>
  )
}

export function SheetHead({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="mb-4">
      <p className="font-extrabold text-[18px] text-[#3b1417]">{title}</p>
      {sub && <p className="text-[13px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export function ModeSwitch({ alk, onChange }: { alk: boolean; onChange: (alk: boolean) => void }) {
  const on = 'bg-white text-[#c9232c] shadow'
  return (
    <div className="grid grid-cols-2 p-1 gap-1 rounded-full bg-black/20 ring-1 ring-white/20 text-[13px] font-semibold">
      <button type="button" onClick={() => onChange(false)} className={`flex items-center justify-center gap-1.5 py-2 rounded-full transition ${alk ? 'text-white/85' : on}`}>
        <Icon name="card" className="w-4 h-4" />
        Kartu Saya
      </button>
      <button type="button" onClick={() => onChange(true)} className={`flex items-center justify-center gap-1.5 py-2 rounded-full transition ${alk ? on : 'text-white/85'}`}>
        <Icon name="shield" className="w-4 h-4" />
        Akun Sekretariat
      </button>
    </div>
  )
}

export function PlainBar({
  title,
  back,
  close,
  right,
}: {
  title: string
  back?: () => void
  close?: () => void
  right?: ReactNode
}) {
  const left = back ?? close
  return (
    <div className="sticky top-0 z-20 pt-[env(safe-area-inset-top)] text-white bg-linear-to-b from-[#d73640] to-[#b3202a] shadow-[0_6px_16px_-8px_rgba(124,18,25,.6)]">
      <div className="h-14 grid grid-cols-[48px_1fr_48px] items-center px-2">
        {left ? (
          <button type="button" onClick={left} aria-label={back ? 'Kembali' : 'Tutup'} className="w-11 h-11 flex items-center justify-center rounded-full active:bg-white/10">
            <Icon name={back ? 'chevronLeft' : 'x'} className="w-7 h-7" sw={2} />
          </button>
        ) : (
          <span />
        )}
        <h2 className="text-center text-[17px] font-bold truncate">{title}</h2>
        {right ?? <span />}
      </div>
    </div>
  )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl shadow-[0_10px_30px_-16px_rgba(80,20,25,.3)] ring-1 ring-[#f1e7d6] ${className}`}>{children}</div>
}

export function PanelLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11.5px] font-bold tracking-[.14em] uppercase text-[#96792a]">{children}</p>
}

/** Flyer thumb — cover-cropped like proto Poster. */
export function EventThumb({ src, className = '' }: { src: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-slate-200 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src || '/prototype/levelup-logo.png'} alt="" className="absolute inset-0 w-full h-full object-cover" />
    </div>
  )
}

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[430px] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-safe shadow-xl">
        {children}
      </div>
    </div>
  )
}

export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null
  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 max-w-[90%] rounded-full bg-[#3b1417] text-white text-[13px] font-semibold px-4 py-2.5 shadow-lg">
      {msg}
    </div>
  )
}
