'use client'
import { useState } from 'react'
import type { CabangOption } from '@/lib/actions/event'
import { Chip, MONO, PAPER_INPUT, PaperField } from '@/components/pwa/paper-ui'
import { Icon, Sheet, SheetHead } from '@/components/pwa/ui'

export function KotaPicker({
  cabangs,
  value,
  onChange,
  label = 'LevelUP Kota (opsional)',
}: {
  cabangs: CabangOption[]
  value: string
  onChange: (id: string) => void
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const selected = cabangs.find((c) => c.id === value)
  const needle = q.trim().toLowerCase()
  const shown = needle ? cabangs.filter((c) => c.nama.toLowerCase().includes(needle)) : cabangs

  function pick(id: string) {
    onChange(id)
    setOpen(false)
    setQ('')
  }

  return (
    <>
      <PaperField label={label}>
        <button type="button" onClick={() => setOpen(true)} className={`${PAPER_INPUT} flex items-center gap-2 text-left ${selected ? '' : 'text-[#57534e]'}`}>
          <Icon name="pin" className={`w-[18px] h-[18px] shrink-0 ${selected ? 'text-[#c21f24]' : ''}`} />
          <span className="flex-1 min-w-0 truncate">{selected?.nama ?? 'Cari LevelUP kota...'}</span>
          <Icon name="search" className="w-4 h-4 shrink-0" />
        </button>
      </PaperField>
      <Sheet
        open={open}
        onClose={() => {
          setOpen(false)
          setQ('')
        }}
      >
        <SheetHead title="Pilih LevelUP Kota" sub="Ketik nama kota buat nyari lebih cepet" />
        <label className="flex items-center gap-2.5 rounded-full bg-[#efe8da]/50 ring-1 ring-[#161616]/15 px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#161616] transition">
          <Icon name="search" className="w-5 h-5 shrink-0 text-[#c21f24]" sw={2.2} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kota..."
            autoFocus
            className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-[#161616] placeholder:text-[#57534e]/75"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Hapus pencarian" className="text-[#57534e]">
              <Icon name="x" className="w-5 h-5" />
            </button>
          )}
        </label>
        <div className="mt-3 space-y-2 max-h-[50vh] overflow-y-auto -mx-1 px-1 py-0.5">
          {shown.length ? (
            shown.map((c) => {
              const on = c.id === value
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pick(c.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition ${on ? 'ring-2 ring-[#161616] bg-[#ffd83d]/25' : 'ring-1 ring-[#161616]/15 bg-white'}`}
                >
                  <Chip name="pin" className={on ? 'bg-[#ffd83d] text-[#161616]' : 'bg-[#161616]/[.07] text-[#161616]'} />
                  <span className="flex-1 min-w-0 font-bold text-[14.5px] text-[#161616] truncate">{c.nama}</span>
                  {on && <Icon name="check" className="w-5 h-5 text-[#161616] shrink-0" sw={2.6} />}
                </button>
              )
            })
          ) : (
            <p className={`${MONO} text-center text-[12px] text-[#57534e] py-8`}>Gak ketemu “{q.trim()}”</p>
          )}
        </div>
      </Sheet>
    </>
  )
}
