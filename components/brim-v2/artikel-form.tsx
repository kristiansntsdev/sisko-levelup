'use client'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveArtikel, uploadArtikelCover } from '@/lib/actions/artikel'
import { ARTIKEL_JUDUL_MAX, ARTIKEL_RINGKASAN_MAX } from '@/lib/artikel'
import { shrinkPhotoForUpload } from '@/lib/shrink-photo'
import { ANTON, BackBar, BTN, BTN_OUTLINE, ERROR, MONO, PANEL, PaperMain, Strip } from '@/components/pwa/paper-ui'
import { FLD, Field } from '@/components/alk-v2/ui'
import { JoditArtikelEditor } from './jodit-editor'
import { BRIM_ARTIKEL_BASE } from './paths'

export type ArtikelFormInitial = {
  id?: number
  judul: string
  ringkasan: string
  coverUrl: string
  isi: string
  published: boolean
}

export function ArtikelFormClient({ initial }: { initial: ArtikelFormInitial }) {
  const router = useRouter()
  const [judul, setJudul] = useState(initial.judul)
  const [ringkasan, setRingkasan] = useState(initial.ringkasan)
  const [coverUrl, setCoverUrl] = useState(initial.coverUrl)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const [mode, setMode] = useState<'draft' | 'publish' | null>(null)
  // The editor fires onChange per keystroke: a ref avoids re-rendering the whole form each time.
  const isiRef = useRef(initial.isi)
  const fileRef = useRef<HTMLInputElement>(null)
  const dirty = useRef(false)

  const back = initial.id ? `${BRIM_ARTIKEL_BASE}/${initial.id}` : BRIM_ARTIKEL_BASE

  function goBack() {
    if (dirty.current && !window.confirm('Perubahan belum disimpan. Keluar?')) return
    router.push(back)
  }

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setError('')
    setUploading(true)
    try {
      const blob = await shrinkPhotoForUpload(f)
      const fd = new FormData()
      fd.set('file', new File([blob], 'cover.jpg', { type: 'image/jpeg' }))
      const res = await uploadArtikelCover(fd)
      if (!res.ok) setError(res.error)
      else {
        setCoverUrl(res.url)
        dirty.current = true
      }
    } catch {
      setError('Gambar tidak bisa dibaca. Coba file JPG atau PNG.')
    } finally {
      setUploading(false)
    }
  }

  function submit(publish: boolean) {
    setError('')
    setMode(publish ? 'publish' : 'draft')
    startTransition(async () => {
      const res = await saveArtikel({ id: initial.id, judul, ringkasan, coverUrl, isi: isiRef.current, publish })
      if (!res.ok) {
        setError(res.error)
        setMode(null)
        return
      }
      dirty.current = false
      router.push(`${BRIM_ARTIKEL_BASE}/${res.id}`)
      router.refresh()
    })
  }

  const busy = pending || uploading

  return (
    <PaperMain>
      <BackBar title={initial.id ? 'Edit Artikel' : 'Artikel Baru'} onBack={goBack} />
      <div className="px-5 pt-5 pb-10 space-y-5" onInputCapture={() => (dirty.current = true)}>
        <div className={`p-4 space-y-4 ${PANEL}`}>
          <Field label="Judul">
            <input value={judul} onChange={(e) => setJudul(e.target.value)} maxLength={ARTIKEL_JUDUL_MAX} placeholder="Judul artikel" className={FLD} />
          </Field>
          <Field label="Ringkasan (opsional)">
            <textarea
              value={ringkasan}
              onChange={(e) => setRingkasan(e.target.value)}
              maxLength={ARTIKEL_RINGKASAN_MAX}
              rows={3}
              placeholder="Kosong = diambil dari awal isi artikel"
              className={`${FLD} resize-none`}
            />
          </Field>

          <div>
            <span className={`${MONO} block uppercase tracking-[.14em] text-[10px] font-bold text-[#44403c] mb-1.5`}>Cover</span>
            {coverUrl ? (
              <figure className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl} alt="Cover artikel" className="w-full h-auto rounded-[8px] bg-[#d6d0c4]" />
                <button
                  type="button"
                  onClick={() => {
                    setCoverUrl('')
                    dirty.current = true
                  }}
                  className={`${MONO} absolute right-2 top-2 rounded-[6px] bg-[#161616] px-2.5 py-1.5 text-[11px] font-bold text-[#ffd83d]`}
                >
                  Hapus
                </button>
              </figure>
            ) : null}
            <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className={`mt-2 ${BTN_OUTLINE}`}>
              {uploading ? 'Mengunggah…' : coverUrl ? 'Ganti cover' : 'Unggah cover'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onCover} />
          </div>
        </div>

        <div className={`p-4 ${PANEL}`}>
          <span className={`${MONO} block uppercase tracking-[.14em] text-[10px] font-bold text-[#44403c] mb-2`}>Isi artikel</span>
          <JoditArtikelEditor
            initial={initial.isi}
            onChange={(html) => {
              if (html !== isiRef.current) dirty.current = true
              isiRef.current = html
            }}
          />
          <p className={`${MONO} mt-2 text-[11px] text-[#57534e]`}>Gambar yang diunggah di editor otomatis dikecilkan jadi WebP.</p>
        </div>

        {error ? <p role="alert" className={ERROR}>{error}</p> : null}

        {initial.published ? (
          <button type="button" disabled={busy} onClick={() => submit(true)} className={BTN}>
            <Strip>{pending ? 'Menyimpan…' : 'Simpan Perubahan'}</Strip>
          </button>
        ) : (
          <div className="space-y-2.5">
            <button type="button" disabled={busy} onClick={() => submit(true)} className={BTN}>
              <Strip>{pending && mode === 'publish' ? 'Menerbitkan…' : 'Terbitkan'}</Strip>
            </button>
            <button type="button" disabled={busy} onClick={() => submit(false)} className={`${BTN_OUTLINE} ${ANTON}`}>
              {pending && mode === 'draft' ? 'Menyimpan…' : 'Simpan Draft'}
            </button>
          </div>
        )}
      </div>
    </PaperMain>
  )
}
