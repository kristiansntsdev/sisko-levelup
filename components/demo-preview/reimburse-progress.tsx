'use client'
// Demo-only: the real app has one support-dana form and a single Pusat decision. This adds the "who has it now" tracker
// (ALK Kota → LevelUP Pusat → Keuangan → Cair), plus Simulasi buttons that stand in for the Pusat and Keuangan people.
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'
import { ANTON, BTN, BTN_OUTLINE, ERROR, IconButton, LABEL, MONO, PANEL, PaperHeader, PaperMain, PRESS, Strip } from '@/components/pwa/paper-ui'
import { Pill, type PillTone } from '@/components/pwa/ui'
import { Empty, PersonChip } from './clone/alk-v2/ui'
import { ALK_BASE, ALK_EVENT_BASE } from './clone/alk-v2/paths'
import { Loading, useAlk } from './alk'
import { snapshot, subscribe, type DbReimburse } from './db'
import { approveReimburseNasional, cairkanReimburse, rejectReimburseNasional } from './shim/actions/reimburse'
import { fmtShort } from './shim/util'

export type Stage = 'belum' | 'tanpa_dana' | 'ditolak' | 'pusat' | 'keuangan' | 'cair'

export function stageOf(r?: DbReimburse): Stage {
  if (!r || !r.ajukan) return 'belum'
  if (r.ajukan === 'Tidak Ajukan') return 'tanpa_dana'
  if (r.approvenasional === '0') return 'ditolak'
  if (r.approvenasional === '') return 'pusat'
  return r.approvekeuangan === '1' ? 'cair' : 'keuangan'
}

const LABEL_OF: Record<Stage, string> = { belum: 'Belum diajukan', tanpa_dana: 'Tanpa dana', ditolak: 'Ditolak', pusat: 'Di LevelUP Pusat', keuangan: 'Di Keuangan', cair: 'Cair' }
const PIC_OF: Record<Stage, string> = { belum: 'ALK Kota', tanpa_dana: '—', ditolak: 'ALK Kota (perbaiki & ajukan ulang)', pusat: 'LevelUP Pusat', keuangan: 'Keuangan', cair: 'Selesai' }
const TONE_OF: Record<Stage, PillTone> = { belum: 'slate', tanpa_dana: 'slate', ditolak: 'red', pusat: 'amber', keuangan: 'amber', cair: 'green' }
const STEPS = ['Diajukan', 'LevelUP Pusat', 'Keuangan', 'Cair'] as const
/** How many steps are done for each stage (the current step is the next one). */
const DONE: Record<Stage, number> = { belum: 0, tanpa_dana: 0, ditolak: 1, pusat: 1, keuangan: 2, cair: 4 }

function ago(iso: string): string {
  const min = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'baru saja'
  if (min < 60) return `${min} menit`
  if (min < 60 * 24) return `${Math.floor(min / 60)} jam`
  return `${Math.floor(min / 1440)} hari`
}

