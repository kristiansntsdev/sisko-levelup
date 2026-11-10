'use server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { setActor } from '@/lib/request-context'
import { requireSekretariatNasional } from '@/lib/actions/event'
import { getPengurusFromCookie } from '@/lib/pengurus-session'
import { isNasionalAdmin, isNasionalBrim, resolveEventCabang } from '@/lib/event-cabang'
import { brimNasionalActor } from '@/lib/brim-auth'
import { wibToday } from '@/lib/wib'
import { loadDanaByEvent, type DanaView } from '@/lib/dana-approval'
import { danaLinkUrl, korwilWaText, korwilWaUrl, newDanaTokens, reviewVersi } from '@/lib/dana-link'
import { danaTelegram, revalidateDana, sendDanaGroupNotif } from '@/lib/dana-flow'
import { listKorwilPphtgd } from '@/lib/pphtgd-korwil'
import { matchKorwil, type KorwilOption } from '@/lib/surat-keuangan-data'
import {
  AJUKAN_VALUES,
  isReimburseLocked,
  reimbursePic,
  reimburseRejection,
  reimburseStage,
  type ReimburseStage,
} from '@/lib/reimburse-stage'

export type ReimburseData = {
  id_reimburse: number
  id_event: string
  ajukan: string
  namabank: string
  norek: string
  namarek: string
  danausul: string
  danariil: string
  laporan: string
  bukti: string
  approvesekre: string
  notesekre: string
  approvebrim: string
  notebrim: string
  approvepphtgd: string
  notepphtgd: string
  approvenasional: string
  notenasional: string
  approvekeuangan: string
  buktitf: string
}

function toReimburseData(r: {
  id_reimburse: number
  id_event: string
  ajukan: string
  namabank: string
  norek: string
  namarek: string
  danausul: string
  danariil: string
  laporan: string
  bukti: string
  approvesekre: string
  notesekre: string
  approvebrim: string
  notebrim: string
  approvepphtgd: string
  notepphtgd: string
  approvenasional: string
  notenasional: string
  approvekeuangan: string
  buktitf: string
}): ReimburseData {
  return {
    id_reimburse: r.id_reimburse,
    id_event: r.id_event,
    ajukan: r.ajukan,
    namabank: r.namabank,
    norek: r.norek,
    namarek: r.namarek,
    danausul: r.danausul,
    danariil: r.danariil,
    laporan: r.laporan,
    bukti: r.bukti,
    approvesekre: r.approvesekre,
    notesekre: r.notesekre,
    approvebrim: r.approvebrim,
    notebrim: r.notebrim,
    approvepphtgd: r.approvepphtgd,
    notepphtgd: r.notepphtgd,
    approvenasional: r.approvenasional,
    notenasional: r.notenasional,
    approvekeuangan: r.approvekeuangan,
    buktitf: r.buktitf,
  }
}

export async function getReimburseForEvent(idEvent: number): Promise<ReimburseData | null> {
  const row = await db.reimburse.findFirst({ where: { id_event: String(idEvent) } })
  return row ? toReimburseData(row) : null
}

