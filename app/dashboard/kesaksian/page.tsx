'use client'
import { useState } from 'react'
import { BTN, BTN_SHELL, LABEL, MONO, PANEL, PaperHeader, PaperMain, PaperToast, Strip, TAPE } from '@/components/pwa/paper-ui'
import { Field, FLD, Icon, Sheet, SheetHead } from '@/components/pwa/ui'

// Ruled note paper, same line color as the landing page's note. Text line height matches the rule spacing.
const LINED = 'bg-[repeating-linear-gradient(transparent_0_27px,rgba(70,100,170,.16)_27px_28px)] leading-[28px]'

export default function KesaksianPage() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  // ponytail: no kesaksian table yet — UI stub only
  const items: { t: string; when: string }[] = []

  return (
    <PaperMain>
      <PaperHeader
        sticker="Bagikan cerita berkatmu"
        title="Kesaksian Saya"
        action={
          <button type="button" onClick={() => setOpen(true)} className={`shrink-0 rotate-2 ${BTN_SHELL}`}>
            <Strip className="px-4 py-2 text-[16px]">
              <Icon name="edit" className="w-4 h-4" sw={2.2} />
              Tulis
            </Strip>
          </button>
        }
      />
      <div className="px-5 mt-5 space-y-4">
        {items.length === 0 ? (
          <div className={`relative ${PANEL}`}>
            <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
            <p className={`${MONO} ${LINED} rounded-[14px] text-[13px] text-[#44403c] px-5 pt-7 pb-[28px]`}>
              Belum ada kesaksian. Cerita berkatmu bisa jadi kekuatan bagi yang lain.
            </p>
          </div>
        ) : (
          items.map((i) => (
            <div key={i.when} className={`rounded-[14px] px-5 pt-7 pb-[28px] ${LINED} ${PANEL}`}>
              <p className={`${MONO} text-[13px]`}>{i.t}</p>
              <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>{i.when}</p>
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
          className={`mt-4 ${BTN}`}
        >
          <Strip>Kirim</Strip>
        </button>
      </Sheet>
      <PaperToast msg={toast} />
    </PaperMain>
  )
}
