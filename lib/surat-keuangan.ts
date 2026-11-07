import { loadDanaByEvent } from '@/lib/dana-approval'
import type { KorwilOption, SuratApprovals, SuratKeuanganData } from '@/lib/surat-keuangan-data'

export type SuratKeuanganResult =
  | {
      status: 'ok'
      data: SuratKeuanganData
      idCabang: string
      namaCabang: string
      /** Snapshot korwil dari submit; null untuk baris lama (korwil dipilih saat cetak) */
      korwil: KorwilOption | null
      approvals: SuratApprovals
    }
  | { status: 'not_found' }
  | { status: 'not_ready' }

/** Data surat pengajuan support dana untuk Keuangan; hanya tersedia setelah PIC LevelUP Pusat approve. */
export async function loadSuratKeuangan(idEvent: number): Promise<SuratKeuanganResult> {
  const res = await loadDanaByEvent(idEvent)
  if (!res) return { status: 'not_found' }
  const { view } = res
  // keuangan/cair = dana diajukan + disetujui PIC LevelUP Pusat (approvenasional = 1)
  if (view.stage !== 'keuangan' && view.stage !== 'cair') return { status: 'not_ready' }
  return {
    status: 'ok',
    idCabang: view.idCabang,
    namaCabang: view.namaCabang,
    data: view.surat,
    korwil: view.korwil,
    approvals: view.approvals,
  }
}
