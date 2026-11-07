'use server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { setActor } from '@/lib/request-context'
import { requireSekretariatNasional } from '@/lib/actions/event'
import { getPengurusFromCookie } from '@/lib/pengurus-session'
import { isNasionalAdmin, resolveEventCabang } from '@/lib/event-cabang'
import { wibToday } from '@/lib/wib'
import { loadDanaByEvent, type DanaView } from '@/lib/dana-approval'
import { danaLinkUrl, korwilWaText, korwilWaUrl, newDanaTokens } from '@/lib/dana-link'
import { danaTelegram, revalidateDana, sendDanaGroupNotif } from '@/lib/dana-flow'
import { listKorwilPphtgd } from '@/lib/pphtgd-korwil'
import { matchKorwil, type KorwilOption } from '@/lib/surat-keuangan-data'
import {
  AJUKAN_VALUES,
  isReimburseLocked,
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
 * Ajukan = snapshot korwil PPHTGD + token link baru (link lama mati) dan alur mulai lagi dari Korwil.
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

  if (korwil) {
    const res = await loadDanaByEvent(idEvent)
    if (res) await danaTelegram(res.view, 'Dana Diajukan ke Korwil')
  }
}

export type DanaKorwilPick = { options: KorwilOption[]; defaultId: number | null; error: string | null }

/** Isi Kartu "Kirim ke Korwil": link korwil + wa.me. Link PIC/Keuangan tidak pernah dikirim ke ALK Kota. */
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

  const [res, list, cabang] = await Promise.all([
    loadDanaByEvent(idEvent),
    listKorwilPphtgd(),
    Number(event.id_cabang) > 0
      ? db.cabang.findUnique({ where: { id_cabang: Number(event.id_cabang) }, select: { namacabang: true } })
      : Promise.resolve(null),
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
  }
}

export type ReimburseApprovalResult = { ok: true } | { ok: false; error: string }

// ── Sekretariat v2: daftar, review dan pencairan ─────────────────────────────

export type ReimburseListItem = {
  id_event: number
  nama_event: string
  tglDisplay: string
  namaCabang: string
  stage: ReimburseStage
  danausul: string
  /** Alasan tolak (Korwil atau PIC LevelUP); '' kalau tidak ditolak */
  alasanTolak: string
}

const tglShort = (d: Date) =>
  d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

async function getAlkSession() {
  const p = await getPengurusFromCookie()
  if (!p || p.divisi !== 'alk') return null
  return { ...p, isNasional: isNasionalAdmin(p.username), cabang: resolveEventCabang(p) }
}

/** Nasional: semua pengajuan dana (semua kota). ALK Kota: event kotanya yang sudah berjalan, dengan status dana. */
export async function listReimburseSekretariat(): Promise<{ isNasional: boolean; items: ReimburseListItem[] } | null> {
  const me = await getAlkSession()
  if (!me) return null

  if (me.isNasional) {
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
        danausul: r.danausul,
        alasanTolak: reimburseRejection(r)?.alasan ?? '',
        sort: e.tglevent.getTime(),
      }]
    })
    // Yang masih berjalan (Korwil / PIC / Keuangan) di atas, lalu terbaru dulu.
    const open = (st: ReimburseStage) => (st === 'korwil' || st === 'pusat' || st === 'keuangan' ? 0 : 1)
    items.sort((a, b) => open(a.stage) - open(b.stage) || b.sort - a.sort)
    return { isNasional: true, items: items.map(({ sort: _sort, ...i }) => i) }
  }

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
        danausul: r?.danausul ?? '',
        alasanTolak: reimburseRejection(r)?.alasan ?? '',
      }
    }),
  }
}

export type ReimburseReview = {
  view: DanaView
  /** Link langkah aktif (untuk disalin / dikirim ulang); null kalau langkahnya sudah lewat */
  links: { korwil: string | null; pic: string | null; keuangan: string | null }
  share: DanaKorwilShare | null
}

/** Sekretariat Nasional: tracker read-only satu pengajuan dana. null kalau bukan nasional / tidak ada pengajuan. */
export async function getReimburseReview(idEvent: number): Promise<ReimburseReview | null> {
  const gate = await requireSekretariatNasional()
  if (!gate.ok) return null
  const res = await loadDanaByEvent(idEvent)
  if (!res || res.view.stage === 'belum' || res.view.stage === 'tanpa_dana') return null
  const { view, tokens } = res
  return {
    view,
    links: {
      korwil: tokens && view.stage === 'korwil' ? danaLinkUrl(tokens.token_korwil) : null,
      pic: tokens && view.stage === 'pusat' ? danaLinkUrl(tokens.token_pic) : null,
      keuangan: tokens && view.stage === 'keuangan' ? danaLinkUrl(tokens.token_keuangan) : null,
    },
    share: tokens && view.stage === 'korwil' ? korwilShare(view, tokens.token_korwil) : null,
  }
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
