'use client'
import { useEffect, useState } from 'react'
import { ANTON, BTN, BTN_OUTLINE, ERROR, LABEL, MONO, PAPER_INPUT, PaperField, PANEL, PRESS, Strip } from '@/components/pwa/paper-ui'
import { Icon } from '@/components/pwa/ui'
import { AIR_ISI_MAX, AIR_JUMLAH_MAX, AIR_SEGAR_HARI, daysBetween, validateLaporan } from '@/lib/air-hidup'
import { shrinkPhotoForUpload } from '@/lib/shrink-photo'
import { DropIcon, WATER } from './bar'
import { ShareSheet, type ShareData } from './share-card'

type Props = {
  namaKota: string
  /** hari WIB sekarang (yyyy-mm-dd) */
  today: string
  /** FormData: tanggal, jumlah, isi, foto (opsional). Mengembalikan id laporan, atau pesan error. */
  onSubmit: (fd: FormData) => Promise<{ ok: true; id: number } | { ok: false; error: string }>
  onDone: () => void
}

/** Lapor WW: satu foto, tanggal, jumlah orang, satu kalimat. Sesudahnya: kartu bagikan. */
export function LaporForm({ namaKota, today, onSubmit, onDone }: Props) {
  const [tanggal, setTanggal] = useState(today)
  const [jumlah, setJumlah] = useState('')
  const [isi, setIsi] = useState('')
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ share: ShareData; penuh: boolean } | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    if (!foto) return
    return () => URL.revokeObjectURL(foto.url)
  }, [foto])

  async function pickFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const blob = await shrinkPhotoForUpload(f)
      setFoto({ blob, url: URL.createObjectURL(blob) })
    } catch {
      setError('Foto ini tidak bisa dibuka. Coba foto JPG atau PNG.')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    const input = { tanggal, jumlah: Number(jumlah), isi }
    const err = validateLaporan(input, today)
    if (err) return setError(err)
    setError('')
    setBusy(true)
    const fd = new FormData()
    fd.set('tanggal', tanggal)
    fd.set('jumlah', String(input.jumlah))
    fd.set('isi', isi.trim())
    if (foto) fd.set('foto', foto.blob, 'foto.jpg')
    let res: Awaited<ReturnType<Props['onSubmit']>>
    try {
      res = await onSubmit(fd)
    } catch {
      res = { ok: false, error: 'Gagal mengirim. Coba lagi.' }
    }
    setBusy(false)
    if (!res.ok) return setError(res.error)
    setDone({
      penuh: daysBetween(tanggal, today) < AIR_SEGAR_HARI,
      share: { namaKota, jumlah: input.jumlah, isi: input.isi.trim(), tanggal, foto: foto?.url ?? '' },
    })
  }

  if (done) {
    return (
      <div className="space-y-5">
        <div className={`relative px-5 py-6 text-center ${PANEL}`}>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: WATER }}>
            <DropIcon className="h-7 w-7" />
          </span>
          <p className={`${ANTON} mt-3 text-[28px] leading-none`}>{done.penuh ? 'Air Hidup penuh lagi' : 'Laporan terkirim'}</p>
          <p className={`${MONO} mt-2 text-[12.5px] leading-relaxed text-[#44403c]`}>
            {done.penuh ? `${namaKota} sudah minum. Bagikan kabarnya supaya kota lain ikut datang dan minum.` : `Laporan WW ${namaKota} tersimpan. WW ini sudah lama, jadi bar air tidak berubah.`}
          </p>
          <button type="button" onClick={() => setShareOpen(true)} className={`${BTN} mt-5`}>
            <Strip tone="ink" className="py-2.5 text-[16px]">
              <Icon name="share" className="h-4 w-4" />
              Bagikan Kartu
            </Strip>
          </button>
        </div>
        <button type="button" onClick={onDone} className={BTN_OUTLINE}>
          Selesai
        </button>
        {shareOpen && <ShareSheet data={done.share} onClose={() => setShareOpen(false)} />}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className={`relative space-y-4 px-4 py-5 ${PANEL}`} noValidate>
      <PaperField label="Tanggal WW">
        <input type="date" value={tanggal} max={today} onChange={(e) => setTanggal(e.target.value)} className={PAPER_INPUT} required />
      </PaperField>
      <PaperField label="Berapa orang yang hadir?">
        <input
          inputMode="numeric"
          value={jumlah}
          onChange={(e) => setJumlah(e.target.value.replace(/\D/g, '').slice(0, String(AIR_JUMLAH_MAX).length))}
          placeholder="Contoh: 12"
          className={PAPER_INPUT}
        />
      </PaperField>
      <PaperField label="Apa yang kalian terima dari WW ini?">
        <textarea
          value={isi}
          onChange={(e) => setIsi(e.target.value.slice(0, AIR_ISI_MAX))}
          rows={3}
          placeholder="Satu kalimat: apa yang Tuhan lakukan di WW ini"
          className={`${PAPER_INPUT} resize-none`}
        />
        <span className={`${LABEL} mt-1 block text-right text-[9.5px] text-[#57534e]`}>
          {isi.length}/{AIR_ISI_MAX}
        </span>
      </PaperField>
      <div>
        <span className={`${LABEL} mb-1.5 block text-[10px] font-bold text-[#44403c]`}>Foto (opsional)</span>
        <label className={`flex cursor-pointer items-center gap-3 rounded-[10px] border-2 border-dotted border-[#161616]/30 p-2.5 ${PRESS}`}>
          <input type="file" accept="image/*" onChange={pickFoto} className="sr-only" />
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob URL preview
            <img src={foto.url} alt="Pratinjau foto WW" className="h-16 w-16 shrink-0 rounded-[8px] object-cover" />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[8px] bg-[#161616]/[.07]">
              <Icon name="camera" className="h-6 w-6" />
            </span>
          )}
          <span className={`${MONO} text-[12px] font-bold`}>{foto ? 'Ganti foto' : 'Pilih foto WW'}</span>
        </label>
      </div>
      {error && (
        <p role="alert" className={ERROR}>
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={BTN}>
        <Strip>{busy ? 'Mengirim…' : 'Kirim Laporan'}</Strip>
      </button>
    </form>
  )
}
