'use server'
import { db } from '@/lib/db'

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
      approvenasional: true,
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
  timestamp: string
}

export type EventDetailFull = {
  id_event: number
  nama_event: string
  tglDisplay: string
  tglSelesaiDisplay: string
  jamevent: string
  jamselesaievent: string
  alamatevent: string
  danaevent: string
  posterUrl: string
  jenisevent: string
  linkevent: string
  longlatevent: string
  radius: number
  approvenasional: string
  targetjumlah: number
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
      jenisevent: true, linkevent: true, longlatevent: true,
      radius: true, approvenasional: true, targetjumlah: true,
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
    where: { id_event: String(id) },
    orderBy: { timestamp: 'asc' },
    select: { id_absen: true, id_peserta: true, email: true, timestamp: true },
  })

  const pesertaIds = [...new Set(absenRows.map((a) => parseInt(a.id_peserta, 10)).filter((n) => !isNaN(n)))]
  const pesertaList = pesertaIds.length
    ? await db.peserta.findMany({
        where: { id_peserta: { in: pesertaIds } },
        select: { id_peserta: true, nama: true },
      })
    : []
  const pesertaMap = new Map(pesertaList.map((p) => [String(p.id_peserta), p.nama]))

  return {
    id_event: event.id_event,
    nama_event: event.nama_event,
    tglDisplay: event.tglevent.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
    tglSelesaiDisplay: event.tgleventselesai.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
    jamevent: event.jamevent,
    jamselesaievent: event.jamselesaievent,
    alamatevent: event.alamatevent,
    danaevent: event.danaevent,
    posterUrl: `${POSTER_BASE}${event.posterevent}`,
    jenisevent: event.jenisevent,
    linkevent: event.linkevent,
    longlatevent: event.longlatevent,
    radius: event.radius,
    approvenasional: event.approvenasional,
    targetjumlah: event.targetjumlah,
    registrasi: event.registrasi.map((r) => ({
      id_registrasi: r.id_registrasi,
      nama: r.peserta.nama,
      email: r.peserta.email,
      gereja: r.peserta.gereja,
    })),
    absen: absenRows.map((a) => ({
      id_absen: a.id_absen,
      nama: pesertaMap.get(a.id_peserta) ?? `Peserta #${a.id_peserta}`,
      email: a.email,
      timestamp: a.timestamp.toISOString(),
    })),
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
