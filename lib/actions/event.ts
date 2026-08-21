'use server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { event_wwtype } from '@/lib/generated/enums'
import {
  resolveEventCabang,
  isNasionalAdmin,
  NASIONAL_EVENT_CABANG,
} from '@/lib/event-cabang'
import { appendNotenasional } from '@/lib/event-approval'
import { formatTelegramMessage, nasionalScopeLabel, notifyTelegram } from '@/lib/telegram'

const POSTER_BASE = 'https://sisko.levelupgen.com/uploads/poster/'

export type EventSummary = {
  id_event: number
  nama_event: string
  tglDisplay: string
  jamevent: string
  posterUrl: string
}

export type CabangOption = { id: string; nama: string }

export async function getCabangs(): Promise<CabangOption[]> {
  const rows = await db.cabang.findMany({
    select: { id_cabang: true, namacabang: true },
    orderBy: { namacabang: 'asc' },
  })
  return rows.map((r) => ({ id: String(r.id_cabang), nama: r.namacabang }))
}

export type EventListItem = {
  id_event: number
  tglDisplay: string
  jamevent: string
  posterUrl: string
  tglMs: number
}

export async function getEventsByKotalevelup(
  kotalevelup: string,
  page: number,
): Promise<{ events: EventListItem[]; total: number }> {
  const PAGE_SIZE = 10
  const [rows, total] = await Promise.all([
    db.event.findMany({
      where: { id_cabang: kotalevelup },
      orderBy: { id_event: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id_event: true, tglevent: true, jamevent: true, posterevent: true },
    }),
    db.event.count({ where: { id_cabang: kotalevelup } }),
  ])
  return {
    events: rows.map((e) => ({
      id_event: e.id_event,
      tglDisplay: e.tglevent.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      }),
      jamevent: e.jamevent,
      posterUrl: `${POSTER_BASE}${e.posterevent}`,
      tglMs: e.tglevent.getTime(),
    })),
    total,
  }
}

export type EventFull = EventListItem & { nama_event: string }

export async function getEventsByKotalevelupFull(
  kotalevelup: string,
  page: number,
): Promise<{ events: EventFull[]; total: number }> {
  const PAGE_SIZE = 10
  const [rows, total] = await Promise.all([
    db.event.findMany({
      where: { id_cabang: kotalevelup },
      orderBy: { id_event: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id_event: true, nama_event: true, tglevent: true, jamevent: true, posterevent: true },
    }),
    db.event.count({ where: { id_cabang: kotalevelup } }),
  ])
  return {
    events: rows.map((e) => ({
      id_event: e.id_event,
      nama_event: e.nama_event,
      tglDisplay: e.tglevent.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      }),
      jamevent: e.jamevent,
      posterUrl: `${POSTER_BASE}${e.posterevent}`,
      tglMs: e.tglevent.getTime(),
    })),
    total,
  }
}

export type EventDashboard = {
  id_event: number
  nama_event: string
  tglMs: number
  tglDisplay: string
  jamevent: string
  alamatevent: string
  posterUrl: string
  approvenasional: string
  notenasional: string
  khusus: string
}

export async function getAllEventsByKotalevelup(
  kotalevelup: string,
): Promise<EventDashboard[]> {
  const rows = await db.event.findMany({
    where: { id_cabang: kotalevelup },
    orderBy: { tglevent: 'desc' },
    select: {
      id_event: true, nama_event: true,
      tglevent: true, jamevent: true, alamatevent: true, posterevent: true,
      approvenasional: true, notenasional: true, khusus: true,
    },
  })
  return rows.map((e) => ({
    id_event: e.id_event,
    nama_event: e.nama_event,
    tglMs: e.tglevent.getTime(),
    tglDisplay: e.tglevent.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
    jamevent: e.jamevent,
    alamatevent: e.alamatevent,
    posterUrl: `${POSTER_BASE}${e.posterevent}`,
    approvenasional: e.approvenasional,
    notenasional: e.notenasional ?? '',
    khusus: e.khusus,
  }))
}

export type EventLocation = { longlatevent: string; radius: number }

export async function getEventLocation(id: number): Promise<EventLocation | null> {
  const event = await db.event.findUnique({
    where: { id_event: id },
    select: { longlatevent: true, radius: true },
  })
  if (!event) return null
  return { longlatevent: event.longlatevent, radius: event.radius }
}

export type RegistrasiRow = {
  id_registrasi: number
  nama: string
  email: string
  gereja: string
}

export type AbsenRow = {
  id_absen: number
  nama: string
  email: string
  userlevel: string
  timestamp: string
}

