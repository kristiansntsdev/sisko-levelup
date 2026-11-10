/* eslint-disable */
// GENERATED from app/dashboard/kota/alk/event/[id]/dana/dana-client.tsx by scripts/gen-demo-preview.mjs — do not edit; change the source or the generator and re-run.
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DANA_STEPS,
  danaStepIndex,
  isAjukan,
  isReimburseLocked,
  REIMBURSE_STAGE,
  reimburseRejection,
  reimburseReview,
  reimburseStage,
  REVIEW_STATE_LABEL,
} from '@/lib/reimburse-stage'
import { submitReimburse, type DanaForm, type ReimburseData } from '@/components/demo-preview/shim/actions/reimburse'
import type { KorwilOption } from '@/lib/surat-keuangan-data'
import { danaDigits, RupiahInput } from '@/components/ui/rupiah-input'

const inputCls =
  'w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors disabled:opacity-60'

function CopyText({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        })
      }}
      className="flex-1 py-3 rounded-btn border-[1.5px] border-border text-[14px] font-semibold text-fg"
    >
      {done ? 'Tersalin ✓' : label}
    </button>
  )
}

/** Sekretariat & BRIM Nasional → Korwil PPHTGD → PIC LevelUP Pusat → Keuangan PPHTGD → Cair */
function DanaTracker({ reimburse, form }: { reimburse: ReimburseData; form: DanaForm | null }) {
  const stage = reimburseStage(reimburse)
  const current = danaStepIndex(stage)
  const rejection = reimburseRejection(reimburse)
  const review = reimburseReview(reimburse)
  const at = form?.view?.at
  const stamps = [null, at?.korwil, at?.pic, at?.cair, null]
  return (
    <div className="bg-surface border border-border rounded-card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-fg">Status Pengajuan</p>
        <p className="text-[12px] font-semibold text-muted">{REIMBURSE_STAGE[stage].label}</p>
      </div>
      <ol className="mt-3 flex flex-col gap-2">
        {DANA_STEPS.map((s, i) => {
          const done = current > i
          const active = current === i
          return (
            <li key={s.key} className="flex items-center gap-2.5">
              <span
                className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[12px] font-bold ${
                  done ? 'bg-fg text-surface' : active ? 'bg-accent text-white' : 'border-[1.5px] border-border text-muted'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className={`text-[13px] ${active ? 'font-semibold text-fg' : 'text-muted'}`}>
                {s.label}
                {i === 0 && active ? (
                  <span className="block text-[11px] font-normal text-muted">
                    Sekretariat {REVIEW_STATE_LABEL[review.sekre]} · BRIM {REVIEW_STATE_LABEL[review.brim]}
                  </span>
                ) : null}
              </span>
              {done && stamps[i] ? <span className="ml-auto text-[11px] text-muted">{stamps[i]}</span> : null}
            </li>
          )
        })}
      </ol>
      {rejection ? (
        <div className="mt-3 bg-amber-light rounded-[10px] px-3 py-2.5">
          <p className="text-[11px] font-semibold text-amber-dark uppercase tracking-wide">Ditolak {rejection.oleh} — alasan</p>
          <p className="text-[13px] text-fg mt-1 whitespace-pre-wrap">{rejection.alasan || '-'}</p>
          <p className="text-[12px] text-muted mt-1.5">Perbaiki data lalu Ajukan lagi. Link lama otomatis tidak berlaku.</p>
        </div>
      ) : null}
    </div>
  )
}

/** Setelah Ajukan: Sekretariat & BRIM Nasional review dulu, link Korwil belum dibagikan. */
function MenungguReviewCard() {
  return (
    <div className="bg-surface border-2 border-dashed border-border rounded-card px-4 py-4">
      <p className="text-[14px] font-semibold text-fg">Menunggu review Sekretariat & BRIM Nasional</p>
      <p className="text-[12px] text-muted mt-1">
        Pengajuan dicek dulu oleh Sekretariat Nasional dan BRIM Nasional. Setelah keduanya setuju, tombol Kirim ke
        Korwil muncul di halaman ini. Kalau data diubah lalu disimpan, review mulai lagi dari awal.
      </p>
    </div>
  )
}

/** Setelah Sekretariat & BRIM setuju: ALK Kota kirim link approval ke WhatsApp ketua korwil (wa.me). */
function KirimKorwilCard({ share }: { share: NonNullable<DanaForm['share']> }) {
  return (
    <div className="bg-surface border-2 border-accent rounded-card px-4 py-4">
      <p className="text-[14px] font-semibold text-fg">Kirim ke Korwil</p>
      <p className="text-[13px] text-muted mt-1">
        {share.korwil.nama}
        {share.korwil.koordinator ? ` — ${share.korwil.koordinator}` : ''}
      </p>
      <p className="text-[12px] text-muted mt-2">
        Korwil membuka link tanpa login, lalu Setujui / Tolak. Setelah disetujui, PIC LevelUP Pusat dan Keuangan
        PPHTGD dapat notif WhatsApp otomatis.
      </p>
      {share.waUrl ? (
        <a
          href={share.waUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block w-full py-3.5 bg-[#1f9d55] text-white rounded-btn text-[15px] font-semibold text-center"
        >
          Kirim via WhatsApp
        </a>
      ) : (
        <p className="mt-3 bg-amber-light rounded-[10px] px-3 py-2.5 text-[13px] text-fg">
          Nomor WhatsApp korwil belum ada di PPHTGD. Salin pesan lalu kirim manual ke korwil.
        </p>
      )}
      <div className="mt-2.5 flex gap-2">
        <CopyText value={share.link} label="Salin link" />
        <CopyText value={share.waText} label="Salin pesan" />
      </div>
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

/** Semua kata harus ada di nama korwil / ketua / kota ("ngawi winsan" cocok dengan "Korwil Ngawi — Winsan Iksan"). */
function matchesKorwil(k: KorwilOption, words: string[]): boolean {
  const hay = `${k.nama} ${k.koordinator ?? ''} ${k.kota ?? ''}`.toLowerCase()
  return words.every((w) => hay.includes(w))
}

/** Pilih korwil lewat sheet dengan kotak cari (daftar korwil PPHTGD panjang, dropdown susah dipakai di HP). */
function KorwilPicker({
  options,
  value,
  onChange,
  disabled,
}: {
  options: KorwilOption[]
  value: number | null
  onChange: (id: number) => void
  disabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const selected = options.find((k) => k.id === value) ?? null
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const shown = words.length ? options.filter((k) => matchesKorwil(k, words)) : options

  function close() {
    setOpen(false)
    setQ('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={`${inputCls} flex items-center gap-2 text-left`}
      >
        <span className={`flex-1 min-w-0 truncate ${selected ? '' : 'text-muted'}`}>
          {selected ? `${selected.nama}${selected.koordinator ? ` — ${selected.koordinator}` : ''}` : 'Cari Korwil...'}
        </span>
        <SearchIcon className="w-[18px] h-[18px] shrink-0 text-muted" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Pilih Korwil PPHTGD">
          <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative w-full max-w-[480px] h-[85vh] sm:h-auto sm:max-h-[80vh] flex flex-col rounded-t-[20px] sm:rounded-[20px] bg-surface px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15px] font-semibold text-fg">Pilih Korwil PPHTGD</p>
              <button type="button" onClick={close} className="text-[13px] text-muted hover:text-fg px-1 py-1">
                Tutup
              </button>
            </div>
            <label className="mt-3 flex items-center gap-2 px-3.5 py-3 border-[1.5px] border-border rounded-input bg-surface focus-within:border-accent transition-colors">
              <SearchIcon className="w-5 h-5 shrink-0 text-muted" />
              {/* type="text" (bukan "search"): browser menambah tombol × sendiri, jadi muncul dua */}
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') close()
                  // Enter = pilih kalau hasilnya tinggal satu (jangan submit form)
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (shown.length === 1) {
                      onChange(shown[0].id)
                      close()
                    }
                  }
                }}
                placeholder="Nama korwil, kota, atau ketua"
                autoFocus
                className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-fg placeholder:text-muted"
              />
              {q ? (
                <button type="button" onClick={() => setQ('')} aria-label="Hapus pencarian" className="text-[18px] leading-none text-muted px-1">
                  ×
                </button>
              ) : null}
            </label>
            <p className="mt-2 text-[11px] text-muted">
              {words.length ? `${shown.length} dari ${options.length} korwil` : `${options.length} korwil`}
            </p>
            <div className="mt-2 flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 -mx-1 px-1 pb-1">
              {shown.length ? (
                shown.map((k) => {
                  const on = k.id === value
                  return (
                    <button
                      key={k.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        onChange(k.id)
                        close()
                      }}
                      className={`shrink-0 flex items-center gap-3 text-left px-3.5 py-3 rounded-input border-[1.5px] transition-colors ${
                        on ? 'border-accent bg-accent-light' : 'border-border bg-surface'
                      }`}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14px] font-semibold text-fg">{k.nama}</span>
                        {k.koordinator ? <span className="block text-[12px] text-muted">{k.koordinator}</span> : null}
                      </span>
                      {on ? <span className="text-[16px] font-bold text-accent shrink-0">✓</span> : null}
                    </button>
                  )
                })
              ) : (
                <p className="text-center text-[13px] text-muted py-8">Tidak ada korwil “{q.trim()}”</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-muted">{label}</label>
      {children}
    </div>
  )
}

export function DanaClient({
  idEvent,
  namaEvent,
  tglDisplay,
  jumlahPeserta,
  reimburse,
  form,
  backUrl: backUrlProp,
}: {
  idEvent: number
  namaEvent: string
  tglDisplay: string
  jumlahPeserta: number
  reimburse: ReimburseData | null
  /** Status alur + pilihan korwil PPHTGD (getDanaForm) */
  form: DanaForm | null
  backUrl?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [ajukan, setAjukan] = useState<'Ajukan' | 'Tidak Ajukan'>(
    reimburse?.ajukan === 'Tidak Ajukan' ? 'Tidak Ajukan' : 'Ajukan',
  )
  const [bukti, setBukti] = useState(reimburse?.bukti ?? '')
  const [laporan, setLaporan] = useState(reimburse?.laporan ?? '')
  const [danausul, setDanausul] = useState(danaDigits(reimburse?.danausul ?? ''))
  const [danariil, setDanariil] = useState(danaDigits(reimburse?.danariil ?? ''))
  // Rekening tersimpan LevelUP Kota: isi otomatis yang terakhir dipakai kalau pengajuan ini belum punya rekening
  const savedRekening = form?.rekening ?? []
  const ownRekening = !!(reimburse && (reimburse.norek || reimburse.namabank || reimburse.namarek))
  const prefill = ownRekening ? reimburse : (savedRekening[0] ?? null)
  const [norek, setNorek] = useState(prefill?.norek ?? '')
  const [namabank, setNamabank] = useState(prefill?.namabank ?? '')
  const [namarek, setNamarek] = useState(prefill?.namarek ?? '')
  const [korwilId, setKorwilId] = useState<number | null>(form?.korwil.defaultId ?? null)

  const stage = reimburseStage(reimburse)
  // Terkunci begitu Korwil ACC (sampai ada yang menolak)
  const isApproved = isReimburseLocked(stage)
  const backUrl = backUrlProp ?? `/demo-preview/dashboard/kota/alk/event/${idEvent}`
  const korwilOptions = form?.korwil.options ?? []
  const pickedKorwil = korwilOptions.find((k) => k.id === korwilId) ?? null
  const korwilBlocked = ajukan === 'Ajukan' && (!!form?.korwil.error || !pickedKorwil)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      try {
        await submitReimburse(idEvent, {
          ajukan,
          bukti,
          laporan,
          danausul,
          danariil,
          norek,
          namabank,
          namarek,
          korwilId: ajukan === 'Ajukan' ? korwilId : null,
        })
        if (ajukan === 'Ajukan') {
          // Tetap di halaman ini: kartu "Kirim ke Korwil" muncul setelah tersimpan
          router.refresh()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          router.push(backUrl)
          router.refresh()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal menyimpan. Coba lagi.')
      }
    })
  }

  return (
    <main className="min-h-screen bg-bg pb-10">
      <nav className="sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-[480px] mx-auto px-5 pt-6 pb-4 flex items-center gap-3">
          <Link href={backUrl} className="text-sm text-muted hover:text-fg transition-colors shrink-0">
            ← Kembali
          </Link>
          <p className="text-[14px] font-semibold text-fg flex-1 text-center pr-14">
            Pengajuan Support Dana
          </p>
        </div>
      </nav>

      <form onSubmit={handleSubmit} className="max-w-[480px] mx-auto px-4 pt-5 flex flex-col gap-4">
        <div className="bg-surface border border-border rounded-card px-4 py-3">
          <p className="text-[14px] font-semibold text-fg">{namaEvent}</p>
          <p className="text-[12px] text-muted mt-0.5">{tglDisplay}</p>
        </div>

        {reimburse && isAjukan(reimburse.ajukan) ? <DanaTracker reimburse={reimburse} form={form} /> : null}

        {stage === 'review' ? <MenungguReviewCard /> : null}

        {form?.share ? <KirimKorwilCard share={form.share} /> : null}

        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[13px] font-semibold text-fg">Form Pengajuan Dana</p>
          </div>
          <div className="px-4 py-4 flex flex-col gap-4">
            <FormField label="Ajukan Support Dana">
              <select
                value={ajukan}
                onChange={(e) => setAjukan(e.target.value as 'Ajukan' | 'Tidak Ajukan')}
                disabled={isApproved}
                className={`${inputCls} appearance-none`}
              >
                <option value="Ajukan">Ajukan</option>
                <option value="Tidak Ajukan">Tidak Ajukan</option>
              </select>
            </FormField>

            {ajukan === 'Ajukan' ? (
              <FormField label="Korwil PPHTGD">
                {isApproved ? (
                  // Sudah disetujui Korwil: tampilkan korwil yang dipilih saat submit, tanpa picker / data pphtgd
                  <p className="text-[15px] text-fg px-0.5 py-1">
                    {form?.view?.korwil
                      ? `${form.view.korwil.nama}${form.view.korwil.koordinator ? ` — ${form.view.korwil.koordinator}` : ''}`
                      : '-'}
                  </p>
                ) : form?.korwil.error ? (
                  <p className="text-[13px] text-red font-medium">
                    Data korwil PPHTGD tidak bisa dimuat ({form.korwil.error}). Coba muat ulang halaman.
                  </p>
                ) : (
                  <>
                    <KorwilPicker options={korwilOptions} value={korwilId} onChange={setKorwilId} disabled={isApproved} />
                    {pickedKorwil && !pickedKorwil.wa ? (
                      <p className="text-[12px] text-muted">Nomor WhatsApp korwil ini belum ada di PPHTGD; link dikirim manual.</p>
                    ) : null}
                  </>
                )}
              </FormField>
            ) : null}

            <FormField label="Link Dokumentasi">
              <input
                type="text"
                value={bukti}
                onChange={(e) => setBukti(e.target.value)}
                disabled={isApproved}
                placeholder="https://drive.google.com/..."
                className={inputCls}
              />
            </FormField>

            <FormField label="Upload Laporan">
              <input
                type="text"
                value={laporan}
                onChange={(e) => setLaporan(e.target.value)}
                disabled={isApproved}
                placeholder="https://drive.google.com/..."
                className={inputCls}
              />
            </FormField>

            <FormField label="Jumlah Peserta">
              <p className="text-[15px] text-fg px-0.5 py-1">{jumlahPeserta}</p>
            </FormField>

            <FormField label="Pengajuan Dana">
              <RupiahInput value={danausul} onChange={setDanausul} disabled={isApproved} />
            </FormField>

            <FormField label="Penggunaan Dana Riil">
              <RupiahInput value={danariil} onChange={setDanariil} disabled={isApproved} />
            </FormField>

            {!isApproved && savedRekening.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-[12px] font-medium text-muted">Rekening tersimpan</p>
                {savedRekening.map((r) => {
                  const picked = r.norek === norek && r.namabank === namabank && r.namarek === namarek
                  return (
                    <button
                      key={r.norek}
                      type="button"
                      aria-pressed={picked}
                      onClick={() => {
                        setNorek(r.norek)
                        setNamabank(r.namabank)
                        setNamarek(r.namarek)
                      }}
                      className={`text-left px-3.5 py-2.5 rounded-input border-[1.5px] transition-colors ${
                        picked ? 'border-accent bg-accent-light' : 'border-border bg-surface'
                      }`}
                    >
                      <span className="block text-[14px] font-semibold text-fg break-all">
                        {r.namabank ? `${r.namabank} · ` : ''}
                        {r.norek}
                      </span>
                      <span className="block text-[12px] text-muted">a.n. {r.namarek || '-'}</span>
                    </button>
                  )
                })}
                <p className="text-[11px] text-muted">Tap untuk mengisi. Rekening baru otomatis tersimpan saat form disimpan.</p>
              </div>
            ) : null}

            <FormField label="No Rekening">
              <input
                type="text"
                value={norek}
                onChange={(e) => setNorek(e.target.value)}
                disabled={isApproved}
                className={inputCls}
              />
            </FormField>

            <FormField label="Nama Bank">
              <input
                type="text"
                value={namabank}
                onChange={(e) => setNamabank(e.target.value)}
                disabled={isApproved}
                className={inputCls}
              />
            </FormField>

            <FormField label="Atas Nama">
              <input
                type="text"
                value={namarek}
                onChange={(e) => setNamarek(e.target.value)}
                disabled={isApproved}
                className={inputCls}
              />
            </FormField>
          </div>
        </div>

        {error ? <p className="text-[13px] text-red font-medium">{error}</p> : null}

        {!isApproved && (
          <button
            type="submit"
            disabled={isPending || korwilBlocked}
            className="w-full py-4 bg-accent text-white rounded-btn text-[16px] font-semibold disabled:opacity-60 transition-opacity"
          >
            {isPending
              ? 'Menyimpan...'
              : stage === 'review' || stage === 'korwil' || stage === 'ditolak'
                ? 'Simpan & Ajukan Ulang'
                : 'Ajukan'}
          </button>
        )}
      </form>
    </main>
  )
}
