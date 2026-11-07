'use client'
import type { DanaForm, ReimburseData, ReimburseListItem, ReimburseReview, SubmitReimburseInput } from '@/lib/actions/reimburse'
import type { DanaView } from '@/lib/dana-approval'
import { reimburseRejection, reimburseStage } from '@/lib/reimburse-stage'
import { buildSuratKeuangan, danaNumber, formatTanggalEvent, matchKorwil } from '@/lib/surat-keuangan-data'
import { levelupKota } from '@/components/documents/_shared/document-header'
import { addLog, DEMO_KORWIL, getDb, mutate, wibDay, type DbReimburse, type DemoDb } from '../../db'
import { alkPengurus, fmtShort } from '../util'

export type * from '@/lib/actions/reimburse'

const toData = (r: DbReimburse): ReimburseData => ({
  id_reimburse: r.id_reimburse, id_event: r.id_event, ajukan: r.ajukan, namabank: r.namabank, norek: r.norek, namarek: r.namarek,
  danausul: r.danausul, danariil: r.danariil, laporan: r.laporan, bukti: r.bukti,
  approvepphtgd: r.approvepphtgd, notepphtgd: r.notepphtgd, approvenasional: r.approvenasional, notenasional: r.notenasional,
  approvekeuangan: r.approvekeuangan, buktitf: r.buktitf,
})

const fmtWib = (iso: string | null) =>
  iso
    ? `${new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB`
    : null

/** Same shape as lib/dana-approval buildView, from the demo store. */
function demoView(d: DemoDb, r: DbReimburse): DanaView | null {
  const event = d.event.find((e) => String(e.id_event) === r.id_event)
  if (!event) return null
  const cabang = d.cabang.find((c) => String(c.id_cabang) === event.id_cabang) ?? null
  const hadir = new Set(d.absen.filter((a) => a.id_event === event.id_event).map((a) => a.id_peserta)).size
  const stamp = (iso: string | null) => (iso ? `Disetujui via link · ${fmtWib(iso)}` : null)
  return {
    idEvent: event.id_event,
    idReimburse: r.id_reimburse,
    idCabang: event.id_cabang,
    namaCabang: cabang?.namacabang ?? '',
    kota: cabang?.namacabang ? levelupKota(cabang.namacabang) : '-',
    namaEvent: event.nama_event,
    tanggal: formatTanggalEvent(event.tglevent, event.tgleventselesai),
    tempat: event.jenisevent === 'Online' ? 'Online' : event.alamatevent || '-',
    hadir,
    dana: danaNumber(r.danausul),
    stage: reimburseStage(r),
    rejection: reimburseRejection(r),
    reimburse: {
      danausul: r.danausul, danariil: r.danariil, namabank: r.namabank, norek: r.norek, namarek: r.namarek,
      bukti: r.bukti, laporan: r.laporan, buktitf: r.buktitf,
    },
    korwil: r.korwil,
    at: { korwil: fmtWib(r.korwil_at), pic: fmtWib(r.pic_at), cair: fmtWib(r.cair_at), notifPic: null, notifKeuangan: null },
    surat: buildSuratKeuangan({
      event: { nama_event: event.nama_event, tglMulai: event.tglevent, tglSelesai: event.tgleventselesai, alamatevent: event.alamatevent, jenisevent: event.jenisevent },
      cabang,
      reimburse: r,
      jumlahHadir: hadir,
    }),
    approvals: {
      korwil: r.approvepphtgd === '1' ? stamp(r.korwil_at) : null,
      pic: r.approvenasional === '1' ? stamp(r.pic_at) : null,
      keuangan: r.approvekeuangan === '1' && r.cair_at ? `Sudah ditransfer · ${fmtWib(r.cair_at)}` : null,
    },
  }
}

export async function getReimburseForEvent(idEvent: number): Promise<ReimburseData | null> {
  const r = getDb().reimburse.find((x) => x.id_event === String(idEvent))
  return r ? toData(r) : null
}

/** Every save restarts the flow at the Korwil and clears previous decisions, as the real action does. */
export async function submitReimburse(idEvent: number, input: SubmitReimburseInput): Promise<void> {
  const korwil = input.ajukan === 'Ajukan' ? DEMO_KORWIL.find((k) => k.id === input.korwilId) ?? null : null
  if (input.ajukan === 'Ajukan' && !korwil) throw new Error('Pilih Korwil PPHTGD dulu')
  const { korwilId: _korwilId, ...fields } = input // eslint-disable-line @typescript-eslint/no-unused-vars
  mutate((d) => {
    const now = new Date().toISOString()
    const entry = { stage: korwil ? `Diajukan oleh ALK Kota · menunggu ${korwil.nama}` : 'Tidak mengajukan dana', at: now, by: 'Admin LK Medan' }
    const reset = {
      approvepphtgd: '', notepphtgd: '', approvenasional: '', notenasional: '', approvekeuangan: '', notekeuangan: '', buktitf: '',
      korwil, korwil_at: null, pic_at: null, cair_at: null, at: now,
    }
    const row = d.reimburse.find((x) => x.id_event === String(idEvent))
    if (row) {
      Object.assign(row, fields, reset)
      row.history.push(entry)
    } else {
      d.reimburse.push({ id_reimburse: d.nextId++, id_event: String(idEvent), ...fields, ...reset, history: [entry] })
    }
    addLog(d, `Pengajuan dana event #${idEvent} dikirim`)
  })
}

