'use client'
import type { ReactNode } from 'react'
import {
  Avatar,
  BTN_RED,
  CARD,
  FLD,
  Field,
  Hero,
  HomeIcon,
  Icon,
  LIFT,
  ModeSwitch,
  PAGE_BG,
  PageHero,
  Pill,
  PlainBar,
  Sheet,
  SheetHead,
  TintIcon,
  Toast,
  fCard,
  type IconName,
  type PillTone,
  type Tint,
} from '@/components/pwa/ui'

export {
  Avatar,
  BTN_RED,
  CARD,
  FLD,
  Field,
  Hero,
  HomeIcon,
  Icon,
  LIFT,
  ModeSwitch,
  PAGE_BG,
  PageHero,
  Pill,
  PlainBar,
  Sheet,
  SheetHead,
  TintIcon,
  Toast,
  fCard,
}
export type { IconName, PillTone, Tint }

export const H3 = 'font-extrabold text-[17px] text-[#3b1417]'
export { ALK_BASE, ALK_EVENT_BASE } from './paths'

const DATE_TONE = {
  red: 'bg-[#fbeceb] text-[#c9232c] ring-1 ring-[#f3d3d3]',
  solid: 'bg-[#c9232c] text-white',
  slate: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  glass: 'bg-white/15 text-white ring-1 ring-white/30',
}

export function DateBlock({ d, m, tone = 'red' }: { d: string; m: string; tone?: keyof typeof DATE_TONE }) {
  return (
    <div className={`w-[52px] h-[56px] shrink-0 rounded-xl flex flex-col items-center justify-center leading-none ${DATE_TONE[tone]}`}>
      <span className="text-[20px] font-extrabold">{d}</span>
      <span className="text-[10px] font-bold tracking-wider mt-1">{m}</span>
    </div>
  )
}

export function StatTriple({ items }: { items: [number | string, string, string][] }) {
  return (
    <div className={`${LIFT} p-4 grid grid-cols-3 divide-x divide-slate-100 text-center`}>
      {items.map(([v, l, c]) => (
        <div key={l}>
          <p className={`text-[26px] font-extrabold leading-none ${c}`}>{v}</p>
          <p className="text-[12px] text-slate-500 mt-1.5">{l}</p>
        </div>
      ))}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className={`${CARD} text-center text-[13px] text-slate-400 py-6`}>{children}</p>
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
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition">
      <TintIcon name={icon} tint={tint} />
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-semibold text-slate-800 leading-snug">{title}</span>
        {sub && <span className="block text-[12px] text-slate-500 mt-0.5">{sub}</span>}
      </span>
      {right ?? <Icon name="chevron" className="w-5 h-5 text-slate-300 shrink-0" sw={2} />}
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
    <div className={`${lift ? 'bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.3)]' : 'bg-white rounded-3xl shadow-sm ring-1 ring-slate-100'} p-5`}>
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
        <TintIcon name={icon} tint={tint} />
        <div className="leading-tight">
          <p className="font-extrabold text-[15px] text-[#3b1417]">{title}</p>
          <p className="text-[12px] text-slate-500 mt-0.5">{sub}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export function Note({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'sky' | 'rose' }) {
  const cls = {
    gold: 'bg-[#f8f0dd] ring-[#ecdcb3] text-[#6b551c] [&>svg]:text-[#96792a]',
    sky: 'bg-sky-50 ring-sky-200 text-sky-800 [&>svg]:text-sky-600',
    rose: 'bg-rose-50 ring-rose-200 text-rose-800 [&>svg]:text-rose-600',
  }[tone]
  return (
    <div className={`flex gap-3 rounded-2xl ring-1 p-3.5 text-[12.5px] leading-relaxed ${cls}`}>
      <Icon name="alert" className="w-5 h-5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

export function TopBar({ title, back }: { title: string; back?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {back && (
        <button type="button" onClick={back} aria-label="Kembali" className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-white/10">
          <Icon name="chevronLeft" className="w-7 h-7" sw={2} />
        </button>
      )}
      <h2 className="font-extrabold text-[18px] flex-1 truncate">{title}</h2>
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
    <div className="grid grid-cols-2 gap-2">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`py-2.5 rounded-xl text-[13px] font-semibold ring-1 transition ${
            value === v ? 'bg-[#c9232c] text-white ring-[#c9232c]' : 'bg-slate-50 text-slate-600 ring-slate-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
