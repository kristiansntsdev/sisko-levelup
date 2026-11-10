'use client'
// No-login page behind /dana/{token}: Korwil PPHTGD, PIC LevelUP Pusat or Keuangan PPHTGD, depending on the token.
// Many korwil are older, so text and buttons are large and each decision asks once more before it is sent.
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { decideDanaKorwil, decideDanaPic, markDanaCair } from '@/lib/actions/dana-link'
import type { DanaView } from '@/lib/dana-approval'
import type { DanaPeran } from '@/lib/dana-link'
import { DANA_DONE, DANA_STEPS, danaStepIndex, REIMBURSE_STAGE } from '@/lib/reimburse-stage'
import { shrinkPhotoForUpload } from '@/lib/shrink-photo'
import { SuratKeuanganDocument } from '@/components/documents/surat-keuangan'
import {
  ANTON,
  BTN,
  BTN_SHELL,
  ERROR,
  LABEL,
  LogoChip,
  MONO,
  PANEL,
  PAPER_INPUT,
  PaperMain,
  PRESS,
  ROWS,
  StickerLabel,
  Strip,
  TAPE,
} from '@/components/pwa/paper-ui'
import { Icon } from '@/components/pwa/ui'

const PERAN: Record<DanaPeran, { sticker: string; title: string; step: number }> = {
  korwil: { sticker: 'Korwil PPHTGD', title: 'Persetujuan Dana', step: 1 },
  pic: { sticker: 'PIC LevelUP Pusat', title: 'Review Dana', step: 2 },
  keuangan: { sticker: 'Keuangan PPHTGD', title: 'Transfer Dana', step: 3 },
}

const rupiah = (n: number) => (n > 0 ? `Rp ${n.toLocaleString('id-ID')}` : '-')

function Row({ label, children, big = false }: { label: string; children: ReactNode; big?: boolean }) {
  return (
    <div className="py-3">
      <p className={`${LABEL} text-[11px] font-bold text-[#57534e]`}>{label}</p>
      <div className={big ? `${ANTON} mt-1 text-[34px] leading-none` : 'mt-1 text-[18px] font-semibold leading-snug break-words'}>
        {children}
      </div>
    </div>
  )
}

function CopyButton({ value, label }: { value: string; label: string }) {
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
      className={`${MONO} ml-2 inline-flex items-center gap-1 rounded-[4px] bg-[#161616] px-2 py-1 align-middle text-[11px] font-bold text-[#ffd83d] ${PRESS}`}
    >
      <Icon name={done ? 'check' : 'link'} className="w-3.5 h-3.5" sw={2.2} />
      {done ? 'Tersalin' : label}
    </button>
  )
}

function Tracker({ view }: { view: DanaView }) {
  const current = danaStepIndex(view.stage)
  const stamps = [null, view.at.korwil, view.at.pic, view.at.cair, null]
  return (
    <ol className="grid grid-cols-5 gap-1">
      {DANA_STEPS.map((s, i) => {
        const done = current > i
        const active = current === i
        return (
          <li key={s.key} className="text-center">
            <span
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-bold ${
                done ? 'bg-[#161616] text-[#ffd83d]' : active ? 'bg-[#ffd83d] text-[#161616] ring-2 ring-[#161616]' : 'ring-2 ring-[#161616]/25 text-[#57534e]'
              }`}
            >
              {done ? <Icon name="check" className="w-4 h-4" sw={2.6} /> : i + 1}
            </span>
            <p className={`${MONO} mt-1.5 text-[10px] font-bold leading-tight break-words ${active ? 'text-[#161616]' : 'text-[#57534e]'}`}>
              {/* 5 kolom di HP: label pendek supaya "Sekretariat" tidak keluar kolom */}
              {s.key === 'review' ? 'Review Nasional' : s.label}
            </p>
            {done && stamps[i] ? <p className={`${MONO} mt-0.5 text-[9px] text-[#57534e]`}>{stamps[i]}</p> : null}
          </li>
        )
      })}
    </ol>
  )
}

/** A4 letter scaled to the column width, so PIC and Keuangan see exactly what prints. */
function SuratPreview({ view }: { view: DanaView }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.45)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const A4_PX = (210 / 25.4) * 96
    const update = () => setScale(el.clientWidth / A4_PX)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className="relative w-full overflow-hidden rounded-[6px] ring-1 ring-[#161616]/15" style={{ height: ((297 / 25.4) * 96) * scale }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
        <SuratKeuanganDocument data={view.surat} korwil={view.korwil} approvals={view.approvals} verifikasiUrl={view.verifikasiUrl} />
      </div>
    </div>
  )
}

