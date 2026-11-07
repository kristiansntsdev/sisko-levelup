// Single source of truth for where a support-dana request is (used by Sekretariat v2 list/review, event detail,
// the dana form, the no-login /dana links and the demo).
// Alur: ALK Kota → Korwil PPHTGD (approvepphtgd) → PIC LevelUP Pusat (approvenasional) → Keuangan PPHTGD (approvekeuangan).
export type ReimburseStage = 'belum' | 'tanpa_dana' | 'korwil' | 'pusat' | 'ditolak' | 'keuangan' | 'cair'
export type ReimburseTone = 'slate' | 'amber' | 'green' | 'red'

/** `reimburse.ajukan` is 'Ajukan' / 'Tidak Ajukan' from the new form but '1' / '0' in rows from the old app. */
export const AJUKAN_VALUES = ['Ajukan', '1']
export const isAjukan = (v: string | null | undefined) => AJUKAN_VALUES.includes(v ?? '')
export const isTidakAjukan = (v: string | null | undefined) => v === 'Tidak Ajukan' || v === '0'

export type ReimburseStageInput = {
  ajukan: string
  approvepphtgd: string
  approvenasional: string
  approvekeuangan: string
}

export function reimburseStage(r: ReimburseStageInput | null | undefined): ReimburseStage {
  if (!r || (!isAjukan(r.ajukan) && !isTidakAjukan(r.ajukan))) return 'belum'
  if (isTidakAjukan(r.ajukan)) return 'tanpa_dana'
  // Checked first: rows approved by Sekretariat Nasional before the Korwil step existed have approvepphtgd = ''.
  if (r.approvenasional === '1') return r.approvekeuangan === '1' ? 'cair' : 'keuangan'
  if (r.approvepphtgd === '0' || r.approvenasional === '0') return 'ditolak'
  if (r.approvepphtgd !== '1') return 'korwil'
  return 'pusat'
}

/** Who rejected and why; null when the request is not rejected. */
export function reimburseRejection(
  r: (ReimburseStageInput & { notepphtgd: string; notenasional: string }) | null | undefined,
): { oleh: string; alasan: string } | null {
  if (reimburseStage(r) !== 'ditolak' || !r) return null
  return r.approvepphtgd === '0'
    ? { oleh: 'Korwil PPHTGD', alasan: r.notepphtgd }
    : { oleh: 'PIC LevelUP Pusat', alasan: r.notenasional }
}

/** Form ALK Kota terkunci begitu Korwil sudah ACC (sampai ada yang menolak). */
export const isReimburseLocked = (stage: ReimburseStage) =>
  stage === 'pusat' || stage === 'keuangan' || stage === 'cair'

export const REIMBURSE_STAGE: Record<ReimburseStage, { label: string; pic: string; tone: ReimburseTone }> = {
  belum: { label: 'Belum diajukan', pic: 'ALK Kota', tone: 'slate' },
  tanpa_dana: { label: 'Tanpa dana', pic: '—', tone: 'slate' },
  korwil: { label: 'Menunggu Korwil', pic: 'Korwil PPHTGD', tone: 'amber' },
  pusat: { label: 'Menunggu PIC LevelUP', pic: 'PIC LevelUP Pusat', tone: 'amber' },
  keuangan: { label: 'Siap ditransfer', pic: 'Keuangan PPHTGD', tone: 'amber' },
  cair: { label: 'Cair', pic: 'Selesai', tone: 'green' },
  ditolak: { label: 'Ditolak', pic: 'ALK Kota', tone: 'red' },
}

/** Urutan langkah untuk tracker (Korwil → PIC LevelUP → Keuangan → Cair). */
export const DANA_STEPS = [
  { key: 'korwil', label: 'Korwil PPHTGD' },
  { key: 'pusat', label: 'PIC LevelUP Pusat' },
  { key: 'keuangan', label: 'Keuangan PPHTGD' },
  { key: 'cair', label: 'Cair' },
] as const

/** Index langkah aktif di DANA_STEPS; semua langkah selesai = 4. -1 kalau belum/tanpa dana. */
export function danaStepIndex(stage: ReimburseStage): number {
  if (stage === 'korwil') return 0
  if (stage === 'pusat') return 1
  if (stage === 'keuangan') return 2
  if (stage === 'cair') return 4
  return -1
}