export type EventDetailFull = {
  id_event: number
  nama_event: string
  tglDisplay: string
  tglSelesaiDisplay: string
  tglRaw: string
  tglSelesaiRaw: string
  jamevent: string
  jamselesaievent: string
  alamatevent: string
  danaevent: string
  posterUrl: string
  jenisevent: string
  wwtype: event_wwtype
  linkevent: string
  longlatevent: string
  radius: number
  approvenasional: string
  notenasional: string
  targetjumlah: number
  target: string
  targetpengurus: string
  suratpemberitahuan: string
  khusus: string
  registrasi: RegistrasiRow[]
  absen: AbsenRow[]
}

export async function getEventDetail(id: number): Promise<EventDetailFull | null> {
  const event = await db.event.findUnique({
    where: { id_event: id },
    select: {
      id_event: true, nama_event: true,
      tglevent: true, tgleventselesai: true,
      jamevent: true, jamselesaievent: true,
      alamatevent: true, danaevent: true, posterevent: true,
      jenisevent: true, wwtype: true, linkevent: true, longlatevent: true,
      radius: true, approvenasional: true, notenasional: true, targetjumlah: true,
      target: true, targetpengurus: true, suratpemberitahuan: true, khusus: true,
      registrasi: {
        select: {
          id_registrasi: true,
          peserta: { select: { nama: true, email: true, gereja: true } },
        },
      },
    },
  })
  if (!event) return null

  const absenRows = await db.absen.findMany({
    where: {
      OR: [{ id_event_int: id }, { id_event: String(id) }],
    },
    orderBy: { timestamp: 'asc' },
    select: { id_absen: true, id_peserta: true, email: true, timestamp: true },
  })

  const pesertaIds = [...new Set(absenRows.map((a) => parseInt(a.id_peserta, 10)).filter((n) => !isNaN(n)))]
  const pesertaList = pesertaIds.length
    ? await db.peserta.findMany({
        where: { id_peserta: { in: pesertaIds } },
        select: { id_peserta: true, nama: true, userlevel: true },
      })
    : []
  const pesertaMap = new Map(pesertaList.map((p) => [String(p.id_peserta), p]))

  return {
    id_event: event.id_event,
    nama_event: event.nama_event,
    tglDisplay: event.tglevent.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
    tglSelesaiDisplay: event.tgleventselesai.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
    tglRaw: event.tglevent.toISOString().split('T')[0],
    tglSelesaiRaw: event.tgleventselesai.toISOString().split('T')[0],
    jamevent: event.jamevent,
    jamselesaievent: event.jamselesaievent,
    alamatevent: event.alamatevent,
    danaevent: event.danaevent,
    posterUrl: event.posterevent ? `${POSTER_BASE}${event.posterevent}` : '',
    jenisevent: event.jenisevent,
    wwtype: event.wwtype,
    linkevent: event.linkevent,
    longlatevent: event.longlatevent,
    radius: event.radius,
    approvenasional: event.approvenasional,
    notenasional: event.notenasional,
    targetjumlah: event.targetjumlah,
    target: event.target,
    targetpengurus: event.targetpengurus,
    suratpemberitahuan: event.suratpemberitahuan,
    khusus: event.khusus,
    registrasi: event.registrasi.map((r) => ({
      id_registrasi: r.id_registrasi,
      nama: r.peserta.nama,
      email: r.peserta.email,
      gereja: r.peserta.gereja,
    })),
    absen: absenRows.map((a) => {
      const p = pesertaMap.get(a.id_peserta)
      return {
        id_absen: a.id_absen,
        nama: p?.nama ?? `Peserta #${a.id_peserta}`,
        email: a.email,
        userlevel: p?.userlevel ?? '',
        timestamp: a.timestamp.toISOString(),
      }
    }),
  }
}

export async function getEventById(id: number): Promise<EventSummary | null> {
  const event = await db.event.findUnique({
    where: { id_event: id },
    select: {
      id_event: true,
      nama_event: true,
      tglevent: true,
      jamevent: true,
      posterevent: true,
    },
  })

  if (!event) return null

  return {
    id_event: event.id_event,
    nama_event: event.nama_event,
    tglDisplay: event.tglevent.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    jamevent: event.jamevent,
    posterUrl: `${POSTER_BASE}${event.posterevent}`,
  }
}

// ── Create / Update ────────────────────────────────────────────

