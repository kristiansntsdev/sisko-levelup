// Server-only loader for one support-dana request: the shared view behind the no-login /dana/{token} links,
// the ALK Kota form, the Sekretariat Nasional review and the Surat Keuangan print page.
import { db } from '@/lib/db'
import { cekVerifikasiHash, parseVerifikasiKode, verifikasiKode, verifikasiUrl, type DanaPeran } from '@/lib/dana-link'
import {
  reimburseRejection,
  reimburseReview,
  reimburseStage,
  type ReimburseStage,
  type ReviewState,
} from '@/lib/reimburse-stage'
import {
  buildSuratKeuangan,
  danaNumber,
  formatTanggalEvent,
  type KorwilOption,
  type SuratApprovals,
  type SuratKeuanganData,
} from '@/lib/surat-keuangan-data'
import { levelupKota } from '@/components/documents/_shared/document-header'

/** Unique peserta with an absen row; same match as getEventDetail (int or legacy string id). */
export async function countHadirUnik(idEvent: number): Promise<number> {
  const absen = await db.absen.findMany({
    where: { OR: [{ id_event_int: idEvent }, { id_event: String(idEvent) }] },
    select: { id_peserta: true, id_peserta_int: true },
  })
  return new Set(
    absen.map((a) => a.id_peserta_int ?? parseInt(a.id_peserta, 10)).filter((n) => n != null && !isNaN(n)),
  ).size
}

export type DanaTokens = { token_korwil: string; token_pic: string; token_keuangan: string }

