'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import {
  approveReimburseNasional,
  cairkanReimburseNasional,
  rejectReimburseNasional,
  type ReimburseListItem,
  type ReimburseReview,
} from '@/lib/actions/reimburse'
import { REIMBURSE_STAGE, type ReimburseStage } from '@/lib/reimburse-stage'
import { ANTON, BTN, ERROR, IconButton, LABEL, MONO, PANEL, PaperHeader, PaperMain, PRESS, ROWS, Strip } from '@/components/pwa/paper-ui'
import { Pill } from '@/components/pwa/ui'
import { PAGE_SIZE_EVENT, Pager, SearchBox } from './list-tools'
import { ALK_BASE, ALK_EVENT_BASE, Decide, Empty, FLD, Field, Note, PersonChip, Sheet, SheetHead, Toast } from './ui'

function fmtRp(s: string) {
  const n = parseInt(String(s).replace(/\D/g, ''), 10)
  return isNaN(n) || n === 0 ? '-' : `Rp ${n.toLocaleString('id-ID')}`
}

type Filter = ReimburseStage | 'all' | 'disetujui'

const FILTERS_NASIONAL: [Filter, string][] = [
  ['pusat', 'Menunggu'],
  ['disetujui', 'Disetujui'],
  ['cair', 'Cair'],
  ['ditolak', 'Ditolak'],
  ['all', 'Semua'],
]
const FILTERS_KOTA: [Filter, string][] = [
  ['all', 'Semua'],
  ['belum', 'Belum diajukan'],
  ['pusat', 'Menunggu'],
  ['keuangan', 'Disetujui'],
  ['cair', 'Cair'],
  ['ditolak', 'Ditolak'],
]

export function ReimburseListV2Client({ isNasional, items }: { isNasional: boolean; items: ReimburseListItem[] }) {
  const router = useRouter()
  const filters = isNasional ? FILTERS_NASIONAL : FILTERS_KOTA
  const [filter, setFilter] = useState<Filter>(filters[0][0])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return items.filter((i) => {
      if (filter === 'disetujui' ? i.stage !== 'keuangan' && i.stage !== 'cair' : filter !== 'all' && i.stage !== filter) return false
      return !needle || `${i.nama_event} ${i.namaCabang} ${i.tglDisplay}`.toLowerCase().includes(needle)
    })
  }, [items, filter, q])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE_EVENT))
  const shown = rows.slice(page * PAGE_SIZE_EVENT, (page + 1) * PAGE_SIZE_EVENT)

  return (
    <PaperMain>
      <PaperHeader
        sticker={isNasional ? 'Sekretariat Nasional' : 'Sekretariat'}
        title="Reimburse"
        leading={<IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push(ALK_BASE)} className="-rotate-3" />}
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
                  href={isNasional ? `${ALK_BASE}/reimburse/${i.id_event}` : `${ALK_EVENT_BASE}/${i.id_event}/dana`}
                  className={`flex items-center gap-3 p-3.5 ${PRESS}`}
                >
                  <PersonChip />
                  <span className="min-w-0 flex-1">
                    <span className={`${ANTON} block truncate text-[16px] leading-tight tracking-[.02em]`}>{i.nama_event}</span>
                    <span className={`${MONO} mt-0.5 block text-[10.5px] font-bold text-[#44403c]`}>
                      {i.namaCabang} · {i.tglDisplay}
                    </span>
                    <span className={`${MONO} block text-[10.5px] text-[#44403c]`}>
                      PIC: {st.pic}
                      {i.danausul ? ` · ${fmtRp(i.danausul)}` : ''}
                    </span>
                  </span>
                  <Pill tone={st.tone}>{st.label}</Pill>
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

