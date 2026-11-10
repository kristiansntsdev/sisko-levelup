'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import {
  decideDanaBrim,
  decideDanaSekretariat,
  resendDanaNotif,
  type ReimburseListItem,
  type ReimburseReview,
} from '@/lib/actions/reimburse'
import { DANA_STEPS, danaStepIndex, REIMBURSE_STAGE, REVIEW_STATE_LABEL, type ReimburseStage } from '@/lib/reimburse-stage'
import { ANTON, BTN, ERROR, IconButton, LABEL, MONO, PANEL, PaperHeader, PaperMain, PRESS, ROWS, Strip } from '@/components/pwa/paper-ui'
import { Pill } from '@/components/pwa/ui'
import { BRIM_BASE, BRIM_DANA_BASE } from '@/components/brim-v2/paths'
import { PAGE_SIZE_EVENT, Pager, SearchBox } from './list-tools'
import { ALK_BASE, ALK_EVENT_BASE, Decide, Empty, Field, FLD, Note, PersonChip, Toast } from './ui'

function fmtRp(s: string) {
  const n = parseInt(String(s).replace(/\D/g, ''), 10)
  return isNaN(n) || n === 0 ? '-' : `Rp ${n.toLocaleString('id-ID')}`
}

type Filter = ReimburseStage | 'all' | 'menunggu' | 'perlu'

// Perlu Review = menunggu keputusan yang membuka daftar (Sekretariat / BRIM Nasional).
// Menunggu = masih di review Nasional, Korwil PPHTGD atau PIC LevelUP Pusat.
const FILTERS_NASIONAL: [Filter, string][] = [
  ['perlu', 'Perlu Review'],
  ['menunggu', 'Menunggu'],
  ['keuangan', 'Siap ditransfer'],
  ['cair', 'Cair'],
  ['ditolak', 'Ditolak'],
  ['all', 'Semua'],
]
const FILTERS_KOTA: [Filter, string][] = [
  ['all', 'Semua'],
  ['belum', 'Belum diajukan'],
  ['menunggu', 'Menunggu'],
  ['keuangan', 'Siap ditransfer'],
  ['cair', 'Cair'],
  ['ditolak', 'Ditolak'],
]

function matchFilter(filter: Filter, item: ReimburseListItem) {
  if (filter === 'all') return true
  if (filter === 'perlu') return item.perluReview
  if (filter === 'menunggu') return item.stage === 'review' || item.stage === 'korwil' || item.stage === 'pusat'
  return item.stage === filter
}

