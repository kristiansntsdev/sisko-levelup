'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { setActor } from '@/lib/request-context'
import { NASIONAL_EVENT_CABANG } from '@/lib/event-cabang'
import { requireSekretariatNasional } from '@/lib/actions/event'
import { getPengurusFromCookie } from '@/lib/pengurus-session'
import { isNasionalAdmin, resolveEventCabang } from '@/lib/event-cabang'
import { wibToday } from '@/lib/wib'
import { countHadirUnik } from '@/lib/surat-keuangan'
import { AJUKAN_VALUES, isAjukan, reimburseStage, type ReimburseStage } from '@/lib/reimburse-stage'
import { ALK_BASE } from '@/components/alk-v2/paths'
import {
  notifyTelegram,
  formatTelegramMessage,
  eventActionButtons,
  eventTelegramScope,
} from '@/lib/telegram'

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
  approvenasional: string
  notenasional: string
  approvekeuangan: string
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
  approvenasional: string
  notenasional: string
  approvekeuangan: string
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
    approvenasional: r.approvenasional,
    notenasional: r.notenasional,
    approvekeuangan: r.approvekeuangan,
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

function revalidateReimburseV2(idEvent: number) {
  revalidatePath(ALK_BASE)
  revalidatePath(`${ALK_BASE}/reimburse`)
  revalidatePath(`${ALK_BASE}/reimburse/${idEvent}`)
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
}

