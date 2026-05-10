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
