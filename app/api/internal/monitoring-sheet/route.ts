import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { NASIONAL_EVENT_CABANG } from '@/lib/event-cabang'
import { resolveEventPosterUrl } from '@/lib/event-poster'
import { buildMonitoringRow, groupByBulan, type MonitoringSection } from '@/lib/monitoring-sheet'

export type MonitoringSheetPayload = {
  year: number
  generatedAt: string
  sections: MonitoringSection[]
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Secret terpisah dari INTERNAL_API_SECRET: disimpan di Script Properties Apps Script,
// yang bisa dibaca semua editor spreadsheet — jangan sampai membuka prod-migrate.
function checkSecret(req: NextRequest): boolean {
  const secret = process.env.MONITORING_SHEET_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return false
  return header.slice(7) === secret
}

/** Form Monitoring Teknis: semua event kota yang `tglevent`-nya di tahun `?year=`. */
export async function GET(req: NextRequest) {
  if (!checkSecret(req)) return unauthorized()

  const year = Number(req.nextUrl.searchParams.get('year'))
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: 'Parameter year wajib (contoh ?year=2026)' }, { status: 400 })
  }

  const events = await db.event.findMany({
    where: {
      tglevent: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) },
      id_cabang: { notIn: [NASIONAL_EVENT_CABANG, ''] },
    },
    select: {
      id_event: true,
      nama_event: true,
      tglevent: true,
      tgleventselesai: true,
      id_cabang: true,
      created_at: true,
      suratpemberitahuan: true,
      posterevent: true,
      image_url: true,
    },
    orderBy: [{ tglevent: 'asc' }, { id_event: 'asc' }],
  })

  const ids = events.map((e) => e.id_event)
  const idStrs = ids.map(String)
  const cabangIds = [...new Set(events.map((e) => Number(e.id_cabang)).filter(Number.isFinite))]

  const [cabangRows, absenInt, absenLegacy, reimburseRows, dokRows] = await Promise.all([
    db.cabang.findMany({ where: { id_cabang: { in: cabangIds } }, select: { id_cabang: true, namacabang: true } }),
    db.absen.groupBy({ by: ['id_event_int'], where: { id_event_int: { in: ids } }, _count: { _all: true } }),
    // Baris absen lama hanya punya id_event (TEXT)
    db.absen.groupBy({
      by: ['id_event'],
      where: { id_event_int: null, id_event: { in: idStrs } },
      _count: { _all: true },
    }),
    db.reimburse.findMany({ where: { id_event: { in: idStrs } }, select: { id_event: true, laporan: true, laporan_at: true } }),
    db.dokumentasi_kota.findMany({
      where: { id_event: { in: ids } },
      select: { id_event: true, gdrive_link: true, created_at: true },
    }),
  ])

  const cabangName = new Map(cabangRows.map((c) => [String(c.id_cabang), c.namacabang]))
  const absenCount = new Map<number, number>()
  for (const r of absenInt) {
    if (r.id_event_int != null) absenCount.set(r.id_event_int, r._count._all)
  }
  for (const r of absenLegacy) {
    const id = Number(r.id_event)
    absenCount.set(id, (absenCount.get(id) ?? 0) + r._count._all)
  }
  const lpjByEvent = new Map<number, { link: string; at: Date | null }>()
  for (const r of reimburseRows) {
    const id = Number(r.id_event)
    if (!lpjByEvent.get(id)?.link) lpjByEvent.set(id, { link: r.laporan, at: r.laporan_at })
  }
  const dokByEvent = new Map(dokRows.map((d) => [d.id_event, { link: d.gdrive_link, at: d.created_at }]))

  const now = new Date()
  const items = events.map((e) => ({
    tglevent: e.tglevent,
    row: buildMonitoringRow(
      {
        id_event: e.id_event,
        nama_event: e.nama_event,
        kota: cabangName.get(e.id_cabang) ?? e.id_cabang,
        tglevent: e.tglevent,
        tgleventselesai: e.tgleventselesai,
        created_at: e.created_at,
        suratpemberitahuan: e.suratpemberitahuan,
        flyerUrl: resolveEventPosterUrl(e.posterevent, e.image_url),
        jumlahAbsen: absenCount.get(e.id_event) ?? 0,
        lpj: lpjByEvent.get(e.id_event) ?? null,
        dokumentasi: dokByEvent.get(e.id_event) ?? null,
      },
      now,
    ),
  }))

  const payload: MonitoringSheetPayload = {
    year,
    generatedAt: now.toISOString(),
    sections: groupByBulan(items),
  }
  return NextResponse.json(payload)
}
