'use client'
import { Icon, LIFT } from './ui'

export const PAGE_SIZE_TODO = 5
export const PAGE_SIZE_EVENT = 10

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
    <label className={`flex items-center gap-2.5 ${LIFT} px-4 py-3.5`}>
      <Icon name="search" className="w-5 h-5 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="search"
        placeholder={placeholder}
        enterKeyHint="search"
        className="flex-1 min-w-0 outline-none text-[15px] bg-transparent"
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
    <div className="flex items-center justify-between gap-3 pt-2">
      <button
        type="button"
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
        className="px-3.5 py-2 rounded-xl text-[13px] font-semibold ring-1 ring-slate-200 bg-white text-slate-700 disabled:opacity-40"
      >
        Sebelumnya
      </button>
      <span className="text-[12.5px] font-semibold text-slate-500">
        {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        className="px-3.5 py-2 rounded-xl text-[13px] font-semibold ring-1 ring-slate-200 bg-white text-slate-700 disabled:opacity-40"
      >
        Berikutnya
      </button>
    </div>
  )
}
