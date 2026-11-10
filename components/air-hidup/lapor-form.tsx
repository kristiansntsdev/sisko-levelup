'use client'
import { useState } from 'react'
import { ANTON, BTN, BTN_OUTLINE, ERROR, LABEL, MONO, PAPER_INPUT, PaperField, PANEL, PRESS, Strip } from '@/components/pwa/paper-ui'
import { Icon } from '@/components/pwa/ui'
import { AIR_ISI_MAX, AIR_JUMLAH_MAX, hariLabel, validateLaporan, type KotaAir, type LaporanInput } from '@/lib/air-hidup'
import { DropIcon, WATER } from './bar'
import { ShareSheet, type ShareData } from './share-card'

type Props = {
  namaKota: string
  /** hari WIB sekarang (yyyy-mm-dd) */
  today: string
  /** kota lain, sudah terurut terhaus dulu */
  kotaLain: KotaAir[]
  /** mengembalikan id laporan, atau pesan error */
  onSubmit: (input: LaporanInput) => Promise<{ ok: true; id: number } | { ok: false; error: string }>
  onAlirkan: (idLaporan: number, idCabang: number) => Promise<void>
  /** ubah foto yang dipilih jadi data URL kecil / URL */
  toPhoto: (file: File) => Promise<string>
  onDone: () => void
}

/** Lapor WW: satu foto, tanggal, jumlah orang, satu kalimat. Sesudahnya: kartu bagikan + alirkan ke kota lain. */
export function LaporForm({ namaKota, today, kotaLain, onSubmit, onAlirkan, toPhoto, onDone }: Props) {
  const [tanggal, setTanggal] = useState(today)
  const [jumlah, setJumlah] = useState('')
  const [isi, setIsi] = useState('')
  const [foto, setFoto] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ id: number; share: ShareData } | null>(null)
  const [alir, setAlir] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  async function pickFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      setFoto(await toPhoto(f))
    } catch {
      setError('Foto tidak bisa dibaca. Coba foto lain.')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    const input: LaporanInput = { tanggal, jumlah: Number(jumlah), isi, foto }
    const err = validateLaporan(input, today)
    if (err) return setError(err)
    setError('')
    setBusy(true)
    const res = await onSubmit(input)
    setBusy(false)
    if (!res.ok) return setError(res.error)
    setDone({ id: res.id, share: { namaKota, jumlah: input.jumlah, isi: input.isi.trim(), tanggal, foto } })
  }

  async function alirkan(k: KotaAir) {
    if (!done || alir) return
    await onAlirkan(done.id, k.idCabang)
    setAlir(k.namaKota)
  }

  if (done) {
    return (
      <div className="space-y-5">
        <div className={`relative px-5 py-6 text-center ${PANEL}`}>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: WATER }}>
            <DropIcon className="h-7 w-7" />
          </span>
          <p className={`${ANTON} mt-3 text-[28px] leading-none`}>Air Hidup penuh lagi</p>
          <p className={`${MONO} mt-2 text-[12.5px] leading-relaxed text-[#44403c]`}>
            {namaKota} sudah minum. Sekarang alirkan ke kota yang haus supaya mereka ikut minum.
          </p>
          <button type="button" onClick={() => setShareOpen(true)} className={`${BTN} mt-5`}>
            <Strip tone="ink" className="py-2.5 text-[16px]">
              <Icon name="share" className="h-4 w-4" />
              Bagikan Kartu
            </Strip>
          </button>
        </div>

        <section className={`px-4 py-4 ${PANEL}`}>
          <h2 className={`${ANTON} text-[22px] leading-none`}>Alirkan ke kota lain</h2>
          <p className={`${MONO} mt-1.5 text-[11.5px] text-[#57534e]`}>Kota yang paling lama tidak minum ada di atas. Pilih satu.</p>
          {alir ? (
            <p className={`${MONO} mt-4 flex items-center gap-2 rounded-[10px] border-2 border-dotted border-[#161616]/50 px-3 py-2.5 text-[12px] font-bold`}>
              <Icon name="check" className="h-4 w-4 shrink-0" sw={3} />
              Air Hidup mengalir ke {alir}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {kotaLain.map((k) => (
                <li key={k.idCabang}>
                  <button
                    type="button"
                    onClick={() => alirkan(k)}
                    className={`flex w-full items-center justify-between gap-3 rounded-[10px] bg-[#efe8da]/50 px-3.5 py-3 text-left ring-1 ring-[#161616]/15 ${PRESS}`}
                  >
                    <span className="min-w-0">
                      <span className={`${ANTON} block truncate text-[17px] leading-tight`}>{k.namaKota}</span>
                      <span className={`${LABEL} block text-[9.5px] text-[#57534e]`}>terakhir minum: {hariLabel(k.hari)}</span>
                    </span>
                    <Icon name="chevron" className="h-5 w-5 shrink-0" sw={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button type="button" onClick={onDone} className={BTN_OUTLINE}>
          {alir ? 'Selesai' : 'Lewati'}
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
      <PaperField label="Berapa orang yang minum?">
        <input
          inputMode="numeric"
          value={jumlah}
          onChange={(e) => setJumlah(e.target.value.replace(/\D/g, '').slice(0, String(AIR_JUMLAH_MAX).length))}
          placeholder="Contoh: 12"
          className={PAPER_INPUT}
        />
      </PaperField>
      <PaperField label="Apa yang kalian terima?">
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
            // eslint-disable-next-line @next/next/no-img-element -- local data URL preview
            <img src={foto} alt="Pratinjau foto WW" className="h-16 w-16 shrink-0 rounded-[8px] object-cover" />
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