export type DanaView = {
  idEvent: number
  idReimburse: number
  /** "DANA-00012", tampil di halaman verifikasi */
  idDokumen: string
  /** Isi QR di kotak TTD Surat Keuangan; null untuk baris lama tanpa reimburse_approval */
  verifikasiUrl: string | null
  idCabang: string
  /** namacabang mentah (untuk matchKorwil) */
  namaCabang: string
  /** "LevelUP Medan" */
  kota: string
  namaEvent: string
  tanggal: string
  tempat: string
  hadir: number
  dana: number
  stage: ReimburseStage
  rejection: { oleh: string; alasan: string } | null
  /** Review Sekretariat + BRIM Nasional (langkah sebelum Korwil) */
  review: { sekre: ReviewState; brim: ReviewState }
  reimburse: {
    danausul: string
    danariil: string
    namabank: string
    norek: string
    namarek: string
    bukti: string
    laporan: string
    buktitf: string
  }
  /** Snapshot korwil saat submit; null untuk baris lama sebelum alur Korwil */
  korwil: KorwilOption | null
  at: {
    /** Waktu pertama kali diajukan ke Korwil (reimburse_approval.created_at) */
    diajukan: string | null
    sekre: string | null
    brim: string | null
    korwil: string | null
    pic: string | null
    cair: string | null
    notifPic: string | null
    notifKeuangan: string | null
  }
  surat: SuratKeuanganData
  approvals: SuratApprovals
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** "7 Nov 2026 14.05 WIB" (WIB eksplisit, tidak bergantung TZ proses). */
export function fmtWib(d: Date | null | undefined): string | null {
  if (!d) return null
  const s = d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${s} WIB`
}

type ReimburseRow = NonNullable<Awaited<ReturnType<typeof db.reimburse.findFirst>>>
type ApprovalRow = NonNullable<Awaited<ReturnType<typeof db.reimburse_approval.findUnique>>>

async function buildView(row: ReimburseRow, approval: ApprovalRow | null): Promise<DanaView | null> {
  const idEvent = Number(row.id_event)
  if (!Number.isInteger(idEvent)) return null
  const event = await db.event.findUnique({
    where: { id_event: idEvent },
    select: { nama_event: true, tglevent: true, tgleventselesai: true, alamatevent: true, jenisevent: true, id_cabang: true },
  })
  if (!event) return null

  const cabangId = Number(event.id_cabang)
  const [cabang, hadir] = await Promise.all([
    Number.isInteger(cabangId) && cabangId > 0
      ? db.cabang.findUnique({ where: { id_cabang: cabangId }, select: { namacabang: true, leadercabang: true } })
      : Promise.resolve(null),
    countHadirUnik(idEvent),
  ])

  const stage = reimburseStage(row)
  // korwil_id 0 = baris lama yang dibuatkan link Keuangan tanpa snapshot korwil (resendDanaNotif)
  const korwil: KorwilOption | null = approval && approval.korwil_id > 0
    ? {
        id: approval.korwil_id,
        nama: approval.korwil_nama,
        koordinator: approval.korwil_koordinator || null,
        kota: null,
        wa: approval.korwil_wa,
      }
    : null
  const stamp = (d: Date | null | undefined) => (d ? `Ditandatangani · ${fmtWib(d)}` : null)

  return {
    idEvent,
    idReimburse: row.id_reimburse,
    idDokumen: `DANA-${String(row.id_reimburse).padStart(5, '0')}`,
    verifikasiUrl: approval ? verifikasiUrl(verifikasiKode(row.id_reimburse, approval.token_korwil)) : null,
    idCabang: event.id_cabang,
    namaCabang: cabang?.namacabang ?? '',
    kota: cabang?.namacabang ? levelupKota(cabang.namacabang) : '-',
    namaEvent: event.nama_event,
    tanggal: formatTanggalEvent(iso(event.tglevent), iso(event.tgleventselesai)),
    tempat: event.jenisevent === 'Online' ? 'Online' : event.alamatevent || '-',
    hadir,
    dana: danaNumber(row.danausul),
    stage,
    rejection: reimburseRejection(row),
    review: reimburseReview(row),
    reimburse: {
      danausul: row.danausul,
      danariil: row.danariil,
      namabank: row.namabank,
      norek: row.norek,
      namarek: row.namarek,
      bukti: row.bukti,
      laporan: row.laporan,
      buktitf: row.buktitf,
    },
    korwil,
    at: {
      diajukan: fmtWib(approval?.created_at),
      sekre: fmtWib(approval?.sekre_at),
      brim: fmtWib(approval?.brim_at),
      korwil: fmtWib(approval?.korwil_at),
      pic: fmtWib(approval?.pic_at),
      cair: fmtWib(approval?.cair_at),
      notifPic: fmtWib(approval?.notif_pic_at),
      notifKeuangan: fmtWib(approval?.notif_keuangan_at),
    },
    surat: buildSuratKeuangan({
      event: {
        nama_event: event.nama_event,
        tglMulai: iso(event.tglevent),
        tglSelesai: iso(event.tgleventselesai),
        alamatevent: event.alamatevent,
        jenisevent: event.jenisevent,
      },
      cabang,
      reimburse: row,
      jumlahHadir: hadir,
    }),
    approvals: {
      korwil: row.approvepphtgd === '1' ? stamp(approval?.korwil_at) : null,
      pic: row.approvenasional === '1' ? stamp(approval?.pic_at) : null,
      keuangan: row.approvekeuangan === '1' && approval?.cair_at ? `Sudah ditransfer · ${fmtWib(approval.cair_at)}` : null,
    },
  }
}

function tokensOf(approval: ApprovalRow | null): DanaTokens | null {
  return approval
    ? { token_korwil: approval.token_korwil, token_pic: approval.token_pic, token_keuangan: approval.token_keuangan }
    : null
}

/** One row per event (enforced by findFirst, like submitReimburse). Tokens are secrets: pass only to authorized UIs. */
export async function loadDanaByEvent(idEvent: number): Promise<{ view: DanaView; tokens: DanaTokens | null } | null> {
  const row = await db.reimburse.findFirst({ where: { id_event: String(idEvent) } })
  if (!row) return null
  const approval = await db.reimburse_approval.findUnique({ where: { id_reimburse: row.id_reimburse } })
  const view = await buildView(row, approval)
  return view ? { view, tokens: tokensOf(approval) } : null
}

/** Resolve a no-login link. null = token unknown (also when a resubmit replaced it). */
export async function loadDanaByToken(
  token: string,
): Promise<{ peran: DanaPeran; view: DanaView; tokens: DanaTokens } | null> {
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) return null
  const approval = await db.reimburse_approval.findFirst({
    where: { OR: [{ token_korwil: token }, { token_pic: token }, { token_keuangan: token }] },
  })
  if (!approval) return null
  const peran: DanaPeran =
    approval.token_korwil === token ? 'korwil' : approval.token_pic === token ? 'pic' : 'keuangan'
  const row = await db.reimburse.findUnique({ where: { id_reimburse: approval.id_reimburse } })
  if (!row) return null
  const view = await buildView(row, approval)
  return view ? { peran, view, tokens: tokensOf(approval)! } : null
}

/** Halaman publik /verifikasi/{kode} (QR di kotak TTD). null = kode salah atau pengajuan sudah disubmit ulang. */
export async function loadDanaByVerifikasi(kode: string): Promise<DanaView | null> {
  const parsed = parseVerifikasiKode(kode)
  if (!parsed) return null
  const approval = await db.reimburse_approval.findUnique({ where: { id_reimburse: parsed.idReimburse } })
  if (!approval || !cekVerifikasiHash(parsed.hash, approval.token_korwil)) return null
  const row = await db.reimburse.findUnique({ where: { id_reimburse: approval.id_reimburse } })
  return row ? buildView(row, approval) : null
}
