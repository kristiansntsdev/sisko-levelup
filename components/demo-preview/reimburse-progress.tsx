'use client'
// Demo-only: in the real app Korwil PPHTGD, PIC LevelUP Pusat and Keuangan PPHTGD decide through no-login WhatsApp links.
// This adds the "who has it now" tracker (ALK Kota → Korwil → PIC LevelUP → Keuangan → Cair), plus Simulasi buttons
// that stand in for those people.
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'
import { ANTON, BTN, BTN_OUTLINE, ERROR, IconButton, LABEL, MONO, PANEL, PaperHeader, PaperMain, PRESS, Strip } from '@/components/pwa/paper-ui'
import { Pill, type PillTone } from '@/components/pwa/ui'
import { Empty, PersonChip } from './clone/alk-v2/ui'
import { ALK_BASE, ALK_EVENT_BASE } from './clone/alk-v2/paths'
import { Loading, useAlk } from './alk'
import { REIMBURSE_STAGE, reimburseRejection, reimburseStage, type ReimburseStage } from '@/lib/reimburse-stage'
import { snapshot, subscribe, type DbReimburse } from './db'
import { cairkanReimburse, simulasiKorwil, simulasiPic } from './shim/actions/reimburse'
import { fmtShort } from './shim/util'

export type Stage = ReimburseStage

export function stageOf(r?: DbReimburse): Stage {
  return reimburseStage(r)
}

const LABEL_OF = Object.fromEntries(Object.entries(REIMBURSE_STAGE).map(([k, v]) => [k, v.label])) as Record<Stage, string>
const PIC_OF = Object.fromEntries(Object.entries(REIMBURSE_STAGE).map(([k, v]) => [k, v.pic])) as Record<Stage, string>
const TONE_OF = Object.fromEntries(Object.entries(REIMBURSE_STAGE).map(([k, v]) => [k, v.tone])) as Record<Stage, PillTone>
const STEPS = ['Diajukan', 'Korwil', 'PIC LevelUP', 'Keuangan', 'Cair'] as const
/** How many steps are done for each stage (the current step is the next one). */
const DONE: Record<Stage, number> = { belum: 0, tanpa_dana: 0, ditolak: 1, korwil: 1, pusat: 2, keuangan: 3, cair: 5 }

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
  const done = stage === 'ditolak' && r.approvenasional === '0' ? 2 : DONE[stage]
  const rejection = reimburseRejection(r)
  const decide = stage === 'korwil' ? simulasiKorwil : simulasiPic
  const who = stage === 'korwil' ? 'Korwil' : 'PIC LevelUP'

  async function reject() {
    const res = await decide(r!.id_reimburse, 'tolak', reason)
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
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${ANTON} text-[15px] ${i < done ? 'bg-[#ffd83d]' : i === done && stage !== 'ditolak' ? 'bg-[#e02a2f] text-white outline-2 outline-offset-2 outline-[#e02a2f]' : stage === 'ditolak' && i === done ? 'bg-[#c21f24] text-white' : 'border-2 border-dotted border-[#161616]/40 text-[#57534e]'}`}>
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
        {rejection && <p className={`${ERROR} mt-3`}>Ditolak {rejection.oleh}: {rejection.alasan}</p>}
        <ul className="mt-4 space-y-2 border-t-2 border-dotted border-[#161616]/25 pt-3">
          {[...r.history].reverse().map((h, i) => (
            <li key={i} className={`${MONO} text-[11px] leading-snug text-[#44403c]`}>
              <b className="text-[#161616]">{h.stage}</b> · {h.by} · {ago(h.at)} lalu{h.note ? ` — ${h.note}` : ''}
            </li>
          ))}
        </ul>
      </section>

      {(stage === 'korwil' || stage === 'pusat' || stage === 'keuangan') && (
        <section aria-label="Simulasi demo" className={`border-2 border-dashed border-[#161616]/40 p-4 ${PANEL}`}>
          <p className={`${LABEL} text-[10px] font-bold text-[#57534e]`}>Demo · simulasi pihak lain</p>
          <p className={`${MONO} mt-1 text-[11px] text-[#44403c]`}>
            Di aplikasi asli Korwil PPHTGD, PIC LevelUP Pusat dan Keuangan PPHTGD memutuskan lewat link WhatsApp tanpa login, bukan ALK Kota.
          </p>
          {(stage === 'korwil' || stage === 'pusat') && !rejecting && (
            <div className="mt-3 flex gap-2.5">
              <button type="button" onClick={() => decide(r.id_reimburse, 'setuju')} className={`flex-1 ${BTN}`}>
                <Strip tone="ink" className="py-2.5 text-[16px]">Setujui ({who})</Strip>
              </button>
              <button type="button" onClick={() => setRejecting(true)} className={`${ANTON} flex-1 rounded-sm py-2.5 text-[16px] tracking-[.03em] text-[#c21f24] ring-2 ring-inset ring-[#c21f24] ${PRESS}`}>
                Tolak
              </button>
            </div>
          )}
          {(stage === 'korwil' || stage === 'pusat') && rejecting && (
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
