'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import {
  resendDanaNotif,
  type ReimburseListItem,
  type ReimburseReview,
} from '@/lib/actions/reimburse'
import { DANA_STEPS, danaStepIndex, REIMBURSE_STAGE, type ReimburseStage } from '@/lib/reimburse-stage'
import { ANTON, BTN, ERROR, IconButton, LABEL, MONO, PANEL, PaperHeader, PaperMain, PRESS, ROWS, Strip } from '@/components/pwa/paper-ui'
import { Pill } from '@/components/pwa/ui'
import { PAGE_SIZE_EVENT, Pager, SearchBox } from './list-tools'
import { ALK_BASE, ALK_EVENT_BASE, Empty, Note, PersonChip, Toast } from './ui'

function fmtRp(s: string) {
  const n = parseInt(String(s).replace(/\D/g, ''), 10)
  return isNaN(n) || n === 0 ? '-' : `Rp ${n.toLocaleString('id-ID')}`
}

type Filter = ReimburseStage | 'all' | 'menunggu'

// Menunggu = masih di Korwil PPHTGD atau PIC LevelUP Pusat
const FILTERS_NASIONAL: [Filter, string][] = [
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

function matchFilter(filter: Filter, stage: ReimburseStage) {
  if (filter === 'all') return true
  if (filter === 'menunggu') return stage === 'korwil' || stage === 'pusat'
  return stage === filter
}

export function ReimburseListV2Client({ isNasional, items }: { isNasional: boolean; items: ReimburseListItem[] }) {
  const router = useRouter()
  const filters = isNasional ? FILTERS_NASIONAL : FILTERS_KOTA
  const [filter, setFilter] = useState<Filter>(filters[0][0])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return items.filter((i) => {
      if (!matchFilter(filter, i.stage)) return false
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

/** Sekretariat Nasional: tracker read-only. Keputusan diambil lewat link tanpa login (Korwil → PIC LevelUP → Keuangan). */
export function ReimburseReviewV2Client({ review }: { review: ReimburseReview }) {
  const router = useRouter()
  const { view, links, share } = review
  const r = view.reimburse
  const stage = view.stage
  const st = REIMBURSE_STAGE[stage]
  const current = danaStepIndex(stage)
  const stamps = [view.at.korwil, view.at.pic, view.at.cair, null]
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const notifStage = stage === 'pusat' ? view.at.notifPic : stage === 'keuangan' ? view.at.notifKeuangan : undefined

  function resend() {
    setError('')
    start(async () => {
      const res = await resendDanaNotif(view.idEvent)
      if (!res.ok) return setError(res.error)
      setToast('Notif WA grup terkirim')
      setTimeout(() => setToast(null), 2200)
      router.refresh()
    })
  }

  return (
    <PaperMain>
      <PaperHeader
        sticker={`${view.kota} · ${view.tanggal}`}
        title={view.namaEvent}
        leading={<IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push(`${ALK_BASE}/reimburse`)} className="-rotate-3" />}
      />
      <div className="px-5 mt-5 space-y-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <Pill tone={st.tone}>{st.label}</Pill>
          <span className={`${MONO} text-[11px] font-bold text-[#44403c]`}>PIC: {st.pic}</span>
        </div>

        <div className={`${PANEL} ${ROWS} overflow-hidden`}>
          {DANA_STEPS.map((s, i) => {
            const done = current > i || (current === 4 && i === 3)
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
                  {i === 0 && view.korwil ? <span className="block text-[10.5px] font-normal">{view.korwil.nama}{view.korwil.koordinator ? ` — ${view.korwil.koordinator}` : ''}</span> : null}
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

        {stage === 'korwil' && !view.korwil ? (
          <Note tone="rose">Pengajuan lama tanpa korwil. ALK Kota perlu memilih Korwil PPHTGD lalu Ajukan ulang.</Note>
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
          {r.buktitf ? <Line label="Bukti Transfer"><ExtLink href={r.buktitf} /></Line> : null}
        </div>

        {error ? <p role="alert" className={ERROR}>{error}</p> : null}

        {stage === 'keuangan' || stage === 'cair' ? (
          <a href={`/surat-keuangan/${view.idEvent}`} target="_blank" rel="noreferrer" className={BTN}>
            <Strip tone="ink" className="py-2.5 text-[16px]">Cetak Surat untuk Keuangan</Strip>
          </a>
        ) : null}
      </div>
      <Toast msg={toast} />
    </PaperMain>
  )
}