async function requireAlkPengurus(): Promise<void> {
  const pengurusId = (await cookies()).get('pengurus_id')?.value
  if (!pengurusId) throw new Error('Unauthorized')
  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { divisi: true, username: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk') throw new Error('Unauthorized')
  setActor({ type: 'pengurus', id: Number(pengurusId), label: pengurus.username })
}

export type SubmitReimburseInput = {
  ajukan: 'Ajukan' | 'Tidak Ajukan'
  bukti: string
  laporan: string
  danausul: string
  danariil: string
  norek: string
  namabank: string
  namarek: string
  /** Korwil PPHTGD (id dari API pphtgd); wajib kalau ajukan = Ajukan */
  korwilId: number | null
}

/**
 * ALK Kota: create/update pengajuan support dana untuk satu event (satu baris per event).
 * Ajukan = snapshot korwil PPHTGD + token link baru (link lama mati) dan alur mulai lagi dari review
 * Sekretariat & BRIM Nasional; link Korwil baru dibagikan setelah keduanya setuju.
 */
export async function submitReimburse(idEvent: number, input: SubmitReimburseInput): Promise<void> {
  await requireAlkPengurus()

  const existing = await db.reimburse.findFirst({ where: { id_event: String(idEvent) } })
  if (existing && isReimburseLocked(reimburseStage(existing))) {
    throw new Error('Pengajuan sudah disetujui Korwil, tidak bisa diedit')
  }

  // Data korwil diambil ulang dari pphtgd, bukan dari client.
  let korwil: KorwilOption | null = null
  if (input.ajukan === 'Ajukan') {
    if (!input.korwilId) throw new Error('Pilih Korwil PPHTGD dulu')
    const list = await listKorwilPphtgd()
    if (!list.ok) throw new Error('Data korwil PPHTGD tidak bisa dimuat, coba lagi')
    korwil = list.korwil.find((k) => k.id === input.korwilId) ?? null
    if (!korwil) throw new Error('Korwil tidak ditemukan di PPHTGD, pilih ulang')
  }

  const laporan = input.laporan.trim()
  const data = {
    id_event: String(idEvent),
    ajukan: input.ajukan,
    bukti: input.bukti.trim(),
    laporan,
    // Form Monitoring H+14: waktu LPJ pertama kali diisi. Baris lama yang sudah
    // berisi laporan tanpa laporan_at tetap NULL (tidak tercatat), bukan "sekarang".
    laporan_at: !laporan ? null : existing?.laporan ? existing.laporan_at : new Date(),
    danausul: input.danausul,
    danariil: input.danariil,
    norek: input.norek.trim(),
    namabank: input.namabank.trim(),
    namarek: input.namarek.trim(),
    approvesekre: '',
    notesekre: '',
    approvebrim: '',
    notebrim: '',
    approvepphtgd: '',
    notepphtgd: '',
    approvenasional: '',
    notenasional: '',
    approvekeuangan: '',
    buktitf: '',
  }

  await db.$transaction(async (tx) => {
    const row = existing
      ? await tx.reimburse.update({ where: { id_reimburse: existing.id_reimburse }, data })
      : await tx.reimburse.create({
          data: {
            ...data,
            reimburse: '',
            notekeuangan: '',
            approveadmin: '',
            noteadmin: '',
          },
        })
    if (!korwil) {
      await tx.reimburse_approval.deleteMany({ where: { id_reimburse: row.id_reimburse } })
      return
    }
    const snapshot = {
      korwil_id: korwil.id,
      korwil_nama: korwil.nama,
      korwil_koordinator: korwil.koordinator ?? '',
      korwil_wa: korwil.wa,
      ...newDanaTokens(),
      sekre_at: null,
      brim_at: null,
      korwil_at: null,
      pic_at: null,
      cair_at: null,
      notif_pic_at: null,
      notif_keuangan_at: null,
    }
    await tx.reimburse_approval.upsert({
      where: { id_reimburse: row.id_reimburse },
      create: { id_reimburse: row.id_reimburse, ...snapshot },
      update: snapshot,
    })
  })

  revalidateDana(idEvent)

  const event = await db.event.findUnique({ where: { id_event: idEvent }, select: { id_cabang: true } })
  if (event) await saveRekeningKota(event.id_cabang, data)

  if (korwil) {
    const res = await loadDanaByEvent(idEvent)
    if (res) await danaTelegram(res.view, 'Dana Diajukan', { Menunggu: 'Review Sekretariat & BRIM Nasional' })
  }
}

/** Rekening tersimpan LevelUP Kota (tabel rekening_kota), terbaru dipakai dulu. */
export type SavedRekening = { norek: string; namabank: string; namarek: string }

/** No rekening sebagai kunci cache: tanpa spasi, titik, strip ("123 456-7" = "1234567"). */
const rekeningKey = (norek: string) => norek.replace(/[\s.-]/g, '')

/**
 * Cache rekening per LevelUP Kota setiap form dana disimpan. Cache saja: gagal tulis tidak membatalkan
 * pengajuan yang sudah tersimpan di reimburse.
 */
async function saveRekeningKota(
  idCabang: string,
  r: { norek: string; namabank: string; namarek: string },
): Promise<void> {
  const norek = rekeningKey(r.norek)
  if (!idCabang || !norek || norek.length > 64) return
  const fields = { namabank: r.namabank.slice(0, 100), namarek: r.namarek.slice(0, 255), used_at: new Date() }
  try {
    await db.rekening_kota.upsert({
      where: { id_cabang_norek: { id_cabang: idCabang, norek } },
      create: { id_cabang: idCabang, norek, ...fields },
      update: fields,
    })
  } catch (err) {
    console.error('[rekening_kota] gagal simpan', err)
  }
}

async function listRekeningKota(idCabang: string): Promise<SavedRekening[]> {
  if (!idCabang) return []
  try {
    return await db.rekening_kota.findMany({
      where: { id_cabang: idCabang },
      orderBy: { used_at: 'desc' },
      take: 5,
      select: { norek: true, namabank: true, namarek: true },
    })
  } catch (err) {
    console.error('[rekening_kota] gagal baca', err)
    return []
  }
}

export type DanaKorwilPick = { options: KorwilOption[]; defaultId: number | null; error: string | null }

/** Isi Kartu "Kirim ke Korwil" (setelah Sekretariat & BRIM setuju): link korwil + wa.me. Link PIC/Keuangan tidak pernah dikirim ke ALK Kota. */
export type DanaKorwilShare = {
  korwil: KorwilOption
  link: string
  waUrl: string | null
  waText: string
}

export type DanaForm = {
  view: DanaView | null
  share: DanaKorwilShare | null
  korwil: DanaKorwilPick
  /** Rekening yang pernah dipakai LevelUP Kota event ini, terbaru dulu (maks 5) */
  rekening: SavedRekening[]
}

function korwilShare(view: DanaView, tokenKorwil: string): DanaKorwilShare | null {
  if (!view.korwil) return null
  const link = danaLinkUrl(tokenKorwil)
  const waText = korwilWaText({
    koordinator: view.korwil.koordinator ?? '',
    kota: view.kota,
    event: view.namaEvent,
    tanggal: view.tanggal,
    link,
  })
  return { korwil: view.korwil, link, waText, waUrl: korwilWaUrl(view.korwil.wa, waText) }
}

/** Form dana ALK Kota: status alur + pilihan korwil (default = korwil yang namanya sama dengan LevelUP Kota). */
export async function getDanaForm(idEvent: number): Promise<DanaForm | null> {
  const me = await getAlkSession()
  if (!me) return null
  const event = await db.event.findUnique({ where: { id_event: idEvent }, select: { id_cabang: true } })
  if (!event || (!me.isNasional && event.id_cabang !== me.cabang)) return null

  const [res, list, cabang, rekening] = await Promise.all([
    loadDanaByEvent(idEvent),
    listKorwilPphtgd(),
    Number(event.id_cabang) > 0
      ? db.cabang.findUnique({ where: { id_cabang: Number(event.id_cabang) }, select: { namacabang: true } })
      : Promise.resolve(null),
    listRekeningKota(event.id_cabang),
  ])
  const options = list.ok ? list.korwil : []
  const view = res?.view ?? null
  return {
    view,
    share: view && res?.tokens && view.stage === 'korwil' ? korwilShare(view, res.tokens.token_korwil) : null,
    korwil: {
      options,
      defaultId: view?.korwil?.id ?? matchKorwil(options, cabang?.namacabang ?? ''),
      error: list.ok ? null : list.error,
    },
    rekening,
  }
}

export type ReimburseApprovalResult = { ok: true } | { ok: false; error: string }

// ── Sekretariat + BRIM v2: daftar, review Nasional dan tracker ──────────────────

export type ReimburseListItem = {
  id_event: number
  nama_event: string
  tglDisplay: string
  namaCabang: string
  stage: ReimburseStage
  /** Pemegang langkah sekarang (di review: pihak yang belum memutuskan) */
  pic: string
  /** Menunggu keputusan pengguna yang membuka daftar ini (Sekretariat / BRIM Nasional) */
  perluReview: boolean
  danausul: string
  /** Alasan tolak (Sekretariat / BRIM / Korwil / PIC LevelUP); '' kalau tidak ditolak */
  alasanTolak: string
}

const tglShort = (d: Date) =>
  d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

async function getAlkSession() {
  const p = await getPengurusFromCookie()
  if (!p || p.divisi !== 'alk') return null
  return { ...p, isNasional: isNasionalAdmin(p.username), cabang: resolveEventCabang(p) }
}

async function isBrimNasionalSession(): Promise<boolean> {
  const p = await getPengurusFromCookie()
  return !!p && p.divisi === 'brim' && isNasionalBrim(p.username)
}

export type ReviewPihak = 'sekre' | 'brim'
const REVIEW_LABEL: Record<ReviewPihak, string> = { sekre: 'Sekretariat Nasional', brim: 'BRIM Nasional' }

type ReviewRow = { approvesekre: string; approvebrim: string; approvepphtgd: string; approvenasional: string; approvekeuangan: string; ajukan: string }
const menungguPihak = (r: ReviewRow, pihak: ReviewPihak) =>
  reimburseStage(r) === 'review' && (pihak === 'sekre' ? r.approvesekre : r.approvebrim) === ''

/** Semua pengajuan dana (semua kota) untuk Sekretariat / BRIM Nasional; yang masih berjalan di atas, terbaru dulu. */
async function listSemuaPengajuan(pihak: ReviewPihak): Promise<ReimburseListItem[]> {
  const rows = await db.reimburse.findMany({ where: { ajukan: { in: AJUKAN_VALUES } } })
  const ids = rows.map((r) => Number(r.id_event)).filter((n) => Number.isInteger(n))
  const events = ids.length
    ? await db.event.findMany({
        where: { id_event: { in: ids } },
        select: { id_event: true, nama_event: true, tglevent: true, id_cabang: true },
      })
    : []
  const cabangIds = [...new Set(events.map((e) => Number(e.id_cabang)).filter((n) => n > 0))]
  const cabang = cabangIds.length
    ? await db.cabang.findMany({ where: { id_cabang: { in: cabangIds } }, select: { id_cabang: true, namacabang: true } })
    : []
  const nama = new Map(cabang.map((c) => [String(c.id_cabang), c.namacabang]))
  const byId = new Map(events.map((e) => [String(e.id_event), e]))
  const items = rows.flatMap((r): (ReimburseListItem & { sort: number })[] => {
    const e = byId.get(r.id_event)
    if (!e) return []
    return [{
      id_event: e.id_event,
      nama_event: e.nama_event,
      tglDisplay: tglShort(e.tglevent),
      namaCabang: nama.get(e.id_cabang) ?? '-',
      stage: reimburseStage(r),
      pic: reimbursePic(r),
      perluReview: menungguPihak(r, pihak),
      danausul: r.danausul,
      alasanTolak: reimburseRejection(r)?.alasan ?? '',
      sort: e.tglevent.getTime(),
    }]
  })
  const open = (st: ReimburseStage) => (st === 'review' || st === 'korwil' || st === 'pusat' || st === 'keuangan' ? 0 : 1)
  items.sort((a, b) => Number(b.perluReview) - Number(a.perluReview) || open(a.stage) - open(b.stage) || b.sort - a.sort)
  return items.map(({ sort: _sort, ...i }) => i)
}

/** Nasional: semua pengajuan dana (semua kota). ALK Kota: event kotanya yang sudah berjalan, dengan status dana. */
export async function listReimburseSekretariat(): Promise<{ isNasional: boolean; items: ReimburseListItem[] } | null> {
  const me = await getAlkSession()
  if (!me) return null

  if (me.isNasional) return { isNasional: true, items: await listSemuaPengajuan('sekre') }

  const events = await db.event.findMany({
    where: { id_cabang: me.cabang, tglevent: { lte: wibToday() } },
    orderBy: { tglevent: 'desc' },
    select: { id_event: true, nama_event: true, tglevent: true },
  })
  const rows = events.length
    ? await db.reimburse.findMany({ where: { id_event: { in: events.map((e) => String(e.id_event)) } } })
    : []
  const byEvent = new Map(rows.map((r) => [r.id_event, r]))
  const cabangRow = await db.cabang.findUnique({
    where: { id_cabang: Number(me.cabang) },
    select: { namacabang: true },
  })
  return {
    isNasional: false,
    items: events.map((e) => {
      const r = byEvent.get(String(e.id_event))
      return {
        id_event: e.id_event,
        nama_event: e.nama_event,
        tglDisplay: tglShort(e.tglevent),
        namaCabang: cabangRow?.namacabang ?? '-',
        stage: reimburseStage(r),
        pic: reimbursePic(r),
        perluReview: false,
        danausul: r?.danausul ?? '',
        alasanTolak: reimburseRejection(r)?.alasan ?? '',
      }
    }),
  }
}

/**
 * ALK Kota: pengajuan yang sudah lolos review Sekretariat & BRIM tapi belum diputuskan Korwil (link perlu dikirim).
 * Hanya yang benar-benar melewati review (sekre_at + brim_at terisi): pengajuan lama yang di-backfill saat migrasi
 * sudah dikirim ke Korwil sebelumnya.
 */
export async function countDanaSiapKorwil(): Promise<number> {
  const me = await getAlkSession()
  if (!me || me.isNasional) return 0
  const approvals = await db.reimburse_approval.findMany({
    where: { sekre_at: { not: null }, brim_at: { not: null }, korwil_at: null },
    select: { id_reimburse: true },
  })
  if (!approvals.length) return 0
  const rows = await db.reimburse.findMany({
    where: {
      id_reimburse: { in: approvals.map((a) => a.id_reimburse) },
      ajukan: { in: AJUKAN_VALUES },
      approvesekre: '1',
      approvebrim: '1',
      approvepphtgd: '',
      approvenasional: '',
    },
    select: { id_event: true },
  })
  const ids = rows.map((r) => Number(r.id_event)).filter((n) => Number.isInteger(n))
  if (!ids.length) return 0
  return db.event.count({ where: { id_event: { in: ids }, id_cabang: me.cabang } })
}

/** BRIM Nasional: semua pengajuan dana, yang menunggu review BRIM di atas. null kalau bukan BRIM Nasional. */
export async function listReimburseBrim(): Promise<ReimburseListItem[] | null> {
  if (!(await isBrimNasionalSession())) return null
  return listSemuaPengajuan('brim')
}

/** Jumlah pengajuan yang menunggu keputusan Sekretariat / BRIM Nasional (badge + Perlu Tindakan Beranda). */
export async function countPendingDanaReview(pihak: ReviewPihak): Promise<number> {
  const allowed = pihak === 'sekre' ? (await getAlkSession())?.isNasional : await isBrimNasionalSession()
  if (!allowed) return 0
  return db.reimburse.count({
    where: {
      ajukan: { in: AJUKAN_VALUES },
      approvenasional: '',
      approvepphtgd: '',
      ...(pihak === 'sekre'
        ? { approvesekre: '', approvebrim: { not: '0' } }
        : { approvebrim: '', approvesekre: { not: '0' } }),
    },
  })
}

export type ReimburseReview = {
  view: DanaView
  /** Siapa yang membuka review: Sekretariat Nasional (link + kirim ulang notif) atau BRIM Nasional (tanpa link) */
  role: ReviewPihak
  /** Pengguna ini masih harus Approve / Tolak di langkah review */
  bisaReview: boolean
  /** Versi pengajuan yang sedang dilihat; keputusan ditolak kalau ALK Kota sudah mengajukan ulang */
  versi: string
  /** Link langkah aktif (untuk disalin / dikirim ulang); null kalau langkahnya sudah lewat atau untuk BRIM */
  links: { korwil: string | null; pic: string | null; keuangan: string | null }
  share: DanaKorwilShare | null
}

async function buildReview(idEvent: number, role: ReviewPihak): Promise<ReimburseReview | null> {
  const res = await loadDanaByEvent(idEvent)
  if (!res || res.view.stage === 'belum' || res.view.stage === 'tanpa_dana') return null
  const { view, tokens } = res
  const sekre = role === 'sekre'
  return {
    view,
    role,
    bisaReview: view.stage === 'review' && view.review[role] === 'menunggu',
    versi: tokens ? reviewVersi(tokens.token_korwil) : '',
    links: {
      korwil: sekre && tokens && view.stage === 'korwil' ? danaLinkUrl(tokens.token_korwil) : null,
      pic: sekre && tokens && view.stage === 'pusat' ? danaLinkUrl(tokens.token_pic) : null,
      keuangan: sekre && tokens && view.stage === 'keuangan' ? danaLinkUrl(tokens.token_keuangan) : null,
    },
    share: sekre && tokens && view.stage === 'korwil' ? korwilShare(view, tokens.token_korwil) : null,
  }
}

/** Sekretariat Nasional: tracker satu pengajuan dana + Approve / Tolak di langkah review. null kalau bukan nasional / tidak ada pengajuan. */
export async function getReimburseReview(idEvent: number): Promise<ReimburseReview | null> {
  const gate = await requireSekretariatNasional()
  if (!gate.ok) return null
  return buildReview(idEvent, 'sekre')
}

/** BRIM Nasional: sama dengan review Sekretariat, tanpa link tanpa-login dan tanpa kirim ulang notif. */
export async function getReimburseReviewBrim(idEvent: number): Promise<ReimburseReview | null> {
  if (!(await isBrimNasionalSession())) return null
  return buildReview(idEvent, 'brim')
}

const MAX_ALASAN = 1000

/**
 * Review Sekretariat / BRIM Nasional sebelum Korwil (urutan bebas). Tolak = kembali ke ALK Kota.
 * Tulisan kondisional pada langkah aktif + versi pengajuan (token_korwil) supaya double tap atau tab lama
 * tidak memutuskan dua kali / memutuskan data yang sudah diubah ALK Kota.
 */
async function decideReview(
  idEvent: number,
  pihak: ReviewPihak,
  versi: string,
  keputusan: 'setuju' | 'tolak',
  alasan: string | undefined,
): Promise<ReimburseApprovalResult> {
  const setuju = keputusan === 'setuju'
  const reason = setuju ? '' : (alasan ?? '').trim()
  if (!setuju && !reason) return { ok: false, error: 'Alasan penolakan wajib diisi' }
  if (reason.length > MAX_ALASAN) return { ok: false, error: `Alasan maksimal ${MAX_ALASAN} karakter` }

  const res = await loadDanaByEvent(idEvent)
  if (!res) return { ok: false, error: 'Pengajuan dana tidak ditemukan' }
  const { view, tokens } = res
  if (!tokens || reviewVersi(tokens.token_korwil) !== versi) {
    return { ok: false, error: 'Pengajuan sudah diubah ALK Kota. Muat ulang halaman untuk melihat data terbaru.' }
  }
  if (view.stage !== 'review' || view.review[pihak] !== 'menunggu') {
    return { ok: false, error: 'Pengajuan ini sudah diproses. Muat ulang halaman untuk melihat statusnya.' }
  }

  const idReimburse = view.idReimburse
  const after = await db.$transaction(async (tx) => {
    const still = await tx.reimburse_approval.findFirst({ where: { id_reimburse: idReimburse, token_korwil: tokens.token_korwil } })
    if (!still) return null
    const steps = { id_reimburse: idReimburse, ajukan: { in: AJUKAN_VALUES }, approvepphtgd: '', approvenasional: '' }
    const u = pihak === 'sekre'
      ? await tx.reimburse.updateMany({
          where: { ...steps, approvesekre: '', approvebrim: { not: '0' } },
          data: setuju ? { approvesekre: '1', notesekre: '' } : { approvesekre: '0', notesekre: reason },
        })
      : await tx.reimburse.updateMany({
          where: { ...steps, approvebrim: '', approvesekre: { not: '0' } },
          data: setuju ? { approvebrim: '1', notebrim: '' } : { approvebrim: '0', notebrim: reason },
        })
    if (!u.count) return null
    await tx.reimburse_approval.update({
      where: { id_reimburse: idReimburse },
      data: pihak === 'sekre' ? { sekre_at: new Date() } : { brim_at: new Date() },
    })
    // Dibaca setelah update di transaksi yang sama: kalau pihak lain menyetujui bersamaan, hanya satu yang melihat keduanya '1'.
    return tx.reimburse.findUnique({ where: { id_reimburse: idReimburse }, select: { approvesekre: true, approvebrim: true } })
  })
  if (!after) return { ok: false, error: 'Pengajuan ini sudah diproses. Muat ulang halaman untuk melihat statusnya.' }

  revalidateDana(idEvent)
  const fresh = await loadDanaByEvent(idEvent)
  if (fresh) {
    const label = REVIEW_LABEL[pihak]
    if (!setuju) await danaTelegram(fresh.view, `Dana Ditolak ${label}`, { Alasan: reason })
    else if (after.approvesekre === '1' && after.approvebrim === '1') {
      await danaTelegram(fresh.view, 'Dana Disetujui Sekretariat & BRIM', { Selanjutnya: 'ALK Kota kirim link ke Korwil' })
    } else {
      await danaTelegram(fresh.view, `Dana Disetujui ${label}`, { Menunggu: REVIEW_LABEL[pihak === 'sekre' ? 'brim' : 'sekre'] })
    }
  }
  return { ok: true }
}

/** Sekretariat Nasional: Approve / Tolak pengajuan dana sebelum dikirim ke Korwil. */
export async function decideDanaSekretariat(
  idEvent: number,
  versi: string,
  keputusan: 'setuju' | 'tolak',
  alasan?: string,
): Promise<ReimburseApprovalResult> {
  const gate = await requireSekretariatNasional()
  if (!gate.ok) return gate
  return decideReview(idEvent, 'sekre', versi, keputusan, alasan)
}

/** BRIM Nasional: Approve / Tolak pengajuan dana sebelum dikirim ke Korwil. */
export async function decideDanaBrim(
  idEvent: number,
  versi: string,
  keputusan: 'setuju' | 'tolak',
  alasan?: string,
): Promise<ReimburseApprovalResult> {
  if (!(await brimNasionalActor())) return { ok: false, error: 'Hanya BRIM Nasional yang bisa approve' }
  return decideReview(idEvent, 'brim', versi, keputusan, alasan)
}

/** Sekretariat Nasional: kirim ulang link langkah aktif (PIC / Keuangan) ke grup WA pphtgd, mis. setelah pphtgd down. */
export async function resendDanaNotif(idEvent: number): Promise<ReimburseApprovalResult> {
  const gate = await requireSekretariatNasional()
  if (!gate.ok) return gate
  let res = await loadDanaByEvent(idEvent)
  if (!res) return { ok: false, error: 'Pengajuan dana tidak ditemukan' }
  const stage = res.view.stage === 'pusat' ? 'pic' : res.view.stage === 'keuangan' ? 'keuangan' : null
  if (!stage) return { ok: false, error: 'Tidak ada notif grup untuk langkah ini' }
  // Pengajuan lama yang sudah disetujui Sekretariat Nasional sebelum alur link: buat link Keuangan sekarang
  // (korwil_id 0 = tidak ada snapshot korwil), supaya Keuangan tetap bisa menandai transfer.
  if (!res.tokens && stage === 'keuangan') {
    await db.reimburse_approval.create({
      data: { id_reimburse: res.view.idReimburse, korwil_id: 0, korwil_nama: '', ...newDanaTokens() },
    })
    res = await loadDanaByEvent(idEvent)
  }
  if (!res?.tokens) return { ok: false, error: 'Link pengajuan belum ada. ALK Kota perlu Ajukan ulang.' }
  const sent = await sendDanaGroupNotif(res.view, res.tokens, stage)
  if (!sent.ok) return { ok: false, error: `Gagal kirim ke pphtgd: ${sent.error}` }
  revalidateDana(idEvent)
  return { ok: true }
}
