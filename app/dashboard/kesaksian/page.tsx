'use client'
import { useState } from 'react'
import { BTN_RED, Field, FLD, PageHero, Sheet, SheetHead, Toast } from '@/components/pwa/ui'

export default function KesaksianPage() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  // ponytail: no kesaksian table yet — UI stub only
  const items: { t: string; when: string }[] = []

  return (
    <main>
      <PageHero
        title="Kesaksian Saya"
        sub="Bagikan cerita berkatmu"
        action={{ label: 'Tulis', icon: 'edit', onClick: () => setOpen(true) }}
        pb="pb-14"
      />
      <div className="px-5 -mt-8 relative z-10 space-y-3">
        {items.length === 0 ? (
          <p className="bg-white rounded-2xl ring-1 ring-slate-100 text-center text-[13px] text-slate-400 py-10 px-6">
            Belum ada kesaksian. Cerita berkatmu bisa jadi kekuatan bagi yang lain.
          </p>
        ) : (
          items.map((i) => (
            <div key={i.when} className="bg-white rounded-2xl ring-1 ring-slate-100 p-4">
              <p className="text-[14px] text-slate-700 leading-relaxed">{i.t}</p>
              <p className="text-[11px] text-slate-400 mt-2">{i.when}</p>
            </div>
          ))
        )}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)}>
        <SheetHead title="Tulis Kesaksian" sub="Fitur simpan ke server segera hadir — draft lokal saja." />
        <Field label="Kesaksian">
          <textarea
            className={`${FLD} min-h-[120px] resize-none`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tuliskan kesaksianmu..."
          />
        </Field>
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => {
            setOpen(false)
            setText('')
            setToast('Kesaksian tersimpan di perangkat (stub)')
            setTimeout(() => setToast(null), 2400)
          }}
          className={`mt-4 w-full py-3.5 ${BTN_RED}`}
        >
          Kirim
        </button>
      </Sheet>
      <Toast msg={toast} />
    </main>
  )
}
