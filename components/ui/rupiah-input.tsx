'use client'

import { useLayoutEffect, useRef } from 'react'

/** Angka saja tanpa nol di depan ("Rp. 01.500" → "1500"); maks 13 digit. */
export const danaDigits = (s: string) => s.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 13)
/** "1500000" → "1.500.000" */
export const ribuan = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const WRAPPER =
  'flex items-center gap-2 px-3.5 py-3 border-[1.5px] border-border rounded-input bg-surface focus-within:border-accent transition-colors'
const INPUT = 'flex-1 min-w-0 bg-transparent outline-none text-[15px] text-fg placeholder:text-muted'
const PREFIX = 'text-[15px] font-semibold text-muted shrink-0'

/**
 * Input rupiah: prefix "Rp." tetap, tampil dengan titik ribuan, nilai yang disimpan tetap angka saja
 * (sama seperti sebelumnya, dibaca danaNumber). Kursor dijaga di posisi angka yang sama saat titik bergeser.
 * `className` / `inputClassName` / `prefixClassName` menimpa gaya default (tema app) untuk layar berpalet lain.
 */
export function RupiahInput({
  value,
  onChange,
  disabled = false,
  className = WRAPPER,
  inputClassName = INPUT,
  prefixClassName = PREFIX,
  ariaLabel,
}: {
  value: string
  onChange: (digits: string) => void
  disabled?: boolean
  className?: string
  inputClassName?: string
  prefixClassName?: string
  ariaLabel?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const caretDigits = useRef<number | null>(null)
  const shown = ribuan(value)

  useLayoutEffect(() => {
    const el = ref.current
    const n = caretDigits.current
    caretDigits.current = null
    if (!el || n == null || document.activeElement !== el) return
    let pos = 0
    for (let seen = 0; pos < shown.length && seen < n; pos++) if (/\d/.test(shown[pos])) seen++
    el.setSelectionRange(pos, pos)
  }, [shown])

  return (
    <label className={`${className} ${disabled ? 'opacity-60' : ''}`}>
      <span className={prefixClassName}>Rp.</span>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={ariaLabel}
        value={shown}
        placeholder="0"
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value
          let digits = raw.replace(/\D/g, '')
          // n = jumlah angka di kiri kursor
          let n = raw.slice(0, e.target.selectionStart ?? raw.length).replace(/\D/g, '').length
          // Backspace tepat di titik: hapus angka sebelum titik itu, bukan diam saja
          if (danaDigits(raw) === value && raw.length < shown.length && n > 0) {
            digits = digits.slice(0, n - 1) + digits.slice(n)
            n -= 1
          }
          const lead = digits.length - digits.replace(/^0+(?=\d)/, '').length
          const next = danaDigits(digits)
          caretDigits.current = Math.min(Math.max(0, n - lead), next.length)
          onChange(next)
        }}
        className={inputClassName}
      />
    </label>
  )
}
