'use client'
import type { ReactNode } from 'react'
import { Silhouette } from '@/components/pwa/member-card'
import { ANTON, BTN_SHELL, LABEL, LIFTED, MONO, PANEL, PRESS, Strip, TAPE_RIGHT } from '@/components/pwa/paper-ui'
import {
  FLD,
  Field,
  HomeIcon,
  Icon,
  ModeSwitch,
  Pill,
  Qr,
  Sheet,
  SheetHead,
  TINT,
  TintIcon,
  Toast,
  type IconName,
  type PillTone,
  type Tint,
} from '@/components/pwa/ui'

export { FLD, Field, HomeIcon, Icon, ModeSwitch, Pill, Qr, Sheet, SheetHead, TINT, TintIcon, Toast }
export type { IconName, PillTone, Tint }
export { ALK_BASE, ALK_EVENT_BASE } from './paths'

const DATE_TONE = {
  red: 'bg-[#ffd83d] text-[#161616]',
  solid: 'bg-[#e02a2f] text-white',
  slate: 'bg-[#161616]/[.07] text-[#57534e]',
}

export function DateBlock({ d, m, tone = 'red' }: { d: string; m: string; tone?: keyof typeof DATE_TONE }) {
  return (
    <div className={`w-[52px] h-[56px] shrink-0 rounded-[10px] -rotate-2 flex flex-col items-center justify-center leading-none ${DATE_TONE[tone]}`}>
      <span className={`${ANTON} text-[24px]`}>{d}</span>
      <span className={`${MONO} text-[9px] font-bold tracking-wider mt-1`}>{m}</span>
    </div>
  )
}

export function StatTriple({ items }: { items: [number | string, string, string][] }) {
  return (
    <section aria-label="Ringkasan" className={`relative py-4 grid grid-cols-3 divide-x-2 divide-dotted divide-[#161616]/20 text-center ${PANEL}`}>
      <span aria-hidden className={TAPE_RIGHT} />
      {items.map(([v, l, c]) => (
        <div key={l} className="px-1">
          <p className={`${ANTON} text-[36px] leading-none ${c}`}>{v}</p>
          <p className={`${LABEL} text-[9px] text-[#57534e] mt-2`}>{l}</p>
        </div>
      ))}
    </section>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className={`${LABEL} rounded-[14px] border-2 border-dotted border-[#161616]/30 text-center text-[11px] leading-relaxed text-[#57534e] py-7 px-4`}>{children}</p>
}

/** Pengurus and peserta rows have no photo data yet, so everyone gets the card's silhouette, not a gendered drawing. */
export function PersonChip() {
  return (
    <span aria-hidden className="relative w-11 h-11 shrink-0 rounded-[10px] -rotate-3 overflow-hidden bg-[#ffd83d]">
      <Silhouette className="absolute left-1 right-1 -bottom-1 w-[calc(100%-8px)]" />
    </span>
  )
}

export function SoonTag() {
  return <span className={`${LABEL} shrink-0 rotate-6 text-[8.5px] font-bold text-[#c21f24]`}>Soon</span>
}

export function Row({
  icon,
  tint = 'red',
  title,
  sub,
  right,
  onClick,
}: {
  icon: IconName
  tint?: Tint
  title: ReactNode
  sub?: ReactNode
  right?: ReactNode
  onClick?: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-[#161616]/5 transition">
      <TintIcon name={icon} tint={tint} />
      <span className="flex-1 min-w-0">
        <span className={`${ANTON} block text-[16px] tracking-[.02em] text-[#161616] leading-tight`}>{title}</span>
        {sub && <span className={`${MONO} block text-[11px] leading-snug text-[#44403c] mt-1`}>{sub}</span>}
      </span>
      {right ?? <Icon name="chevron" className="w-5 h-5 text-[#161616] shrink-0" sw={2} />}
    </button>
  )
}

export function SectionCard({
  icon,
  tint,
  title,
  sub,
  children,
  lift,
}: {
  icon: IconName
  tint: Tint
  title: string
  sub: string
  children: ReactNode
  lift?: boolean
}) {
  return (
    <section aria-label={title} className={`relative px-4 pt-4 pb-5 ${PANEL}`}>
      {lift && <span aria-hidden className={TAPE_RIGHT} />}
      <div className="flex items-center gap-3 pb-3 mb-4 border-b-2 border-dotted border-[#161616]/25">
        <TintIcon name={icon} tint={tint} />
        <div className="min-w-0">
          <h2 className={`${ANTON} text-[22px] leading-none tracking-[.01em] text-[#161616]`}>{title}</h2>
          <p className={`${MONO} text-[11px] text-[#57534e] mt-1`}>{sub}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export function Note({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'sky' | 'rose' }) {
  const cls = tone === 'rose' ? 'bg-[#e02a2f]/10 text-[#c21f24]' : 'border-2 border-dotted border-[#161616]/30 text-[#44403c]'
  return (
    <div className={`flex gap-3 rounded-[14px] p-3.5 ${MONO} text-[11.5px] leading-relaxed ${cls}`}>
      <Icon name="alert" className="w-5 h-5 shrink-0 text-[#c21f24]" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** For controls made of buttons. A <label> around buttons makes tapping its text press the first one. */
export function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <p className={`${LABEL} text-[10px] font-bold text-[#44403c] mb-1.5`}>{label}</p>
      {children}
    </div>
  )
}

export function Seg({
  options,
  value,
  onChange,
}: {
  options: [string, string][]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-[#efe8da]/70">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`${LABEL} py-2.5 rounded-full text-[11px] font-bold transition ${value === v ? 'bg-[#161616] text-[#ffd83d]' : 'text-[#161616]'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

/** Approve is the solid ink strip and reject the red outline, so neither reads as the other at a glance. */
export function Decide({
  approve,
  reject,
  disabled,
  onApprove,
  onReject,
}: {
  approve: string
  reject: string
  disabled?: boolean
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <div className="flex gap-2.5">
      <button type="button" disabled={disabled} onClick={onApprove} className={`flex-1 min-w-0 ${BTN_SHELL}`}>
        <Strip tone="ink" className="py-2.5 text-[16px]">
          {approve}
        </Strip>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onReject}
        className={`${ANTON} flex-1 min-w-0 py-2.5 rounded-sm ring-2 ring-inset ring-[#c21f24] text-[#c21f24] text-[16px] tracking-[.03em] disabled:opacity-50 ${PRESS}`}
      >
        {reject}
      </button>
    </div>
  )
}

export function BlackStrip({ icon, title, sub, onClick }: { icon: IconName; title: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`w-full rounded-[14px] bg-[#161616] text-[#fbf6ec] p-4 flex items-center gap-3 text-left ${LIFTED} ${PRESS}`}>
      <span className={`w-9 h-9 shrink-0 rounded-[10px] -rotate-3 flex items-center justify-center ${TINT.gold}`}>
        <Icon name={icon} className="w-[18px] h-[18px]" />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`${ANTON} block text-[18px] leading-tight tracking-[.02em]`}>{title}</span>
        <span className={`${MONO} block text-[11px] text-[#fbf6ec]/75 truncate`}>{sub}</span>
      </span>
      <Icon name="chevron" className="w-5 h-5 shrink-0 text-[#ffd83d]" sw={2} />
    </button>
  )
}
