'use client'
import { useState } from 'react'
import type { InputProps } from './input'

/** Input password dengan tombol lihat / sembunyikan. Gaya sama dengan Input. */
export function PasswordInput({ label, error, className = '', id, ...props }: Omit<InputProps, 'type'>) {
  const [lihat, setLihat] = useState(false)
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const hasError = Boolean(error)
  return (
    <div className="flex flex-col gap-[6px]">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-fg2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={lihat ? 'text' : 'password'}
          className={`w-full pl-3 pr-12 py-3 border-[1.5px] rounded-input text-[15px] bg-surface text-fg outline-none transition-colors duration-150 ${
            hasError ? 'border-red focus:border-red' : 'border-border focus:border-accent'
          } ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setLihat((v) => !v)}
          aria-label={lihat ? 'Sembunyikan password' : 'Tampilkan password'}
          aria-pressed={lihat}
          className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-muted hover:text-fg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {lihat ? (
              <path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0112 6c6 0 9.5 6 9.5 6a17 17 0 01-3.2 3.9M6.3 7.6C3.9 9.3 2.5 12 2.5 12S6 18 12 18a9 9 0 004.3-1.1M9.9 9.9a3 3 0 004.2 4.2" />
            ) : (
              <>
                <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
      {error && <span className="text-[12px] text-red">{error}</span>}
    </div>
  )
}