export type EventFormPayload = {
  idCabang: string
  nama_event: string
  jenisevent: string
  wwtype: event_wwtype
  target: string
  targetpengurus: string
  targetjumlah: number
  tglevent: Date
  tgleventselesai: Date
  jamevent: string
  jamselesaievent: string
  alamatevent: string
  longlatevent: string
  radius: number
  danaevent: string
  suratpemberitahuan: string
  khusus: string
}

export async function createEvent(payload: EventFormPayload): Promise<number> {
  const pengurusId = (await cookies()).get('pengurus_id')?.value
  let idCabang = payload.idCabang
  let khusus = payload.khusus || ''
  if (pengurusId) {
    const pengurus = await db.pengurus.findUnique({
      where: { id_pengurus: Number(pengurusId) },
      select: { username: true, kotalevelup: true, divisi: true },
    })
    if (pengurus?.divisi === 'alk') {
      idCabang = resolveEventCabang(pengurus)
      // only nasional may set khusus; kota admins always empty
      if (!isNasionalAdmin(pengurus.username)) khusus = ''
    }
  }

  const created = await db.event.create({
    data: {
      nama_event: payload.nama_event,
      tglevent: payload.tglevent,
      tgleventselesai: payload.tgleventselesai,
      jamevent: payload.jamevent,
      jamselesaievent: payload.jamselesaievent,
      alamatevent: payload.alamatevent,
      danaevent: payload.danaevent,
      posterevent: '',
      proposalevent: '',
      id_cabang: idCabang,
      target: payload.target,
      targetpengurus: payload.targetpengurus,
      targetjumlah: payload.targetjumlah,
      jenisevent: payload.jenisevent,
      wwtype: payload.wwtype,
      longlatevent: payload.longlatevent,
      radius: payload.radius,
      linkevent: '',
      approvenasional: '0',
      approveadmin: '0',
      notenasional: '',
      noteadmin: '',
      qr: '',
      khusus,
      suratpemberitahuan: payload.suratpemberitahuan,
    },
    select: { id_event: true },
  })

  const id = created.id_event
  const baseUrl = (process.env.AUTH_URL ?? '').replace(/\/$/, '')
  await db.event.update({
    where: { id_event: id },
    data: { linkevent: `${baseUrl}/join/${id}` },
  })

  revalidatePath('/dashboard/kota/alk')

  if (idCabang === NASIONAL_EVENT_CABANG) {
    void notifyTelegram(
      formatTelegramMessage('[Event Nasional] Dibuat', {
        Nama: payload.nama_event,
        Tipe: `${payload.jenisevent} / ${nasionalScopeLabel(khusus)}`,
        Tanggal: payload.tglevent.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        ID: id,
      }),
    )
  }

  return id
}

export async function updateEvent(
  id: number,
  payload: Omit<EventFormPayload, 'idCabang'>,
): Promise<void> {
  const pengurusId = (await cookies()).get('pengurus_id')?.value
  let khusus: string | undefined
  let isNasional = false
  if (pengurusId) {
    const pengurus = await db.pengurus.findUnique({
      where: { id_pengurus: Number(pengurusId) },
      select: { username: true },
    })
    if (pengurus && isNasionalAdmin(pengurus.username)) {
      isNasional = true
      khusus = payload.khusus || ''
    }
  }

  await db.event.update({
    where: { id_event: id },
    data: {
      nama_event: payload.nama_event,
      jenisevent: payload.jenisevent,
      wwtype: payload.wwtype,
      target: payload.target,
      targetpengurus: payload.targetpengurus,
      targetjumlah: payload.targetjumlah,
      tglevent: payload.tglevent,
      tgleventselesai: payload.tgleventselesai,
      jamevent: payload.jamevent,
      jamselesaievent: payload.jamselesaievent,
      alamatevent: payload.alamatevent,
      longlatevent: payload.longlatevent,
      radius: payload.radius,
      danaevent: payload.danaevent,
      suratpemberitahuan: payload.suratpemberitahuan,
      ...(khusus !== undefined ? { khusus } : {}),
    },
  })
  revalidatePath('/dashboard/kota/alk')
  revalidatePath(`/dashboard/kota/alk/event/${id}`)

  if (isNasional) {
    void notifyTelegram(
      formatTelegramMessage('[Event Nasional] Diedit', {
        Nama: payload.nama_event,
        Tipe: `${payload.jenisevent} / ${nasionalScopeLabel(khusus ?? '')}`,
        Tanggal: payload.tglevent.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        ID: id,
      }),
    )
  }
}

export type AlkBerandaStats = {
  pesertaVolunteer: number
  pesertaCore: number
  pesertaSquad: number
  eventOffline: number
  eventOnline: number
  danaUsul: number
  danaRiil: number
  danaEvent: number
}

