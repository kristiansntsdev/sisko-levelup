'use client'
import type { ReimburseData, SubmitReimburseInput } from '@/lib/actions/reimburse'
import { addLog, getDb, mutate, type DbReimburse } from '../../db'

export type * from '@/lib/actions/reimburse'

const toData = (r: DbReimburse): ReimburseData => ({
  id_reimburse: r.id_reimburse, id_event: r.id_event, ajukan: r.ajukan, namabank: r.namabank, norek: r.norek, namarek: r.namarek,
  danausul: r.danausul, danariil: r.danariil, laporan: r.laporan, bukti: r.bukti, approvenasional: r.approvenasional, notenasional: r.notenasional,
})

export async function getReimburseForEvent(idEvent: number): Promise<ReimburseData | null> {
  const r = getDb().reimburse.find((x) => x.id_event === String(idEvent))
  return r ? toData(r) : null
}

/** Every save re-files the request with LevelUP Pusat and clears the previous decision, as the real action does. */
export async function submitReimburse(idEvent: number, input: SubmitReimburseInput): Promise<void> {
  mutate((d) => {
    const now = new Date().toISOString()
    const entry = { stage: input.ajukan === 'Ajukan' ? 'Diajukan oleh ALK Kota' : 'Tidak mengajukan dana', at: now, by: 'Admin LK Medan' }
    const row = d.reimburse.find((x) => x.id_event === String(idEvent))
    if (row) {
      Object.assign(row, input, { approvenasional: '', notenasional: '', approvekeuangan: '', notekeuangan: '', at: now })
      row.history.push(entry)
    } else {
      d.reimburse.push({ id_reimburse: d.nextId++, id_event: String(idEvent), ...input, approvenasional: '', notenasional: '', approvekeuangan: '', notekeuangan: '', at: now, history: [entry] })
    }
    addLog(d, `Pengajuan dana event #${idEvent} dikirim`)
  })
}

export type ReimburseApprovalResult = { ok: true } | { ok: false; error: string }

/** Demo-only: stand in for LevelUP Pusat. */
export async function approveReimburseNasional(idReimburse: number): Promise<ReimburseApprovalResult> {
  mutate((d) => {
    const r = d.reimburse.find((x) => x.id_reimburse === idReimburse)
    if (!r) return
    r.approvenasional = '1'
    r.notenasional = ''
    r.at = new Date().toISOString()
    r.history.push({ stage: 'Disetujui LevelUP Pusat · diteruskan ke Keuangan', at: r.at, by: 'LevelUP Pusat' })
    addLog(d, 'LevelUP Pusat menyetujui pengajuan dana (simulasi)')
  })
  return { ok: true }
}

export async function rejectReimburseNasional(idReimburse: number, alasan: string): Promise<ReimburseApprovalResult> {
  if (!alasan.trim()) return { ok: false, error: 'Alasan wajib diisi' }
  mutate((d) => {
    const r = d.reimburse.find((x) => x.id_reimburse === idReimburse)
    if (!r) return
    r.approvenasional = '0'
    r.notenasional = alasan.trim()
    r.at = new Date().toISOString()
    r.history.push({ stage: 'Ditolak LevelUP Pusat', at: r.at, by: 'LevelUP Pusat', note: alasan.trim() })
    addLog(d, 'LevelUP Pusat menolak pengajuan dana (simulasi)')
  })
  return { ok: true }
}

/** Demo-only: stand in for Keuangan paying out an approved request. */
export async function cairkanReimburse(idReimburse: number): Promise<ReimburseApprovalResult> {
  mutate((d) => {
    const r = d.reimburse.find((x) => x.id_reimburse === idReimburse)
    if (!r) return
    r.approvekeuangan = '1'
    r.at = new Date().toISOString()
    r.history.push({ stage: 'Dana dicairkan', at: r.at, by: 'Keuangan' })
    addLog(d, 'Keuangan mencairkan dana (simulasi)')
  })
  return { ok: true }
}