export function ReimburseProgress({ idEvent }: { idEvent: number }) {
  const db = useSyncExternalStore(subscribe, snapshot, () => null)
  const [reason, setReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [err, setErr] = useState('')
  const r = db?.reimburse.find((x) => x.id_event === String(idEvent))
  const stage = stageOf(r)
  if (!db || !r || stage === 'belum' || stage === 'tanpa_dana') return null
  const done = DONE[stage]

  async function reject() {
    const res = await rejectReimburseNasional(r!.id_reimburse, reason)
    if (!res.ok) return setErr(res.error)
    setRejecting(false)
    setReason('')
    setErr('')
  }

  return (
    <div className="mx-auto w-full max-w-[430px] space-y-4 px-5 pb-28">
      <section aria-label="Status pencairan dana" className={`relative p-4 ${PANEL}`}>
        <h2 className={`${ANTON} border-b-2 border-dotted border-[#161616]/40 pb-3 text-[22px] leading-none`}>Status Pencairan</h2>
        <ol className="mt-4 flex items-start">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col items-center text-center">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${ANTON} text-[15px] ${i < done ? 'bg-[#ffd83d]' : i === done && stage !== 'ditolak' ? 'bg-[#e02a2f] text-white outline-2 outline-offset-2 outline-[#e02a2f]' : stage === 'ditolak' && i === 1 ? 'bg-[#c21f24] text-white' : 'border-2 border-dotted border-[#161616]/40 text-[#57534e]'}`}>
                {i < done ? '✓' : i + 1}
              </span>
              <span className={`${LABEL} mt-1.5 text-[9px] font-bold ${i <= done ? '' : 'text-[#57534e]'}`}>{s}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-[10px] border-2 border-dotted border-[#161616]/40 px-3 py-2.5">
          <span>
            <span className={`${LABEL} block text-[9.5px] text-[#57534e]`}>PIC sekarang</span>
            <span className={`${ANTON} text-[18px] leading-tight`}>{PIC_OF[stage]}</span>
          </span>
          <span className="text-right">
            <Pill tone={TONE_OF[stage]}>{LABEL_OF[stage]}</Pill>
            {stage !== 'cair' && <span className={`${MONO} mt-1 block text-[10.5px] text-[#44403c]`}>sejak {ago(r.at)} lalu</span>}
          </span>
        </div>
        {stage === 'ditolak' && r.notenasional && <p className={`${ERROR} mt-3`}>Alasan ditolak: {r.notenasional}</p>}
        <ul className="mt-4 space-y-2 border-t-2 border-dotted border-[#161616]/25 pt-3">
          {[...r.history].reverse().map((h, i) => (
            <li key={i} className={`${MONO} text-[11px] leading-snug text-[#44403c]`}>
              <b className="text-[#161616]">{h.stage}</b> · {h.by} · {ago(h.at)} lalu{h.note ? ` — ${h.note}` : ''}
            </li>
          ))}
        </ul>
      </section>

      {(stage === 'pusat' || stage === 'keuangan') && (
        <section aria-label="Simulasi demo" className={`border-2 border-dashed border-[#161616]/40 p-4 ${PANEL}`}>
          <p className={`${LABEL} text-[10px] font-bold text-[#57534e]`}>Demo · simulasi pihak lain</p>
          <p className={`${MONO} mt-1 text-[11px] text-[#44403c]`}>Di aplikasi asli langkah ini dilakukan LevelUP Pusat dan Keuangan, bukan ALK Kota.</p>
          {stage === 'pusat' && !rejecting && (
            <div className="mt-3 flex gap-2.5">
              <button type="button" onClick={() => approveReimburseNasional(r.id_reimburse)} className={`flex-1 ${BTN}`}>
                <Strip tone="ink" className="py-2.5 text-[16px]">Setujui (Pusat)</Strip>
              </button>
              <button type="button" onClick={() => setRejecting(true)} className={`${ANTON} flex-1 rounded-sm py-2.5 text-[16px] tracking-[.03em] text-[#c21f24] ring-2 ring-inset ring-[#c21f24] ${PRESS}`}>
                Tolak
              </button>
            </div>
          )}
          {stage === 'pusat' && rejecting && (
            <div className="mt-3 space-y-2.5">
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan penolakan" className="w-full rounded-[10px] bg-[#efe8da]/50 px-3.5 py-3 text-[16px] ring-1 ring-[#161616]/15 outline-none focus:bg-white focus:ring-2 focus:ring-[#161616]" />
              {err && <p className={ERROR}>{err}</p>}
              <div className="flex gap-2.5">
                <button type="button" onClick={reject} className={`flex-1 ${BTN}`}>
                  <Strip className="py-2.5 text-[16px]">Kirim Penolakan</Strip>
                </button>
                <button type="button" onClick={() => setRejecting(false)} className={`${BTN_OUTLINE} flex-1`}>Batal</button>
              </div>
            </div>
          )}
          {stage === 'keuangan' && (
            <button type="button" onClick={() => cairkanReimburse(r.id_reimburse)} className={`mt-3 ${BTN}`}>
              <Strip tone="ink" className="py-2.5 text-[16px]">Tandai Cair (Keuangan)</Strip>
            </button>
          )}
        </section>
      )}
    </div>
  )
}

const FILTERS: [Stage | 'all', string][] = [['all', 'Semua'], ['belum', 'Belum diajukan'], ['pusat', 'Di Pusat'], ['keuangan', 'Di Keuangan'], ['cair', 'Cair'], ['ditolak', 'Ditolak']]

export function ReimburseListPage() {
  const router = useRouter()
  const alk = useAlk()
  const db = useSyncExternalStore(subscribe, snapshot, () => null)
  const [filter, setFilter] = useState<Stage | 'all'>('all')
  if (!alk || !db) return <Loading />

  const rows = db.event
    .filter((e) => e.id_cabang === alk.cabang)
    .sort((a, b) => b.tglevent.localeCompare(a.tglevent))
    .map((e) => ({ e, stage: stageOf(db.reimburse.find((r) => r.id_event === String(e.id_event))) }))
    .filter((x) => filter === 'all' || x.stage === filter)

  return (
    <PaperMain>
      <PaperHeader
        sticker={`${rows.length} event`}
        title="Reimburse"
        leading={<IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push(ALK_BASE)} className="-rotate-3" />}
      />
      <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {FILTERS.map(([v, label]) => (
          <button key={v} type="button" onClick={() => setFilter(v)} className={`${LABEL} shrink-0 rounded-full px-3.5 py-2 text-[10.5px] font-bold ${filter === v ? 'bg-[#161616] text-[#ffd83d]' : 'bg-[#fffdf7] text-[#161616]'}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3 px-5 pb-4">
        {rows.length === 0 ? (
          <Empty>Tidak ada event di filter ini.</Empty>
        ) : (
          rows.map(({ e, stage }) => (
            <Link key={e.id_event} href={`${ALK_EVENT_BASE}/${e.id_event}/dana`} className={`flex items-center gap-3 p-3.5 ${PANEL} ${PRESS}`}>
              <PersonChip />
              <span className="min-w-0 flex-1">
                <span className={`${ANTON} block truncate text-[16px] leading-tight tracking-[.02em]`}>{e.nama_event}</span>
                <span className={`${MONO} mt-0.5 block text-[10.5px] font-bold text-[#44403c]`}>
                  {fmtShort(e.tglevent)} · PIC: {PIC_OF[stage]}
                </span>
              </span>
              <Pill tone={TONE_OF[stage]}>{LABEL_OF[stage]}</Pill>
            </Link>
          ))
        )}
      </div>
    </PaperMain>
  )
}