/** Dana form: status + korwil picker. The "Kirim ke Korwil" link points at a demo route (no wa.me in the demo). */
export async function getDanaForm(idEvent: number): Promise<DanaForm | null> {
  const d = getDb()
  const event = d.event.find((e) => e.id_event === idEvent)
  if (!event) return null
  const cabang = d.cabang.find((c) => String(c.id_cabang) === event.id_cabang)
  const r = d.reimburse.find((x) => x.id_event === String(idEvent))
  const view = r ? demoView(d, r) : null
  const link = `${typeof window === 'undefined' ? '' : window.location.origin}/demo-preview/dana/demo-${idEvent}`
  return {
    view,
    share:
      view?.stage === 'korwil' && view.korwil
        ? {
            korwil: view.korwil,
            link,
            waUrl: null,
            waText: `Shalom Bapak/Ibu ${view.korwil.koordinator ?? ''},\n\nKami dari ${view.kota} mengajukan support dana untuk event *${view.namaEvent}* (${view.tanggal}).\n\nMohon review & persetujuannya di link berikut (tanpa login):\n${link}`,
          }
        : null,
    korwil: { options: DEMO_KORWIL, defaultId: view?.korwil?.id ?? matchKorwil(DEMO_KORWIL, cabang?.namacabang ?? ''), error: null },
  }
}

export type ReimburseApprovalResult = { ok: true } | { ok: false; error: string }

function decide(
  idReimburse: number,
  step: 'korwil' | 'pic',
  keputusan: 'setuju' | 'tolak',
  alasan = '',
): ReimburseApprovalResult {
  if (keputusan === 'tolak' && !alasan.trim()) return { ok: false, error: 'Alasan wajib diisi' }
  mutate((d) => {
    const r = d.reimburse.find((x) => x.id_reimburse === idReimburse)
    if (!r) return
    const now = new Date().toISOString()
    const who = step === 'korwil' ? r.korwil?.nama ?? 'Korwil PPHTGD' : 'PIC LevelUP Pusat'
    if (step === 'korwil') {
      r.approvepphtgd = keputusan === 'setuju' ? '1' : '0'
      r.notepphtgd = keputusan === 'setuju' ? '' : alasan.trim()
      r.korwil_at = now
    } else {
      r.approvenasional = keputusan === 'setuju' ? '1' : '0'
      r.notenasional = keputusan === 'setuju' ? '' : alasan.trim()
      r.pic_at = now
    }
    r.at = now
    const label = step === 'korwil' ? 'Korwil PPHTGD' : 'PIC LevelUP Pusat'
    r.history.push(
      keputusan === 'setuju'
        ? { stage: `Disetujui ${label} · notif WA ke grup PPHTGD`, at: now, by: who }
        : { stage: `Ditolak ${label}`, at: now, by: who, note: alasan.trim() },
    )
    addLog(d, `${label} ${keputusan === 'setuju' ? 'menyetujui' : 'menolak'} pengajuan dana (simulasi)`)
  })
  return { ok: true }
}

/** Demo-only: stand in for the Korwil opening their no-login link. */
export async function simulasiKorwil(idReimburse: number, keputusan: 'setuju' | 'tolak', alasan?: string) {
  return decide(idReimburse, 'korwil', keputusan, alasan)
}

/** Demo-only: stand in for the PIC LevelUP Pusat opening their no-login link. */
export async function simulasiPic(idReimburse: number, keputusan: 'setuju' | 'tolak', alasan?: string) {
  return decide(idReimburse, 'pic', keputusan, alasan)
}

/** Demo-only: stand in for Keuangan PPHTGD marking the transfer done. */
export async function cairkanReimburse(idReimburse: number): Promise<ReimburseApprovalResult> {
  mutate((d) => {
    const r = d.reimburse.find((x) => x.id_reimburse === idReimburse)
    if (!r) return
    r.approvekeuangan = '1'
    r.at = new Date().toISOString()
    r.cair_at = r.at
    r.history.push({ stage: 'Dana ditransfer', at: r.at, by: 'Keuangan PPHTGD' })
    addLog(d, 'Keuangan PPHTGD menandai dana ditransfer (simulasi)')
  })
  return { ok: true }
}

/** Demo admin is an ALK Kota account, so this is always the kota view (events that have already started). */
export async function listReimburseSekretariat(): Promise<{ isNasional: boolean; items: ReimburseListItem[] } | null> {
  const me = alkPengurus()
  if (!me) return null
  const d = getDb()
  const today = wibDay()
  const namaCabang = d.cabang.find((c) => String(c.id_cabang) === me.cabang)?.namacabang ?? '-'
  return {
    isNasional: false,
    items: d.event
      .filter((e) => e.id_cabang === me.cabang && e.tglevent <= today)
      .sort((a, b) => b.tglevent.localeCompare(a.tglevent))
      .map((e) => {
        const r = d.reimburse.find((x) => x.id_event === String(e.id_event))
        return {
          id_event: e.id_event,
          nama_event: e.nama_event,
          tglDisplay: fmtShort(e.tglevent),
          namaCabang,
          stage: reimburseStage(r),
          danausul: r?.danausul ?? '',
          alasanTolak: reimburseRejection(r)?.alasan ?? '',
        }
      }),
  }
}

/** Sekretariat Nasional screens are not part of the demo. */
export async function getReimburseReview(_idEvent?: number): Promise<ReimburseReview | null> { // eslint-disable-line @typescript-eslint/no-unused-vars
  return null
}

export async function resendDanaNotif(_idEvent?: number): Promise<ReimburseApprovalResult> { // eslint-disable-line @typescript-eslint/no-unused-vars
  return { ok: false, error: 'Notif WA grup PPHTGD tidak ada di demo' }
}
