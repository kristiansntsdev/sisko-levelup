// Single source of truth for where a support-dana request is (used by Sekretariat v2 list/review, BRIM v2,
// event detail, the dana form, the no-login /dana links and the demo).
// Alur: ALK Kota → Sekretariat & BRIM Nasional (approvesekre + approvebrim, urutan bebas) → Korwil PPHTGD
// (approvepphtgd) → PIC LevelUP Pusat (approvenasional) → Keuangan PPHTGD (approvekeuangan).
export type ReimburseStage = 'belum' | 'tanpa_dana' | 'review' | 'korwil' | 'pusat' | 'ditolak' | 'keuangan' | 'cair'
export type ReimburseTone = 'slate' | 'amber' | 'green' | 'red'

/** `reimburse.ajukan` is 'Ajukan' / 'Tidak Ajukan' from the new form but '1' / '0' in rows from the old app. */
export const AJUKAN_VALUES = ['Ajukan', '1']
export const isAjukan = (v: string | null | undefined) => AJUKAN_VALUES.includes(v ?? '')
export const isTidakAjukan = (v: string | null | undefined) => v === 'Tidak Ajukan' || v === '0'

export type ReimburseStageInput = {
  ajukan: string
  approvesekre: string
  approvebrim: string
  approvepphtgd: string
  approvenasional: string
  approvekeuangan: string
}

export function reimburseStage(r: ReimburseStageInput | null | undefined): ReimburseStage {
  if (!r || (!isAjukan(r.ajukan) && !isTidakAjukan(r.ajukan))) return 'belum'
  if (isTidakAjukan(r.ajukan)) return 'tanpa_dana'
  // Checked first: rows approved by Sekretariat Nasional before the Korwil step existed have approvepphtgd = ''.
  if (r.approvenasional === '1') return r.approvekeuangan === '1' ? 'cair' : 'keuangan'
  if (r.approvesekre === '0' || r.approvebrim === '0' || r.approvepphtgd === '0' || r.approvenasional === '0') return 'ditolak'
  if (r.approvesekre !== '1' || r.approvebrim !== '1') return 'review'
  if (r.approvepphtgd !== '1') return 'korwil'
  return 'pusat'
}

/** Who rejected and why; null when the request is not rejected. */
export function reimburseRejection(
  r:
    | (ReimburseStageInput & { notesekre: string; notebrim: string; notepphtgd: string; notenasional: string })
    | null
    | undefined,
): { oleh: string; alasan: string } | null {
  if (reimburseStage(r) !== 'ditolak' || !r) return null
  if (r.approvesekre === '0') return { oleh: 'Sekretariat Nasional', alasan: r.notesekre }
  if (r.approvebrim === '0') return { oleh: 'BRIM Nasional', alasan: r.notebrim }
  return r.approvepphtgd === '0'
    ? { oleh: 'Korwil PPHTGD', alasan: r.notepphtgd }
    : { oleh: 'PIC LevelUP Pusat', alasan: r.notenasional }
}

export type ReviewState = 'menunggu' | 'setuju' | 'tolak'
export const reviewState = (v: string): ReviewState => (v === '1' ? 'setuju' : v === '0' ? 'tolak' : 'menunggu')
export const REVIEW_STATE_LABEL: Record<ReviewState, string> = { menunggu: 'menunggu', setuju: '✓ setuju', tolak: '✕ tolak' }

/** Status review Sekretariat + BRIM Nasional (langkah sebelum Korwil). */
export function reimburseReview(r: Pick<ReimburseStageInput, 'approvesekre' | 'approvebrim'>): {
  sekre: ReviewState
  brim: ReviewState
} {
  return { sekre: reviewState(r.approvesekre), brim: reviewState(r.approvebrim) }
}

/** Siapa yang memegang pengajuan sekarang; di langkah review hanya pihak yang belum memutuskan. */
export function reimbursePic(r: ReimburseStageInput | null | undefined): string {
  const stage = reimburseStage(r)
  if (stage !== 'review' || !r) return REIMBURSE_STAGE[stage].pic
  const { sekre, brim } = reimburseReview(r)
  if (sekre === 'menunggu' && brim === 'menunggu') return REIMBURSE_STAGE.review.pic
  return sekre === 'menunggu' ? 'Sekretariat Nasional' : 'BRIM Nasional'
}

/** Form ALK Kota terkunci begitu Korwil sudah ACC (sampai ada yang menolak). */
export const isReimburseLocked = (stage: ReimburseStage) =>
  stage === 'pusat' || stage === 'keuangan' || stage === 'cair'

export const REIMBURSE_STAGE: Record<ReimburseStage, { label: string; pic: string; tone: ReimburseTone }> = {
  belum: { label: 'Belum diajukan', pic: 'ALK Kota', tone: 'slate' },
  tanpa_dana: { label: 'Tanpa dana', pic: '—', tone: 'slate' },
  review: { label: 'Review Nasional', pic: 'Sekretariat & BRIM Nasional', tone: 'amber' },
  korwil: { label: 'Menunggu Korwil', pic: 'Korwil PPHTGD', tone: 'amber' },
  pusat: { label: 'Menunggu PIC LevelUP', pic: 'PIC LevelUP Pusat', tone: 'amber' },
  keuangan: { label: 'Siap ditransfer', pic: 'Keuangan PPHTGD', tone: 'amber' },
  cair: { label: 'Cair', pic: 'Selesai', tone: 'green' },
  ditolak: { label: 'Ditolak', pic: 'ALK Kota', tone: 'red' },
}

/** Urutan langkah untuk tracker (Sekretariat & BRIM → Korwil → PIC LevelUP → Keuangan → Cair). */
export const DANA_STEPS = [
  { key: 'review', label: 'Sekretariat & BRIM Nasional' },
  { key: 'korwil', label: 'Korwil PPHTGD' },
  { key: 'pusat', label: 'PIC LevelUP Pusat' },
  { key: 'keuangan', label: 'Keuangan PPHTGD' },
  { key: 'cair', label: 'Cair' },
] as const

/** danaStepIndex saat semua langkah selesai (cair). */
export const DANA_DONE = DANA_STEPS.length

/** Index langkah aktif di DANA_STEPS; semua langkah selesai = DANA_DONE. -1 kalau belum/tanpa dana/ditolak. */
export function danaStepIndex(stage: ReimburseStage): number {
  if (stage === 'review') return 0
  if (stage === 'korwil') return 1
  if (stage === 'pusat') return 2
  if (stage === 'keuangan') return 3
  if (stage === 'cair') return DANA_DONE
  return -1
}
