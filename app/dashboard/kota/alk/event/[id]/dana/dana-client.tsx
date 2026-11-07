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
  reimburseStage,
} from '@/lib/reimburse-stage'
import { submitReimburse, type DanaForm, type ReimburseData } from '@/lib/actions/reimburse'

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

/** Korwil PPHTGD → PIC LevelUP Pusat → Keuangan PPHTGD → Cair */
function DanaTracker({ reimburse, form }: { reimburse: ReimburseData; form: DanaForm | null }) {
  const stage = reimburseStage(reimburse)
  const current = danaStepIndex(stage)
  const rejection = reimburseRejection(reimburse)
  const at = form?.view?.at
  const stamps = [at?.korwil, at?.pic, at?.cair, null]
  return (
    <div className="bg-surface border border-border rounded-card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-fg">Status Pengajuan</p>
        <p className="text-[12px] font-semibold text-muted">{REIMBURSE_STAGE[stage].label}</p>
      </div>
      <ol className="mt-3 flex flex-col gap-2">
        {DANA_STEPS.map((s, i) => {
          const done = current > i || (current === 4 && i === 3)
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
              <span className={`text-[13px] ${active ? 'font-semibold text-fg' : 'text-muted'}`}>{s.label}</span>
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

/** Setelah Ajukan: ALK Kota kirim link approval ke WhatsApp ketua korwil (wa.me). */
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
  suratHref,
}: {
  idEvent: number
  namaEvent: string
  tglDisplay: string
  jumlahPeserta: number
  reimburse: ReimburseData | null
  /** Status alur + pilihan korwil PPHTGD (getDanaForm) */
  form: DanaForm | null
  backUrl?: string
  /** Link cetak surat untuk Keuangan; tampil setelah disetujui PIC LevelUP Pusat */
  suratHref?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [ajukan, setAjukan] = useState<'Ajukan' | 'Tidak Ajukan'>(
    reimburse?.ajukan === 'Tidak Ajukan' ? 'Tidak Ajukan' : 'Ajukan',
  )
  const [bukti, setBukti] = useState(reimburse?.bukti ?? '')
  const [laporan, setLaporan] = useState(reimburse?.laporan ?? '')
  const [danausul, setDanausul] = useState(reimburse?.danausul ?? '')
  const [danariil, setDanariil] = useState(reimburse?.danariil ?? '')
  const [norek, setNorek] = useState(reimburse?.norek ?? '')
  const [namabank, setNamabank] = useState(reimburse?.namabank ?? '')
  const [namarek, setNamarek] = useState(reimburse?.namarek ?? '')
  const [korwilId, setKorwilId] = useState<number | null>(form?.korwil.defaultId ?? null)

  const stage = reimburseStage(reimburse)
  // Terkunci begitu Korwil ACC (sampai ada yang menolak)
  const isApproved = isReimburseLocked(stage)
  const backUrl = backUrlProp ?? `/dashboard/kota/alk/event/${idEvent}`
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

        {form?.share ? <KirimKorwilCard share={form.share} /> : null}

        {(stage === 'keuangan' || stage === 'cair') && suratHref ? (
          <div className="bg-green-light rounded-[14px] px-4 py-3 text-center">
            <p className="text-[14px] font-semibold text-green-dark">
              Disetujui PIC LevelUP Pusat{stage === 'cair' ? ' · Dana sudah cair' : ''}
            </p>
            <a
              href={suratHref}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-[13px] font-semibold text-green-dark underline"
            >
              Cetak Surat untuk Keuangan
            </a>
          </div>
        ) : null}

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
                {form?.korwil.error ? (
                  <p className="text-[13px] text-red font-medium">
                    Data korwil PPHTGD tidak bisa dimuat ({form.korwil.error}). Coba muat ulang halaman.
                  </p>
                ) : (
                  <>
                    <select
                      value={korwilId ?? ''}
                      onChange={(e) => setKorwilId(e.target.value ? Number(e.target.value) : null)}
                      disabled={isApproved}
                      className={`${inputCls} appearance-none`}
                    >
                      <option value="">Pilih Korwil</option>
                      {korwilOptions.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama}
                          {k.koordinator ? ` — ${k.koordinator}` : ''}
                        </option>
                      ))}
                    </select>
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
              <input
                type="number"
                min={0}
                value={danausul}
                onChange={(e) => setDanausul(e.target.value)}
                disabled={isApproved}
                placeholder="0"
                className={inputCls}
              />
            </FormField>

            <FormField label="Penggunaan Dana Riil">
              <input
                type="number"
                min={0}
                value={danariil}
                onChange={(e) => setDanariil(e.target.value)}
                disabled={isApproved}
                placeholder="0"
                className={inputCls}
              />
            </FormField>

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
            {isPending ? 'Menyimpan...' : stage === 'korwil' || stage === 'ditolak' ? 'Simpan & Ajukan Ulang' : 'Ajukan'}
          </button>
        )}
      </form>
    </main>
  )
}