export function ReimburseListV2Client({
  isNasional,
  items,
  brim = false,
}: {
  isNasional: boolean
  items: ReimburseListItem[]
  /** Daftar yang sama di dashboard BRIM Nasional */
  brim?: boolean
}) {
  const router = useRouter()
  const filters = isNasional || brim ? FILTERS_NASIONAL : FILTERS_KOTA
  const [filter, setFilter] = useState<Filter>(filters[0][0])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return items.filter((i) => {
      if (!matchFilter(filter, i)) return false
      return !needle || `${i.nama_event} ${i.namaCabang} ${i.tglDisplay}`.toLowerCase().includes(needle)
    })
  }, [items, filter, q])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE_EVENT))
  const shown = rows.slice(page * PAGE_SIZE_EVENT, (page + 1) * PAGE_SIZE_EVENT)

  return (
    <PaperMain>
      <PaperHeader
        sticker={brim ? 'BRIM Nasional' : isNasional ? 'Sekretariat Nasional' : 'Sekretariat'}
        title={brim ? 'Pengajuan Dana' : 'Reimburse'}
        leading={<IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push(brim ? BRIM_BASE : ALK_BASE)} className="-rotate-3" />}
      />
      <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {filters.map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setFilter(v)
              setPage(0)
            }}
            className={`${LABEL} shrink-0 rounded-full px-3.5 py-2 text-[10.5px] font-bold ${filter === v ? 'bg-[#161616] text-[#ffd83d]' : 'bg-[#fffdf7] text-[#161616]'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="px-5 mt-4 space-y-3 pb-4">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(0) }} placeholder="Cari event / kota..." />
        {shown.length === 0 ? (
          <Empty>Tidak ada pengajuan di filter ini.</Empty>
        ) : (
          <div className={`${PANEL} ${ROWS} overflow-hidden`}>
            {shown.map((i) => {
              const st = REIMBURSE_STAGE[i.stage]
              return (
                <Link
                  key={i.id_event}
                  href={
                    brim
                      ? `${BRIM_DANA_BASE}/${i.id_event}`
                      : isNasional
                        ? `${ALK_BASE}/reimburse/${i.id_event}`
                        : `${ALK_EVENT_BASE}/${i.id_event}/dana`
                  }
                  className={`flex items-center gap-3 p-3.5 ${PRESS}`}
                >
                  <PersonChip />
                  <span className="min-w-0 flex-1">
                    <span className={`${ANTON} block truncate text-[16px] leading-tight tracking-[.02em]`}>{i.nama_event}</span>
                    <span className={`${MONO} mt-0.5 block text-[10.5px] font-bold text-[#44403c]`}>
                      {i.namaCabang} · {i.tglDisplay}
                    </span>
                    <span className={`${MONO} block text-[10.5px] text-[#44403c]`}>
                      PIC: {i.pic}
                      {i.danausul ? ` · ${fmtRp(i.danausul)}` : ''}
                    </span>
                  </span>
                  <Pill tone={i.perluReview ? 'red' : st.tone}>{i.perluReview ? 'Perlu Review' : st.label}</Pill>
                </Link>
              )
            })}
          </div>
        )}
        <Pager page={page} totalPages={pages} onChange={setPage} />
      </div>
    </PaperMain>
  )
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>{label}</p>
      <div className={`${MONO} mt-0.5 text-[13px] font-bold break-words`}>{children}</div>
    </div>
  )
}

function ExtLink({ href }: { href: string }) {
  if (!href.trim()) return <>-</>
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline decoration-[#e02a2f] underline-offset-4">
      {href}
    </a>
  )
}

function CopyLine({ label, value }: { label: string; value: string }) {
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
      className={`${MONO} w-full rounded-[10px] px-3 py-2.5 text-left text-[12px] font-bold ring-2 ring-[#161616] ${PRESS}`}
    >
      {done ? 'Tersalin ✓' : label}
    </button>
  )
}

/** Approve / Tolak langkah review Nasional (Sekretariat atau BRIM, sesuai review.role). */
function ReviewDecision({ review, onDone }: { review: ReimburseReview; onDone: (msg: string) => void }) {
  const [alasan, setAlasan] = useState('')
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const [action, setAction] = useState<'setuju' | 'tolak' | null>(null)
  const label = review.role === 'sekre' ? 'Sekretariat Nasional' : 'BRIM Nasional'

  function decide(keputusan: 'setuju' | 'tolak') {
    setError('')
    if (keputusan === 'tolak' && !alasan.trim()) return setError('Alasan tolak wajib diisi')
    setAction(keputusan)
    start(async () => {
      const fn = review.role === 'sekre' ? decideDanaSekretariat : decideDanaBrim
      const res = await fn(review.view.idEvent, review.versi, keputusan, alasan)
      setAction(null)
      if (!res.ok) return setError(res.error)
      setAlasan('')
      onDone(keputusan === 'setuju' ? `Disetujui ${label}` : 'Pengajuan dikembalikan ke ALK Kota')
    })
  }

  return (
    <div className={`p-4 space-y-4 ${PANEL}`}>
      <div>
        <p className={`${ANTON} text-[18px] leading-tight tracking-[.02em]`}>Review {label}</p>
        <p className={`${MONO} mt-1 text-[11px] text-[#44403c]`}>
          Cek dokumentasi, laporan, dana dan rekening di bawah. Setelah Sekretariat dan BRIM Nasional setuju, ALK Kota
          mengirim link ke Korwil PPHTGD.
        </p>
      </div>
      <Field label="Alasan Tolak">
        <textarea
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Isi jika tolak…"
          className={`${FLD} resize-none`}
        />
      </Field>
      {error ? <p role="alert" className={ERROR}>{error}</p> : null}
      <Decide
        approve={pending && action === 'setuju' ? '…' : 'Approve'}
        reject={pending && action === 'tolak' ? '…' : 'Tolak'}
        disabled={pending}
        onApprove={() => decide('setuju')}
        onReject={() => decide('tolak')}
      />
    </div>
  )
}

