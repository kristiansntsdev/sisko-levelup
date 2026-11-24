'use client'
import { useEffect, useState } from 'react'
import { ANTON, BTN, BTN_OUTLINE, ERROR, LABEL, MONO, PAPER_INPUT, PaperField, PANEL, PRESS, Strip } from '@/components/pwa/paper-ui'
import { Icon } from '@/components/pwa/ui'
import { AIR_ISI_MAX, AIR_JUMLAH_MAX, AIR_KERING_HARI, FOTO_FOKUS_TENGAH, validateLaporan, type LaporanEdit } from '@/lib/air-hidup'
import { shrinkPhotoForUpload } from '@/lib/shrink-photo'
import { DropIcon, WATER } from './bar'
import { FotoFokus, type Fokus } from './foto-fokus'
import { ShareSheet, type ShareData } from './share-card'

type Props = {
  namaKota: string
  /** hari WIB sekarang (yyyy-mm-dd) */
  today: string
  /** FormData: tanggal, jumlah, isi, foto (opsional). Mengembalikan id laporan, atau pesan error. */
  onSubmit: (fd: FormData) => Promise<{ ok: true; id: number } | { ok: false; error: string }>
  onDone: () => void
  /** Ada = mode edit: form terisi dari laporan ini, tombol Simpan Perubahan, tanpa kartu bagikan. */
  awal?: LaporanEdit
  /** Level air kota sebelum lapor (0-1): bar di pop-up naik dari sini ke penuh. */
  levelAwal?: number
}

/**
 * Pop-up sesudah lapor: tiap laporan mengisi air kota penuh lagi (dihitung dari hari laporan dikirim), bar naik dari
 * level sebelumnya ke 100%, lalu Bagikan Kartu / Selesai.
 */
