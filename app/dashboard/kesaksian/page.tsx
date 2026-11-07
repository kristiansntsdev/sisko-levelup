'use client'
import { useEffect, useState } from 'react'
import { kirimKesaksian, listKesaksianSaya } from '@/lib/actions/kesaksian'
import { KESAKSIAN_MAX, type KesaksianItem } from '@/lib/kesaksian'
import { BTN, BTN_SHELL, ERROR, LABEL, MONO, PANEL, PaperHeader, PaperMain, PaperToast, Strip, TAPE } from '@/components/pwa/paper-ui'
import { Field, FLD, Icon, Sheet, SheetHead } from '@/components/pwa/ui'

// Ruled note paper, same line color as the landing page's note. Text line height matches the rule spacing.
const LINED = 'bg-[repeating-linear-gradient(transparent_0_27px,rgba(70,100,170,.16)_27px_28px)] leading-[28px]'

export default function KesaksianPage() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [items, setItems] = useState<KesaksianItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    listKesaksianSaya()
      .then((rows) => alive && setItems(rows))
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  async function kirim() {
    setSaving(true)
    setError(null)
    try {
      const r = await kirimKesaksian(text)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setItems((cur) => [r.item, ...cur])
      setOpen(false)
      setText('')
      setToast('Kesaksian tersimpan')
      setTimeout(() => setToast(null), 2400)
    } catch {
      setError('Gagal menyimpan. Coba lagi ya.')
    } finally {
      setSaving(false)
    }
  }

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
        {loading ? (
          <p className={`${MONO} text-[12px] text-[#57534e]`}>Memuat…</p>
        ) : items.length === 0 ? (
          <div className={`relative ${PANEL}`}>
            <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
            <p className={`${MONO} ${LINED} rounded-[14px] text-[13px] text-[#44403c] px-5 pt-7 pb-[28px]`}>
              Belum ada kesaksian. Cerita berkatmu bisa jadi kekuatan bagi yang lain.
            </p>
          </div>
        ) : (
          items.map((i) => (
            <div key={i.id} className={`rounded-[14px] px-5 pt-7 pb-[28px] ${LINED} ${PANEL}`}>
              <p className={`${MONO} text-[13px] whitespace-pre-wrap break-words`}>{i.isi}</p>
              <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>{i.tanggal}</p>
            </div>
          ))
        )}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)}>
        <SheetHead title="Tulis Kesaksian" sub="Tersimpan di akunmu, hanya kamu yang bisa melihatnya." />
        <Field label="Kesaksian">
          <textarea
            className={`${FLD} min-h-[120px] resize-none`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={KESAKSIAN_MAX}
            placeholder="Tuliskan kesaksianmu..."
          />
        </Field>
        {error && <p className={`mt-3 ${ERROR}`}>{error}</p>}
        <button type="button" disabled={!text.trim() || saving} onClick={kirim} className={`mt-4 ${BTN}`}>
          <Strip>{saving ? 'Menyimpan…' : 'Kirim'}</Strip>
        </button>
      </Sheet>
      <PaperToast msg={toast} />
    </PaperMain>
  )
}