export function ReimburseReviewV2Client({ review }: { review: ReimburseReview }) {
  const router = useRouter()
  const { reimburse: r } = review
  const stage: ReimburseStage = r.approvenasional === '0' ? 'ditolak' : r.approvenasional !== '1' ? 'pusat' : r.approvekeuangan === '1' ? 'cair' : 'keuangan'
  const st = REIMBURSE_STAGE[stage]
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [alasan, setAlasan] = useState('')
  const [confirmCair, setConfirmCair] = useState(false)

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }
  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string, after?: () => void) {
    setError('')
    start(async () => {
      const res = await fn()
      if (!res.ok) return setError(res.error)
      after?.()
      flash(done)
      router.refresh()
    })
  }

  return (
    <PaperMain>
      <PaperHeader
        sticker={`${review.namaCabang} · ${review.tglDisplay}`}
        title={review.nama_event}
        leading={<IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push(`${ALK_BASE}/reimburse`)} className="-rotate-3" />}
      />
      <div className="px-5 mt-5 space-y-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <Pill tone={st.tone}>{st.label}</Pill>
          <span className={`${MONO} text-[11px] font-bold text-[#44403c]`}>PIC: {st.pic}</span>
        </div>

        <div className={`${PANEL} ${ROWS} overflow-hidden`}>
          <Line label="Link Dokumentasi"><ExtLink href={r.bukti} /></Line>
          <Line label="Link Laporan"><ExtLink href={r.laporan} /></Line>
          <Line label="Jumlah Hadir (absen)">{review.jumlahHadir}</Line>
          <Line label="Pengajuan Dana">{fmtRp(r.danausul)}</Line>
          <Line label="Penggunaan Dana Riil">{fmtRp(r.danariil)}</Line>
          <Line label="Bank">{r.namabank || '-'}</Line>
          <Line label="No Rekening">{r.norek || '-'}</Line>
          <Line label="Atas Nama">{r.namarek || '-'}</Line>
        </div>

        {error ? <p role="alert" className={ERROR}>{error}</p> : null}

        {stage === 'pusat' ? (
          <Decide
            approve={pending ? '...' : 'Approve'}
            reject="Tolak"
            disabled={pending}
            onApprove={() => run(() => approveReimburseNasional(r.id_reimburse), 'Dana disetujui')}
            onReject={() => { setError(''); setRejectOpen(true) }}
          />
        ) : null}

        {stage === 'ditolak' ? (
          <>
            {r.notenasional ? <p className={`${ERROR} whitespace-pre-wrap`}>Alasan ditolak: {r.notenasional}</p> : null}
            <Note tone="rose">Menunggu ALK Kota memperbaiki dan mengajukan ulang.</Note>
          </>
        ) : null}

        {stage === 'keuangan' || stage === 'cair' ? (
          <div className="space-y-3">
            <a href={`/surat-keuangan/${review.id_event}`} target="_blank" rel="noreferrer" className={BTN}>
              <Strip tone="ink" className="py-2.5 text-[16px]">Cetak Surat untuk Keuangan</Strip>
            </a>
            {stage === 'keuangan' ? (
              <button type="button" disabled={pending} onClick={() => setConfirmCair(true)} className={BTN}>
                <Strip className="py-2.5 text-[16px]">Tandai sudah cair</Strip>
              </button>
            ) : (
              <Note tone="sky">Dana sudah ditandai cair.</Note>
            )}
          </div>
        ) : null}
      </div>

      <Sheet open={rejectOpen} onClose={() => { if (!pending) { setRejectOpen(false); setError('') } }}>
        <SheetHead title="Tolak pengajuan dana" sub={review.nama_event} />
        <Field label="Alasan">
          <textarea value={alasan} onChange={(e) => setAlasan(e.target.value)} rows={4} placeholder="Alasan penolakan…" className={`${FLD} resize-none`} />
        </Field>
        {error ? <p role="alert" className={`${ERROR} mt-2`}>{error}</p> : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => rejectReimburseNasional(r.id_reimburse, alasan), 'Pengajuan ditolak', () => { setRejectOpen(false); setAlasan('') })}
          className={`mt-4 ${BTN}`}
        >
          <Strip>{pending ? '...' : 'Tolak pengajuan'}</Strip>
        </button>
      </Sheet>

      <Sheet open={confirmCair} onClose={() => { if (!pending) setConfirmCair(false) }}>
        <SheetHead title="Tandai sudah cair?" sub="Pastikan Keuangan PPHTGD sudah mentransfer dana ke rekening." />
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => cairkanReimburseNasional(r.id_reimburse), 'Dana ditandai cair', () => setConfirmCair(false))}
          className={`mt-4 ${BTN}`}
        >
          <Strip tone="ink">{pending ? '...' : 'Ya, sudah cair'}</Strip>
        </button>
      </Sheet>
      <Toast msg={toast} />
    </PaperMain>
  )
}