/**
 * Sekretariat / BRIM Nasional: tracker satu pengajuan dana + Approve / Tolak di langkah review Nasional.
 * Langkah berikutnya diputuskan lewat link tanpa login (Korwil → PIC LevelUP → Keuangan); link dan kirim ulang
 * notif hanya untuk Sekretariat.
 */
export function ReimburseReviewV2Client({ review, backHref = `${ALK_BASE}/reimburse` }: { review: ReimburseReview; backHref?: string }) {
  const router = useRouter()
  const { view, links, share } = review
  const sekre = review.role === 'sekre'
  const r = view.reimburse
  const stage = view.stage
  const st = REIMBURSE_STAGE[stage]
  const current = danaStepIndex(stage)
  const stamps = [null, view.at.korwil, view.at.pic, view.at.cair, null]
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const notifStage = !sekre ? undefined : stage === 'pusat' ? view.at.notifPic : stage === 'keuangan' ? view.at.notifKeuangan : undefined

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
    router.refresh()
  }

  function resend() {
    setError('')
    start(async () => {
      const res = await resendDanaNotif(view.idEvent)
      if (!res.ok) return setError(res.error)
      flash('Notif WA grup terkirim')
    })
  }

  const reviewLine = (who: string, state: keyof typeof REVIEW_STATE_LABEL, at: string | null) =>
    `${who} ${REVIEW_STATE_LABEL[state]}${state !== 'menunggu' && at ? ` · ${at}` : ''}`

  return (
    <PaperMain>
      <PaperHeader
        sticker={`${view.kota} · ${view.tanggal}`}
        title={view.namaEvent}
        leading={<IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push(backHref)} className="-rotate-3" />}
      />
      <div className="px-5 mt-5 space-y-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <Pill tone={st.tone}>{st.label}</Pill>
          <span className={`${MONO} text-[11px] font-bold text-[#44403c]`}>PIC: {st.pic}</span>
        </div>

        <div className={`${PANEL} ${ROWS} overflow-hidden`}>
          {DANA_STEPS.map((s, i) => {
            const done = current > i
            const active = current === i
            return (
              <div key={s.key} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className={`${MONO} flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    done ? 'bg-[#161616] text-[#ffd83d]' : active ? 'bg-[#ffd83d] text-[#161616] ring-2 ring-[#161616]' : 'ring-2 ring-[#161616]/20 text-[#57534e]'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span className={`${MONO} flex-1 text-[12px] font-bold ${active ? '' : 'text-[#57534e]'}`}>
                  {s.label}
                  {i === 0 && (active || done || view.rejection) ? (
                    <span className="block text-[10.5px] font-normal">
                      {reviewLine('Sekretariat', view.review.sekre, view.at.sekre)}
                      <br />
                      {reviewLine('BRIM', view.review.brim, view.at.brim)}
                    </span>
                  ) : null}
                  {i === 1 && view.korwil ? <span className="block text-[10.5px] font-normal">{view.korwil.nama}{view.korwil.koordinator ? ` — ${view.korwil.koordinator}` : ''}</span> : null}
                </span>
                {done && stamps[i] ? <span className={`${MONO} text-[10px] text-[#57534e]`}>{stamps[i]}</span> : null}
              </div>
            )
          })}
        </div>

        {view.rejection ? (
          <>
            <p className={`${ERROR} whitespace-pre-wrap`}>Ditolak {view.rejection.oleh}: {view.rejection.alasan || '-'}</p>
            <Note tone="rose">Menunggu ALK Kota memperbaiki dan mengajukan ulang.</Note>
          </>
        ) : null}

        {stage === 'review' && !review.bisaReview ? (
          <Note tone="sky">
            Kamu sudah menyetujui. Menunggu {view.review.sekre === 'menunggu' ? 'Sekretariat Nasional' : 'BRIM Nasional'}.
          </Note>
        ) : null}

        {sekre && stage === 'korwil' && !view.korwil ? (
          <Note tone="rose">Pengajuan lama tanpa korwil. ALK Kota perlu memilih Korwil PPHTGD lalu Ajukan ulang.</Note>
        ) : null}

        {stage === 'korwil' ? (
          <Note tone="sky">Disetujui Sekretariat &amp; BRIM Nasional. Menunggu ALK Kota mengirim link ke Korwil PPHTGD.</Note>
        ) : null}

        {links.korwil || links.pic || links.keuangan ? (
          <div className="space-y-2">
            <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>Link langkah aktif (tanpa login)</p>
            {links.korwil ? <CopyLine label="Salin link Korwil" value={links.korwil} /> : null}
            {share?.waUrl ? (
              <a href={share.waUrl} target="_blank" rel="noreferrer" className={`${MONO} block w-full rounded-[10px] bg-[#1f9d55] px-3 py-2.5 text-center text-[12px] font-bold text-white ${PRESS}`}>
                Kirim ke Korwil via WhatsApp
              </a>
            ) : null}
            {links.pic ? <CopyLine label="Salin link PIC LevelUP Pusat" value={links.pic} /> : null}
            {links.keuangan ? <CopyLine label="Salin link Keuangan PPHTGD" value={links.keuangan} /> : null}
          </div>
        ) : null}

        {notifStage !== undefined ? (
          <div className="space-y-2">
            {notifStage ? (
              <Note tone="sky">Notif WA grup PPHTGD terkirim {notifStage}.</Note>
            ) : stage === 'keuangan' && !links.keuangan ? (
              <Note tone="rose">
                Pengajuan lama (disetujui sebelum alur link): link Keuangan belum ada. Tombol di bawah membuat link dan
                mengirimnya ke grup WA PPHTGD.
              </Note>
            ) : (
              <Note tone="rose">Notif WA grup PPHTGD belum terkirim.</Note>
            )}
            <button type="button" disabled={pending} onClick={resend} className={BTN}>
              <Strip tone="ink" className="py-2.5 text-[16px]">
                {pending ? '...' : stage === 'keuangan' && !links.keuangan ? 'Kirim link Keuangan ke grup WA' : 'Kirim ulang notif WA grup'}
              </Strip>
            </button>
          </div>
        ) : null}

        <div className={`${PANEL} ${ROWS} overflow-hidden`}>
          <Line label="Link Dokumentasi"><ExtLink href={r.bukti} /></Line>
          <Line label="Link Laporan"><ExtLink href={r.laporan} /></Line>
          <Line label="Jumlah Hadir (absen)">{view.hadir}</Line>
          <Line label="Pengajuan Dana">{fmtRp(r.danausul)}</Line>
          <Line label="Penggunaan Dana Riil">{fmtRp(r.danariil)}</Line>
          <Line label="Bank">{r.namabank || '-'}</Line>
          <Line label="No Rekening">{r.norek || '-'}</Line>
          <Line label="Atas Nama">{r.namarek || '-'}</Line>
          {view.korwil ? <Line label="Korwil PPHTGD">{view.korwil.nama}{view.korwil.koordinator ? ` — ${view.korwil.koordinator}` : ''}</Line> : null}
          {r.buktitf ? <Line label="Bukti Transfer"><ExtLink href={r.buktitf} /></Line> : null}
        </div>

        {review.bisaReview ? <ReviewDecision review={review} onDone={flash} /> : null}

        {error ? <p role="alert" className={ERROR}>{error}</p> : null}

        {sekre && (stage === 'keuangan' || stage === 'cair') ? (
          <a href={`/surat-keuangan/${view.idEvent}`} target="_blank" rel="noreferrer" className={BTN}>
            <Strip tone="ink" className="py-2.5 text-[16px]">Cetak Surat untuk Keuangan</Strip>
          </a>
        ) : null}
      </div>
      <Toast msg={toast} />
    </PaperMain>
  )
}
