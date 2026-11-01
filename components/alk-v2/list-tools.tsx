'use client'
import { LABEL, MONO, PRESS } from '@/components/pwa/paper-ui'
import { Icon } from './ui'

export const PAGE_SIZE_TODO = 5
export const PAGE_SIZE_EVENT = 10

const PAGER = `${LABEL} text-[11px] font-bold rounded-full bg-[#fffdf7] text-[#161616] px-3.5 py-2 disabled:opacity-40 ${PRESS}`

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <label className="flex items-center gap-2.5 rounded-full bg-[#fffdf7] px-4 py-3 shadow-[0_14px_24px_-14px_rgba(40,30,10,.5)] focus-within:outline-2 focus-within:outline-[#161616]">
      <Icon name="search" className="w-5 h-5 shrink-0 text-[#c21f24]" sw={2.2} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="search"
        placeholder={placeholder}
        enterKeyHint="search"
        className={`${MONO} flex-1 min-w-0 outline-none text-[16px] text-[#161616] bg-transparent placeholder:text-[#57534e]`}
      />
    </label>
  )
}

export function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between gap-3 pt-3">
      <button type="button" disabled={page <= 0} onClick={() => onChange(page - 1)} className={PAGER}>
        ← Prev
      </button>
      <span className={`${MONO} text-[11px] font-bold text-[#44403c]`}>
        {page + 1} / {totalPages}
      </span>
      <button type="button" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)} className={PAGER}>
        Next →
      </button>
    </div>
  )
}
