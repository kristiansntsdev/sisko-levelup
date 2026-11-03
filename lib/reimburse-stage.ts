// Single source of truth for where a support-dana request is (used by Sekretariat v2 list/review, event detail and the demo).
export type ReimburseStage = 'belum' | 'tanpa_dana' | 'pusat' | 'ditolak' | 'keuangan' | 'cair'
export type ReimburseTone = 'slate' | 'amber' | 'green' | 'red'

/** `reimburse.ajukan` is 'Ajukan' / 'Tidak Ajukan' from the new form but '1' / '0' in rows from the old app. */
export const AJUKAN_VALUES = ['Ajukan', '1']
export const isAjukan = (v: string | null | undefined) => AJUKAN_VALUES.includes(v ?? '')
export const isTidakAjukan = (v: string | null | undefined) => v === 'Tidak Ajukan' || v === '0'

export function reimburseStage(
  r: { ajukan: string; approvenasional: string; approvekeuangan: string } | null | undefined,
): ReimburseStage {
  if (!r || (!isAjukan(r.ajukan) && !isTidakAjukan(r.ajukan))) return 'belum'
  if (isTidakAjukan(r.ajukan)) return 'tanpa_dana'
  if (r.approvenasional === '0') return 'ditolak'
  if (r.approvenasional !== '1') return 'pusat'
  return r.approvekeuangan === '1' ? 'cair' : 'keuangan'
}

export const REIMBURSE_STAGE: Record<ReimburseStage, { label: string; pic: string; tone: ReimburseTone }> = {
  belum: { label: 'Belum diajukan', pic: 'ALK Kota', tone: 'slate' },
  tanpa_dana: { label: 'Tanpa dana', pic: '—', tone: 'slate' },
  pusat: { label: 'Menunggu approval', pic: 'LevelUP Pusat', tone: 'amber' },
  keuangan: { label: 'Disetujui · ke Keuangan', pic: 'Keuangan PPHTGD', tone: 'amber' },
  cair: { label: 'Cair', pic: 'Selesai', tone: 'green' },
  ditolak: { label: 'Ditolak', pic: 'ALK Kota', tone: 'red' },
}
