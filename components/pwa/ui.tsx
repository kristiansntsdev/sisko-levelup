'use client'
import Image from 'next/image'
import QRCode from 'qrcode'
import { useEffect, useState, type ReactNode } from 'react'
import { GoogleIcon, HomeIcon, Icon, type IconName } from '@/components/prototype/icons'

export { GoogleIcon, HomeIcon, Icon }
export type { IconName }

export const LOGO = '/prototype/levelup-logo.png'
export const fCard = 'font-[family-name:var(--font-proto-card)]'
export const PAGE_BG = 'bg-[#efe8da]'
export const GOLD_LINE = 'h-1.5 bg-[#ffd83d]'
// 16px: iOS Safari zooms the page when focusing anything smaller.
export const FLD =
  'w-full min-w-0 rounded-[10px] bg-[#efe8da]/50 ring-1 ring-[#161616]/15 px-3.5 py-3 text-[16px] text-[#161616] font-[family-name:var(--font-proto)] outline-none transition placeholder:text-[#57534e]/75 focus:bg-white focus:ring-2 focus:ring-[#161616] disabled:opacity-50 disabled:cursor-not-allowed'

export const TINT = {
  red: 'text-white bg-[#e02a2f]',
  rose: 'text-white bg-[#e02a2f]',
  gold: 'text-[#161616] bg-[#ffd83d]',
  amber: 'text-[#161616] bg-[#ffd83d]',
  slate: 'text-[#161616] bg-[#161616]/[.07]',
  sky: 'text-[#ffd83d] bg-[#161616]',
}
export type Tint = keyof typeof TINT

// Status stamps. Green = done/approved and sky = scheduled keep their names so callers read by meaning.
export const PILL = {
  green: 'bg-[#161616] text-[#ffd83d] ring-[#161616]',
  amber: 'bg-[#ffd83d] text-[#161616] ring-[#ffd83d]',
  slate: 'text-[#57534e] ring-[#57534e]/50',
  red: 'bg-[#e02a2f] text-white ring-[#e02a2f]',
  sky: 'text-[#161616] ring-[#161616]',
  gold: 'bg-[#161616]/[.07] text-[#161616] ring-transparent',
}
export type PillTone = keyof typeof PILL

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
    <span className={`shrink-0 font-[family-name:var(--font-id-mono)] uppercase tracking-wide text-[10px] font-bold px-2 py-1 rounded-[4px] ring-1 whitespace-nowrap ${PILL[tone]}`}>
      {children}
    </span>
  )
}

export function TintIcon({
  name,
  tint,
  size = 'w-9 h-9 rounded-[10px]',
  icon = 'w-[18px] h-[18px]',
}: {
  name: IconName
  tint: Tint
  size?: string
  icon?: string
}) {
  return (
    <span className={`${size} shrink-0 -rotate-3 flex items-center justify-center ${TINT[tint]}`}>
      <Icon name={name} className={icon} />
    </span>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block font-[family-name:var(--font-id-mono)] uppercase tracking-[.14em] text-[10px] font-bold text-[#44403c] mb-1.5">{label}</span>
      {children}
    </label>
  )
}

export function SheetHead({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="mb-4">
      <p className="font-[family-name:var(--font-id-display)] uppercase text-[24px] leading-none tracking-[.01em] text-[#161616]">{title}</p>
      {sub && <p className="font-[family-name:var(--font-id-mono)] text-[12px] text-[#57534e] mt-1.5">{sub}</p>}
    </div>
  )
}

export function ModeSwitch({ alk, onChange }: { alk: boolean; onChange: (alk: boolean) => void }) {
  const on = 'bg-[#161616] text-[#ffd83d]'
  return (
    <div className="grid grid-cols-2 p-1 gap-1 rounded-full bg-[#fffdf7] text-[#161616] text-[13px] font-semibold">
      <button type="button" aria-pressed={!alk} onClick={() => onChange(false)} className={`flex items-center justify-center gap-1.5 py-2 rounded-full transition ${alk ? '' : on}`}>
        <Icon name="card" className="w-4 h-4" />
        Kartu Saya
      </button>
      <button type="button" aria-pressed={alk} onClick={() => onChange(true)} className={`flex items-center justify-center gap-1.5 py-2 rounded-full transition ${alk ? on : ''}`}>
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
    <div className="sticky top-0 z-20 pt-[env(safe-area-inset-top)] text-white bg-[#161616] shadow-[0_6px_16px_-8px_rgba(40,30,10,.6)]">
      <div className="h-14 grid grid-cols-[48px_1fr_48px] items-center px-2">
        {left ? (
          <button type="button" onClick={left} aria-label={back ? 'Kembali' : 'Tutup'} className="w-11 h-11 flex items-center justify-center rounded-full active:bg-white/10">
            <Icon name={back ? 'chevronLeft' : 'x'} className="w-7 h-7" sw={2} />
          </button>
        ) : (
          <span />
        )}
        <h2 className="text-center font-[family-name:var(--font-id-display)] uppercase tracking-[.03em] text-[20px] truncate">{title}</h2>
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
    <div role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 w-max max-w-[90%] rounded-[4px] bg-[#161616] text-[#fbf6ec] font-[family-name:var(--font-id-mono)] text-[12.5px] font-bold px-3.5 py-2 shadow-lg">
      {msg}
    </div>
  )
}