function toNum(v: unknown): number {
  if (v == null) return 0
  const n = typeof v === 'bigint' ? Number(v) : Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function getAlkBerandaStats(idCabang: string): Promise<AlkBerandaStats> {
  const [volunteer, core, squad, offline, online, usulRows, riilRows, eventRows] = await Promise.all([
    db.peserta.count({ where: { kotalevelup: idCabang, userlevel: '1' } }),
    db.peserta.count({ where: { kotalevelup: idCabang, userlevel: '3' } }),
    db.peserta.count({ where: { kotalevelup: idCabang, userlevel: '2' } }),
    db.event.count({ where: { id_cabang: idCabang, jenisevent: 'Offline' } }),
    db.event.count({ where: { id_cabang: idCabang, jenisevent: 'Online' } }),
    db.$queryRaw<[{ total_dana_usul: unknown }]>`
      SELECT SUM(r.danausul) AS total_dana_usul
      FROM reimburse r
      INNER JOIN event e ON r.id_event = e.id_event
      WHERE e.id_cabang = ${idCabang}
    `,
    db.$queryRaw<[{ total_dana_riil: unknown }]>`
      SELECT SUM(r.danariil) AS total_dana_riil
      FROM reimburse r
      INNER JOIN event e ON r.id_event = e.id_event
      WHERE e.id_cabang = ${idCabang}
    `,
    db.$queryRaw<[{ total_dana_event: unknown }]>`
      SELECT SUM(e.danaevent) AS total_dana_event
      FROM event e
      WHERE e.id_cabang = ${idCabang}
    `,
  ])

  return {
    pesertaVolunteer: volunteer,
    pesertaCore: core,
    pesertaSquad: squad,
    eventOffline: offline,
    eventOnline: online,
    danaUsul: toNum(usulRows[0]?.total_dana_usul),
    danaRiil: toNum(riilRows[0]?.total_dana_riil),
    danaEvent: toNum(eventRows[0]?.total_dana_event),
  }
}

export type EventApprovalResult = { ok: true } | { ok: false; error: string }

async function requireSekretariatNasional(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const pengurusId = (await cookies()).get('pengurus_id')?.value
  if (!pengurusId) return { ok: false, error: 'Unauthorized' }
  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { username: true, divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk' || !isNasionalAdmin(pengurus.username)) {
    return { ok: false, error: 'Hanya Sekretariat Nasional yang bisa approve' }
  }
  return { ok: true }
}

/** ALK Nasional (Sekretariat) approve → approvenasional = 1 */
export async function approveEventAlkNasional(
  idEvent: number,
): Promise<EventApprovalResult> {
  const gate = await requireSekretariatNasional()
  if (!gate.ok) return gate

  const event = await db.event.findUnique({
    where: { id_event: idEvent },
    select: { nama_event: true, khusus: true },
  })
  if (!event) return { ok: false, error: 'Event tidak ditemukan' }

  await db.event.update({
    where: { id_event: idEvent },
    data: { approvenasional: '1' },
  })
  revalidatePath('/dashboard/kota/alk')
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}`)

  void notifyTelegram(
    formatTelegramMessage('[Event Nasional] Approved ALK', {
      Nama: event.nama_event,
      Tipe: nasionalScopeLabel(event.khusus),
      ID: idEvent,
    }),
  )
  return { ok: true }
}

/** ALK Nasional reject → append "ALK Nasional : …" ke notenasional */
export async function rejectEventAlkNasional(
  idEvent: number,
  alasan: string,
): Promise<EventApprovalResult> {
  const gate = await requireSekretariatNasional()
  if (!gate.ok) return gate

  const reason = alasan.trim()
  if (!reason) return { ok: false, error: 'Alasan reject wajib diisi' }

  const existing = await db.event.findUnique({
    where: { id_event: idEvent },
    select: { notenasional: true, nama_event: true, khusus: true },
  })
  if (!existing) return { ok: false, error: 'Event tidak ditemukan' }

  await db.event.update({
    where: { id_event: idEvent },
    data: {
      approvenasional: '0',
      notenasional: appendNotenasional(existing.notenasional, 'alk', reason),
    },
  })
  revalidatePath('/dashboard/kota/alk')
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}`)

  void notifyTelegram(
    formatTelegramMessage('[Event Nasional] Rejected ALK', {
      Nama: existing.nama_event,
      Alasan: reason,
      ID: idEvent,
    }),
  )
  return { ok: true }
}