/** ALK Kota: create/update pengajuan support dana untuk satu event (satu baris per event). */
export async function submitReimburse(idEvent: number, input: SubmitReimburseInput): Promise<void> {
  await requireAlkPengurus()

  const existing = await db.reimburse.findFirst({ where: { id_event: String(idEvent) } })
  if (existing?.approvenasional === '1') {
    throw new Error('Pengajuan sudah disetujui, tidak bisa diedit')
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
    approvenasional: '',
    notenasional: '',
  }

  if (existing) {
    await db.reimburse.update({ where: { id_reimburse: existing.id_reimburse }, data })
  } else {
    await db.reimburse.create({
      data: {
        ...data,
        reimburse: '',
        approvepphtgd: '',
        approvekeuangan: '',
        notepphtgd: '',
        notekeuangan: '',
        approveadmin: '',
        noteadmin: '',
        buktitf: '',
      },
    })
  }

  revalidatePath(`/dashboard/kota/alk/event/${idEvent}`)
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}/dana`)
  revalidatePath('/dashboard/kota/alk')
  revalidateReimburseV2(idEvent)
}

async function telegramScopeForReimburseEvent(event: {
  id_cabang: string
  khusus: string | null
  tglevent: Date
  tgleventselesai: Date
}) {
  let cabangName: string | null = null
  if (event.id_cabang !== NASIONAL_EVENT_CABANG) {
    const cabangId = Number(event.id_cabang)
    if (Number.isFinite(cabangId)) {
      const row = await db.cabang.findUnique({
        where: { id_cabang: cabangId },
        select: { namacabang: true },
      })
      cabangName = row?.namacabang ?? null
    }
  }
  return eventTelegramScope({
    idCabang: event.id_cabang,
    khusus: event.khusus ?? '',
    cabangName,
    tglevent: event.tglevent,
    tgleventselesai: event.tgleventselesai,
  })
}

function fmtDanaTelegram(raw: string): string {
  const n = parseInt(String(raw).replace(/\D/g, ''), 10)
  return Number.isFinite(n) && n > 0 ? `Rp ${n.toLocaleString('id-ID')}` : '-'
}

export type ReimburseApprovalResult = { ok: true } | { ok: false; error: string }

/** Sekretariat Nasional approve pengajuan support dana → approvenasional = 1 */
export async function approveReimburseNasional(idReimburse: number): Promise<ReimburseApprovalResult> {
  const gate = await requireSekretariatNasional()
  if (!gate.ok) return gate

  const row = await db.reimburse.findUnique({ where: { id_reimburse: idReimburse } })
  if (!row) return { ok: false, error: 'Pengajuan dana tidak ditemukan' }

  await db.reimburse.update({ where: { id_reimburse: idReimburse }, data: { approvenasional: '1' } })

  const idEvent = Number(row.id_event)
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}`)
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}/approve`)
  revalidateReimburseV2(idEvent)

  const event = await db.event.findUnique({
    where: { id_event: idEvent },
    select: { nama_event: true, khusus: true, id_cabang: true, tglevent: true, tgleventselesai: true },
  })
  if (event) {
    const scope = await telegramScopeForReimburseEvent(event)
    void notifyTelegram(
      formatTelegramMessage({
        tag: scope.tag,
        action: 'Approved Dana',
        eventName: event.nama_event,
        fields: {
          ...scope.fields,
          'Pengajuan Dana': fmtDanaTelegram(row.danausul),
          'Dana Riil': fmtDanaTelegram(row.danariil),
          ID: idEvent,
        },
      }),
      { buttons: eventActionButtons(idEvent) },
    )
  }
  return { ok: true }
}

/** Sekretariat Nasional reject pengajuan support dana → approvenasional = 0, catat alasan */
export async function rejectReimburseNasional(
  idReimburse: number,
  alasan: string,
): Promise<ReimburseApprovalResult> {
  const gate = await requireSekretariatNasional()
  if (!gate.ok) return gate

  const reason = alasan.trim()
  if (!reason) return { ok: false, error: 'Alasan reject wajib diisi' }

  const row = await db.reimburse.findUnique({ where: { id_reimburse: idReimburse } })
  if (!row) return { ok: false, error: 'Pengajuan dana tidak ditemukan' }

  await db.reimburse.update({
    where: { id_reimburse: idReimburse },
    data: { approvenasional: '0', notenasional: reason },
  })

  const idEvent = Number(row.id_event)
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}`)
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}/approve`)
  revalidateReimburseV2(idEvent)

  const event = await db.event.findUnique({
    where: { id_event: idEvent },
    select: { nama_event: true, khusus: true, id_cabang: true, tglevent: true, tgleventselesai: true },
  })
  if (event) {
    const scope = await telegramScopeForReimburseEvent(event)
    void notifyTelegram(
      formatTelegramMessage({
        tag: scope.tag,
        action: 'Rejected Dana',
        eventName: event.nama_event,
        fields: { ...scope.fields, Alasan: reason, ID: idEvent },
      }),
      { buttons: eventActionButtons(idEvent) },
    )
  }
  return { ok: true }
}

// ── Sekretariat v2: daftar, review dan pencairan ─────────────────────────────

export type ReimburseListItem = {
  id_event: number
  nama_event: string
  tglDisplay: string
  namaCabang: string
  stage: ReimburseStage
  danausul: string
  notenasional: string
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
        notenasional: r.notenasional,
        sort: e.tglevent.getTime(),
      }]
    })
    items.sort((a, b) => (a.stage === 'pusat' ? 0 : 1) - (b.stage === 'pusat' ? 0 : 1) || b.sort - a.sort)
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
        notenasional: r?.notenasional ?? '',
      }
    }),
  }
}

export async function countPendingReimburseNasional(): Promise<number> {
  const me = await getAlkSession()
  if (!me?.isNasional) return 0
  return db.reimburse.count({ where: { ajukan: { in: AJUKAN_VALUES }, approvenasional: '' } })
}

export type ReimburseReview = {
  id_event: number
  nama_event: string
  tglDisplay: string
  namaCabang: string
  jumlahHadir: number
  reimburse: ReimburseData
}

/** Sekretariat Nasional: detail satu pengajuan dana. null kalau bukan nasional / tidak ada pengajuan. */
export async function getReimburseReview(idEvent: number): Promise<ReimburseReview | null> {
  const gate = await requireSekretariatNasional()
  if (!gate.ok) return null
  const [event, row] = await Promise.all([
    db.event.findUnique({
      where: { id_event: idEvent },
      select: { nama_event: true, tglevent: true, id_cabang: true },
    }),
    db.reimburse.findFirst({ where: { id_event: String(idEvent), ajukan: { in: AJUKAN_VALUES } } }),
  ])
  if (!event || !row) return null
  const cabang = Number(event.id_cabang) > 0
    ? await db.cabang.findUnique({ where: { id_cabang: Number(event.id_cabang) }, select: { namacabang: true } })
    : null
  return {
    id_event: idEvent,
    nama_event: event.nama_event,
    tglDisplay: tglShort(event.tglevent),
    namaCabang: cabang?.namacabang ?? '-',
    jumlahHadir: await countHadirUnik(idEvent),
    reimburse: toReimburseData(row),
  }
}

/** Sekretariat Nasional: tandai dana sudah ditransfer Keuangan → approvekeuangan = 1 */
export async function cairkanReimburseNasional(idReimburse: number): Promise<ReimburseApprovalResult> {
  const gate = await requireSekretariatNasional()
  if (!gate.ok) return gate

  const row = await db.reimburse.findUnique({ where: { id_reimburse: idReimburse } })
  if (!row) return { ok: false, error: 'Pengajuan dana tidak ditemukan' }
  if (row.approvenasional !== '1') return { ok: false, error: 'Dana belum disetujui' }

  await db.reimburse.update({ where: { id_reimburse: idReimburse }, data: { approvekeuangan: '1' } })

  const idEvent = Number(row.id_event)
  revalidateReimburseV2(idEvent)
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}`)

  const event = await db.event.findUnique({
    where: { id_event: idEvent },
    select: { nama_event: true, khusus: true, id_cabang: true, tglevent: true, tgleventselesai: true },
  })
  if (event) {
    const scope = await telegramScopeForReimburseEvent(event)
    void notifyTelegram(
      formatTelegramMessage({
        tag: scope.tag,
        action: 'Dana Cair',
        eventName: event.nama_event,
        fields: { ...scope.fields, 'Pengajuan Dana': fmtDanaTelegram(row.danausul), ID: idEvent },
      }),
      { buttons: eventActionButtons(idEvent) },
    )
  }
  return { ok: true }
}