function TerisiPopup({ namaKota, levelAwal, onShare, onDone }: { namaKota: string; levelAwal: number; onShare: () => void; onDone: () => void }) {
  const [penuh, setPenuh] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setPenuh(true), 250)
    return () => clearTimeout(t)
  }, [])
  const pct = penuh ? 100 : Math.round(Math.min(1, Math.max(0, levelAwal)) * 100)
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="air-terisi" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className={`relative w-full max-w-[380px] px-5 pb-5 pt-7 text-center ${PANEL}`}>
        <span
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white transition-transform duration-500 ${penuh ? 'scale-110' : 'scale-90'}`}
          style={{ background: WATER }}
        >
          <DropIcon className="h-8 w-8" />
        </span>
        <p id="air-terisi" className={`${ANTON} mt-4 text-[30px] leading-none`}>
          Airmu terisi kembali!
        </p>
        <p className={`${MONO} mt-2 text-[12.5px] leading-relaxed text-[#44403c]`}>
          {namaKota} sudah minum Air Hidup. Air penuh lagi untuk {AIR_KERING_HARI} hari ke depan.
        </p>
        <div
          role="progressbar"
          aria-label={`Air Hidup ${namaKota}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="relative mt-5 h-9 overflow-hidden rounded-full border-2 border-[#161616] bg-[#fffdf7] text-left"
        >
          <div className="h-full rounded-full transition-[width] duration-[1400ms] ease-out" style={{ width: `${pct}%`, background: WATER }} />
          <span className={`${MONO} absolute inset-y-0 right-3 flex items-center text-[13px] font-bold ${pct > 85 ? 'text-white' : 'text-[#161616]'}`}>{pct}%</span>
        </div>
        <p className={`${MONO} mt-4 text-[11px] leading-snug text-[#57534e]`}>
          “Barangsiapa minum air yang akan Kuberikan kepadanya, ia tidak akan haus untuk selama-lamanya.” · Yohanes 4:14
        </p>
        <button type="button" onClick={onShare} className={`${BTN} mt-5`}>
          <Strip tone="ink" className="py-2.5 text-[16px]">
            <Icon name="share" className="h-4 w-4" />
            Bagikan Kartu
          </Strip>
        </button>
        <button type="button" onClick={onDone} className={`${BTN_OUTLINE} mt-2.5`}>
          Selesai
        </button>
      </div>
    </div>
  )
}

/** Lapor WW: satu foto, tanggal, jumlah orang, cerita. Sesudahnya: pop-up air terisi + kartu bagikan. */
export function LaporForm({ namaKota, today, onSubmit, onDone, awal, levelAwal = 0 }: Props) {
  const [tanggal, setTanggal] = useState(awal?.tanggal ?? today)
  const [jumlah, setJumlah] = useState(awal ? String(awal.jumlah) : '')
  const [isi, setIsi] = useState(awal?.isi ?? '')
  // blob null = foto lama dari server (belum diganti)
  const [foto, setFoto] = useState<{ blob: Blob | null; url: string } | null>(awal?.foto ? { blob: null, url: awal.foto } : null)
  const [fokus, setFokus] = useState<Fokus>({ x: awal?.fotoX ?? FOTO_FOKUS_TENGAH, y: awal?.fotoY ?? FOTO_FOKUS_TENGAH })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ share: ShareData } | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  // Dikunci saat form dibuka: sesudah lapor halaman di-refresh dan level kota sudah 100%, padahal pop-up naik dari level lama.
  const [levelSebelum] = useState(levelAwal)

  useEffect(() => {
    if (!foto?.blob) return
    const url = foto.url
    return () => URL.revokeObjectURL(url)
  }, [foto])

  async function pickFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const blob = await shrinkPhotoForUpload(f)
      setFoto({ blob, url: URL.createObjectURL(blob) })
      setFokus({ x: FOTO_FOKUS_TENGAH, y: FOTO_FOKUS_TENGAH })
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
    if (foto?.blob) fd.set('foto', foto.blob, 'foto.jpg')
    if (foto) {
      fd.set('foto_x', String(fokus.x))
      fd.set('foto_y', String(fokus.y))
    }
    if (awal?.foto && !foto) fd.set('hapusFoto', '1')
    let res: Awaited<ReturnType<Props['onSubmit']>>
    try {
      res = await onSubmit(fd)
    } catch {
      res = { ok: false, error: 'Gagal mengirim. Coba lagi.' }
    }
    setBusy(false)
    if (!res.ok) return setError(res.error)
    if (awal) return onDone()
    setDone({ share: { namaKota, jumlah: input.jumlah, isi: input.isi.trim(), tanggal, foto: foto?.url ?? '' } })
  }

  if (done) {
    return (
      <>
        <TerisiPopup namaKota={namaKota} levelAwal={levelSebelum} onShare={() => setShareOpen(true)} onDone={onDone} />
        {shareOpen && <ShareSheet data={done.share} onClose={() => setShareOpen(false)} />}
      </>
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
          rows={6}
          placeholder="Ceritakan apa yang Tuhan lakukan di WW ini"
          className={`${PAPER_INPUT} resize-none`}
        />
        <span className={`${LABEL} mt-1 block text-right text-[9.5px] text-[#57534e]`}>
          {isi.length}/{AIR_ISI_MAX}
        </span>
        <span className={`${MONO} mt-1 block text-[11.5px] leading-snug text-[#57534e]`}>
          Di kartu hanya 3 baris awal yang tampil. Cerita lengkapnya terbuka saat kartu diketuk.
        </span>
      </PaperField>
      <div className="space-y-3">
        <span className={`${LABEL} block text-[10px] font-bold text-[#44403c]`}>Foto (opsional)</span>
        <label className={`flex cursor-pointer items-center gap-3 rounded-[10px] border-2 border-dotted border-[#161616]/30 p-2.5 ${PRESS}`}>
          <input type="file" accept="image/*" onChange={pickFoto} className="sr-only" />
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[8px] bg-[#161616]/[.07]">
            <Icon name="camera" className="h-6 w-6" />
          </span>
          <span className={`${MONO} text-[12px] font-bold`}>{foto ? 'Ganti foto' : 'Pilih foto WW'}</span>
        </label>
        {foto && (
          <>
            <FotoFokus src={foto.url} fokus={fokus} onChange={setFokus} />
            <button type="button" onClick={() => setFoto(null)} className={`${MONO} text-[12px] font-bold text-[#b91c1c] underline decoration-dotted underline-offset-4`}>
              Hapus foto
            </button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className={ERROR}>
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={BTN}>
        <Strip>{busy ? (awal ? 'Menyimpan…' : 'Mengirim…') : awal ? 'Simpan Perubahan' : 'Kirim Laporan'}</Strip>
      </button>
    </form>
  )
}