function Decision({
  approveLabel,
  confirmText,
  onDecide,
}: {
  approveLabel: string
  confirmText: string
  onDecide: (keputusan: 'setuju' | 'tolak', alasan?: string) => Promise<string | null>
}) {
  const [mode, setMode] = useState<'idle' | 'setuju' | 'tolak'>('idle')
  const [alasan, setAlasan] = useState('')
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  const send = (keputusan: 'setuju' | 'tolak') =>
    start(async () => {
      setError('')
      const err = await onDecide(keputusan, alasan)
      if (err) setError(err)
    })

  return (
    <div className="space-y-3">
      {mode === 'idle' && (
        <>
          <button type="button" onClick={() => setMode('setuju')} className={BTN}>
            <Strip tone="ink" className="py-4 text-[22px]">
              <Icon name="check" className="w-6 h-6" sw={2.6} /> {approveLabel}
            </Strip>
          </button>
          <button
            type="button"
            onClick={() => setMode('tolak')}
            className={`${ANTON} w-full py-3.5 rounded-sm ring-2 ring-inset ring-[#c21f24] text-[#c21f24] text-[19px] tracking-[.03em] ${PRESS}`}
          >
            Tolak
          </button>
        </>
      )}

      {mode === 'setuju' && (
        <div className="rounded-[12px] bg-[#ffd83d]/40 p-4 ring-2 ring-[#161616]">
          <p className="text-[18px] font-bold leading-snug">{confirmText}</p>
          <div className="mt-4 flex gap-2.5">
            <button type="button" disabled={pending} onClick={() => send('setuju')} className={`flex-1 ${BTN_SHELL}`}>
              <Strip tone="ink" className="py-3.5 text-[19px]">{pending ? 'Mengirim…' : 'Ya, setujui'}</Strip>
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setMode('idle')}
              className={`${ANTON} flex-1 py-3.5 rounded-sm ring-2 ring-inset ring-[#161616] text-[17px] ${PRESS}`}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {mode === 'tolak' && (
        <div className="rounded-[12px] p-4 ring-2 ring-[#c21f24]">
          <label className="block">
            <span className="text-[17px] font-bold">Alasan penolakan</span>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Tulis alasan supaya pengaju bisa memperbaiki"
              className={`${PAPER_INPUT} mt-2 text-[17px]`}
            />
          </label>
          <div className="mt-3 flex gap-2.5">
            <button
              type="button"
              disabled={pending || !alasan.trim()}
              onClick={() => send('tolak')}
              className={`${ANTON} flex-1 py-3.5 rounded-sm bg-[#c21f24] text-white text-[17px] disabled:opacity-40 ${PRESS}`}
            >
              {pending ? 'Mengirim…' : 'Kirim penolakan'}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setMode('idle')}
              className={`${ANTON} flex-1 py-3.5 rounded-sm ring-2 ring-inset ring-[#161616] text-[17px] ${PRESS}`}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {error ? <p className={`${ERROR} text-[14px]`}>{error}</p> : null}
    </div>
  )
}

function TransferForm({ token, dana }: { token: string; dana: number }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  const submit = () =>
    start(async () => {
      setError('')
      const fd = new FormData()
      if (file) {
        if (file.type === 'application/pdf') {
          fd.set('bukti', file)
        } else {
          try {
            const blob = await shrinkPhotoForUpload(file)
            fd.set('bukti', new File([blob], 'bukti.jpg', { type: 'image/jpeg' }))
          } catch {
            setError('Foto tidak bisa dibaca. Coba foto lain atau PDF.')
            return
          }
        }
      }
      const res = await markDanaCair(token, fd)
      if (!res.ok) setError(res.error)
      else router.refresh()
    })

  return (
    <div className="space-y-3">
      <label className={`flex cursor-pointer items-center gap-3 rounded-[12px] border-2 border-dashed border-[#161616]/40 p-4 ${PRESS}`}>
        <Icon name="image" className="w-7 h-7 shrink-0" />
        <span className="min-w-0">
          <span className="block text-[16px] font-bold">{file ? file.name : 'Upload bukti transfer (opsional)'}</span>
          <span className={`${MONO} block text-[11px] text-[#57534e]`}>Foto atau PDF, maks 4 MB</span>
        </span>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {!confirm ? (
        <button type="button" onClick={() => setConfirm(true)} className={BTN}>
          <Strip tone="ink" className="py-4 text-[21px]">
            <Icon name="check" className="w-6 h-6" sw={2.6} /> Sudah ditransfer
          </Strip>
        </button>
      ) : (
        <div className="rounded-[12px] bg-[#ffd83d]/40 p-4 ring-2 ring-[#161616]">
          <p className="text-[18px] font-bold leading-snug">Dana {rupiah(dana)} sudah ditransfer ke rekening di atas?</p>
          <div className="mt-4 flex gap-2.5">
            <button type="button" disabled={pending} onClick={submit} className={`flex-1 ${BTN_SHELL}`}>
              <Strip tone="ink" className="py-3.5 text-[19px]">{pending ? 'Menyimpan…' : 'Ya, sudah'}</Strip>
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirm(false)}
              className={`${ANTON} flex-1 py-3.5 rounded-sm ring-2 ring-inset ring-[#161616] text-[17px] ${PRESS}`}
            >
              Batal
            </button>
          </div>
        </div>
      )}
      {error ? <p className={`${ERROR} text-[14px]`}>{error}</p> : null}
    </div>
  )
}

/** What this role sees when its step is not (or no longer) open. */
function StatusNote({ peran, view }: { peran: DanaPeran; view: DanaView }) {
  const myStep = PERAN[peran].step
  const current = danaStepIndex(view.stage)
  let text: string
  if (view.rejection) {
    text = `Pengajuan ditolak ${view.rejection.oleh}. Alasan: ${view.rejection.alasan || '-'}`
  } else if (current === DANA_DONE) {
    text = `Dana sudah ditransfer${view.at.cair ? ` · ${view.at.cair}` : ''}. Terima kasih.`
  } else if (current > myStep) {
    text = `Sudah disetujui. Sekarang di ${REIMBURSE_STAGE[view.stage].pic}.`
  } else {
    text = `Belum bisa diproses: masih menunggu ${REIMBURSE_STAGE[view.stage].pic}.`
  }
  return (
    <div className={`${PANEL} flex gap-3 p-4`}>
      <Icon name={view.rejection ? 'alert' : current > myStep ? 'check' : 'clock'} className="w-7 h-7 shrink-0" sw={2.2} />
      <p className="text-[17px] font-semibold leading-snug">{text}</p>
    </div>
  )
}

export function DanaApproval({ token, peran, view }: { token: string; peran: DanaPeran; view: DanaView }) {
  const router = useRouter()
  const [notifGagal, setNotifGagal] = useState(false)
  const meta = PERAN[peran]
  const actionable =
    (peran === 'korwil' && view.stage === 'korwil') ||
    (peran === 'pic' && view.stage === 'pusat') ||
    (peran === 'keuangan' && view.stage === 'keuangan')

  const decide = async (keputusan: 'setuju' | 'tolak', alasan?: string) => {
    const res = peran === 'korwil' ? await decideDanaKorwil(token, keputusan, alasan) : await decideDanaPic(token, keputusan, alasan)
    if (!res.ok) return res.error
    setNotifGagal(Boolean(res.notifGagal))
    router.refresh()
    return null
  }

  const r = view.reimburse
  const showSurat = peran !== 'korwil'

  return (
    <>
      <style>{'@media print{@page{size:A4;margin:0}}'}</style>
      <div className="print:hidden">
        <PaperMain standalone>
          <header className="px-5 pt-5 flex items-center justify-between gap-3">
            <LogoChip />
            <StickerLabel>{meta.sticker}</StickerLabel>
          </header>

          <div className="px-5 pt-5 pb-10 space-y-5">
            <div>
              <h1 className={`${ANTON} text-[38px] leading-[1.05]`}>{meta.title}</h1>
              <p className="mt-1 text-[16px] text-[#44403c]">
                {view.kota} mengajukan support dana untuk event di bawah.
              </p>
            </div>

            <div className={`${PANEL} relative px-4 py-4`}>
              <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
              <Tracker view={view} />
            </div>

            <section aria-label="Ringkasan" className={`${PANEL} px-4 py-2`}>
              <div className={ROWS}>
                <Row label="Dana diajukan" big>{rupiah(view.dana)}</Row>
                <Row label="Acara">{view.namaEvent}</Row>
                <Row label="Tanggal">{view.tanggal}</Row>
                <Row label="Tempat">{view.tempat}</Row>
                <Row label="LevelUP Kota">
                  {view.kota}
                  {view.surat.namaKoordinator !== '-' ? <span className="block text-[15px] font-normal text-[#44403c]">Koordinator: {view.surat.namaKoordinator}</span> : null}
                </Row>
                <Row label="Peserta hadir">{view.hadir} orang</Row>
                <Row label="Dikirim ke rekening">
                  <span className="block">{r.namabank || '-'}</span>
                  <span className={`${MONO} block text-[20px] tracking-wide`}>
                    {r.norek || '-'}
                    {peran === 'keuangan' && r.norek ? <CopyButton value={r.norek.replace(/\s/g, '')} label="Salin" /> : null}
                  </span>
                  <span className="block">a.n. {r.namarek || '-'}</span>
                </Row>
                {peran !== 'korwil' && view.korwil ? (
                  <Row label="Korwil PPHTGD">
                    {view.korwil.nama}
                    {view.korwil.koordinator ? ` — ${view.korwil.koordinator}` : ''}
                    {view.at.korwil && view.approvals.korwil ? <span className="block text-[14px] font-normal text-[#44403c]">Disetujui {view.at.korwil}</span> : null}
                  </Row>
                ) : null}
                {peran !== 'korwil' && (r.bukti || r.laporan) ? (
                  <Row label="Dokumen">
                    {r.bukti ? <a href={r.bukti} target="_blank" rel="noreferrer" className="block underline">Link dokumentasi</a> : null}
                    {r.laporan ? <a href={r.laporan} target="_blank" rel="noreferrer" className="block underline">Laporan (LPJ)</a> : null}
                  </Row>
                ) : null}
                {view.stage === 'cair' && r.buktitf ? (
                  <Row label="Bukti transfer">
                    <a href={r.buktitf} target="_blank" rel="noreferrer" className="underline">Lihat bukti transfer</a>
                  </Row>
                ) : null}
              </div>
            </section>

            {showSurat ? (
              <section aria-label="Surat" className="space-y-2.5">
                <div className="flex items-end justify-between gap-3">
                  <h2 className={`${ANTON} text-[24px] leading-none`}>Surat Pengajuan</h2>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className={`${MONO} inline-flex items-center gap-1.5 rounded-[4px] ring-2 ring-[#161616] px-2.5 py-1.5 text-[12px] font-bold ${PRESS}`}
                  >
                    <Icon name="receipt" className="w-4 h-4" sw={2} /> Cetak / PDF
                  </button>
                </div>
                <SuratPreview view={view} />
              </section>
            ) : null}

            {notifGagal ? (
              <p className={`${MONO} rounded-[10px] bg-[#ffd83d]/50 p-3 text-[13px] font-bold`}>
                Keputusan tersimpan. Notif WhatsApp ke grup belum terkirim; tim LevelUP akan mengirim ulang.
              </p>
            ) : null}

            {actionable ? (
              peran === 'keuangan' ? (
                <TransferForm token={token} dana={view.dana} />
              ) : (
                <Decision
                  approveLabel="Setujui"
                  confirmText={`Setujui pengajuan dana ${rupiah(view.dana)} untuk ${view.namaEvent}?`}
                  onDecide={decide}
                />
              )
            ) : (
              <StatusNote peran={peran} view={view} />
            )}

            <p className={`${MONO} text-center text-[11px] text-[#57534e]`}>
              Link ini khusus untuk {meta.sticker}. Jangan diteruskan ke orang lain.
            </p>
          </div>
        </PaperMain>
      </div>
      {showSurat ? (
        <div className="hidden print:block">
          <SuratKeuanganDocument data={view.surat} korwil={view.korwil} approvals={view.approvals} verifikasiUrl={view.verifikasiUrl} />
        </div>
      ) : null}
    </>
  )
}

export function DanaLinkDead() {
  return (
    <PaperMain standalone>
      <header className="px-5 pt-5">
        <LogoChip />
      </header>
      <div className="px-5 pt-8 space-y-4">
        <h1 className={`${ANTON} text-[34px] leading-[1.05]`}>Link tidak berlaku</h1>
        <p className="text-[17px] leading-snug text-[#44403c]">
          Pengajuan ini sudah diubah atau link-nya salah. Minta link terbaru ke pengaju LevelUP Kota.
        </p>
      </div>
    </PaperMain>
  )
}
