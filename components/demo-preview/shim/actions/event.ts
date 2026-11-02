'use client'
/* eslint-disable @typescript-eslint/no-unused-vars */
// Demo stand-in for lib/actions/event. Same exports + return shapes, backed by the localStorage db.
import type {
  AlkBerandaStats,
  CabangOption,
  EventApprovalResult,
  EventDashboard,
  EventDetailFull,
  EventFormPayload,
  EventListItem,
  EventLocation,
  EventSummary,
} from '@/lib/actions/event'
import type { EventLokasiRow } from '@/lib/event-lokasi'
import { toEventSesiRow, type EventSesiRow } from '@/lib/event-sesi'
import { addLog, getDb, mutate, type DbEvent } from '../../db'
import { alkPengurus, dayMs, fileToDataUrl, fmtDay, fmtLong, fmtRange, posterOf, sessionPeserta, WW_CATEGORY } from '../util'

export type * from '@/lib/actions/event'

const DAY = 86400000
const todayWib = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10)
const cabangLabel = (d: ReturnType<typeof getDb>, id: string) =>
  id === '0' ? 'Nasional' : (d.cabang.find((c) => String(c.id_cabang) === id)?.namacabang ?? `Kota #${id}`)

export async function getCabangs(): Promise<CabangOption[]> {
  return getDb()
    .cabang.map((c) => ({ id: String(c.id_cabang), nama: c.namacabang }))
    .sort((a, b) => a.nama.localeCompare(b.nama))
}

function toListItem(d: ReturnType<typeof getDb>, e: DbEvent): EventListItem {
  const endMs = dayMs(e.tgleventselesai)
  const n = d.registrasi.filter((r) => r.id_event === e.id_event && r.status !== 'cancelled').length
  const regState = Date.now() >= endMs + DAY ? 'CLOSED' : e.targetjumlah > 0 && n >= e.targetjumlah ? 'FULL' : 'OPEN'
  return {
    id_event: e.id_event,
    nama_event: e.nama_event,
    tglDisplay: fmtLong(e.tglevent),
    tglRange: fmtRange(e.tglevent, e.tgleventselesai),
    jamevent: e.jamevent,
    posterUrl: posterOf(e),
    tglMs: dayMs(e.tglevent),
    tglSelesaiMs: endMs,
    jenisevent: e.jenisevent || 'Offline',
    category: WW_CATEGORY[e.wwtype] ?? 'Event',
    id_cabang: e.id_cabang,
    cabangName: cabangLabel(d, e.id_cabang),
    regState,
  }
}

function listEvents(kota: string, page: number, includeNasional: boolean) {
  const d = getDb()
  const rows = d.event
    .filter((e) => (kota === 'all' ? true : e.id_cabang === kota || e.id_cabang === '0'))
    .filter((e) => e.tgleventselesai >= todayWib())
    .filter((e) => includeNasional || e.wwtype !== 'nasional')
    .sort((a, b) => a.tglevent.localeCompare(b.tglevent))
  return { events: rows.slice((page - 1) * 10, page * 10).map((e) => toListItem(d, e)), total: rows.length }
}

export async function getEventsByKotalevelup(kotalevelup: string, page: number) {
  return listEvents(kotalevelup, page, Number(sessionPeserta()?.userlevel) >= 3)
}

export async function getPublicEvents() {
  return listEvents('all', 1, false)
}

export async function getEventsByKotalevelupFull(kotalevelup: string, page: number) {
  return getEventsByKotalevelup(kotalevelup, page)
}

export async function getEventById(id: number): Promise<EventSummary | null> {
  const d = getDb()
  const e = d.event.find((x) => x.id_event === id)
  if (!e) return null
  return {
    id_event: e.id_event,
    nama_event: e.nama_event,
    tglDisplay: fmtLong(e.tglevent),
    tglSelesaiDisplay: fmtDay(e.tgleventselesai),
    jamevent: e.jamevent,
    jamselesaievent: e.jamselesaievent,
    alamatevent: e.alamatevent,
    posterUrl: posterOf(e),
    jenisevent: e.jenisevent,
    wwtype: e.wwtype,
    category: WW_CATEGORY[e.wwtype] ?? 'Event',
    id_cabang: e.id_cabang,
    cabangName: cabangLabel(d, e.id_cabang),
    target: e.target,
    targetpengurus: e.targetpengurus,
    targetjumlah: e.targetjumlah,
    tglMs: dayMs(e.tglevent),
    tglSelesaiMs: dayMs(e.tgleventselesai),
  }
}

function toDashboard(d: ReturnType<typeof getDb>, e: DbEvent): EventDashboard {
  return {
    id_event: e.id_event,
    nama_event: e.nama_event,
    tglMs: dayMs(e.tglevent),
    tglDisplay: fmtLong(e.tglevent),
    jamevent: e.jamevent,
    alamatevent: e.alamatevent,
    posterUrl: posterOf(e),
    approvenasional: e.approvenasional,
    approvebrimnas: e.approvebrimnas,
    notenasional: e.notenasional,
    khusus: e.khusus,
    jenisevent: e.jenisevent,
    wwtype: e.wwtype,
    id_cabang: e.id_cabang,
    cabangName: cabangLabel(d, e.id_cabang),
  }
}

export async function getAllEventsByKotalevelup(kotalevelup: string | null): Promise<EventDashboard[]> {
  const d = getDb()
  return d.event
    .filter((e) => kotalevelup == null || e.id_cabang === kotalevelup)
    .sort((a, b) => b.tglevent.localeCompare(a.tglevent))
    .map((e) => toDashboard(d, e))
}

export async function getEventLocation(id: number): Promise<EventLocation | null> {
  const e = getDb().event.find((x) => x.id_event === id)
  return e ? { longlatevent: e.longlatevent, radius: e.radius } : null
}

export async function getEventSesi(idEvent: number): Promise<EventSesiRow[]> {
  return getDb()
    .event_sesi.filter((s) => s.id_event === idEvent)
    .sort((a, b) => a.urutan - b.urutan || a.id_sesi - b.id_sesi)
    .map((s) => toEventSesiRow({ ...s, tanggal: new Date(`${s.tanggal}T00:00:00Z`) }))
}

export async function getEventLokasi(_idEvent?: number): Promise<EventLokasiRow[]> {
  return []
}

export async function getEventDetail(id: number): Promise<EventDetailFull | null> {
  const d = getDb()
  const e = d.event.find((x) => x.id_event === id)
  if (!e) return null
  const kotaOf = (p?: { kotalevelup: string }) => (p ? (d.cabang.find((c) => String(c.id_cabang) === String(Number(p.kotalevelup)))?.namacabang ?? '') : '')
  const sesi = await getEventSesi(id)
  return {
    id_event: e.id_event,
    nama_event: e.nama_event,
    tglDisplay: fmtLong(e.tglevent),
    tglSelesaiDisplay: fmtLong(e.tgleventselesai),
    tglRaw: e.tglevent,
    tglSelesaiRaw: e.tgleventselesai,
    jamevent: e.jamevent,
    jamselesaievent: e.jamselesaievent,
    alamatevent: e.alamatevent,
    danaevent: e.danaevent,
    posterUrl: posterOf(e),
    jenisevent: e.jenisevent,
    wwtype: e.wwtype,
    linkevent: e.linkevent,
    longlatevent: e.longlatevent,
    radius: e.radius,
    approvenasional: e.approvenasional,
    approvebrimnas: e.approvebrimnas,
    notenasional: e.notenasional,
    targetjumlah: e.targetjumlah,
    target: e.target,
    targetpengurus: e.targetpengurus,
    suratpemberitahuan: e.suratpemberitahuan,
    khusus: e.khusus,
    flyerQa: null,
    beritaAcaraQa: null,
    sesi,
    lokasi: [],
    registrasi: d.registrasi
      .filter((r) => r.id_event === id)
      .map((r) => {
        const p = d.peserta.find((x) => x.id_peserta === r.id_peserta)
        return { id_registrasi: r.id_registrasi, id_peserta: r.id_peserta, nama: p?.nama ?? '', email: p?.email ?? '', gereja: p?.gereja ?? '', kota: kotaOf(p) }
      }),
    absen: d.absen
      .filter((a) => a.id_event === id)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((a) => {
        const p = d.peserta.find((x) => x.id_peserta === a.id_peserta)
        return {
          id_absen: a.id_absen,
          nama: p?.nama ?? `Peserta #${a.id_peserta}`,
          email: a.email,
          gereja: p?.gereja ?? '',
          userlevel: p?.userlevel ?? '',
          kota: kotaOf(p),
          timestamp: a.timestamp,
          id_sesi: a.id_sesi,
          sesiNama: a.id_sesi != null ? (sesi.find((s) => s.id_sesi === a.id_sesi)?.nama ?? null) : null,
          id_peserta: a.id_peserta,
        }
      }),
  }
}

// ── Sekretariat beranda ──────────────────────────────────────────────────────────────────────────

export async function getAlkBerandaStats(idCabang: string | null): Promise<AlkBerandaStats> {
  const d = getDb()
  const inScope = (kota: string) => idCabang == null || kota === idCabang
  const evs = d.event.filter((e) => inScope(e.id_cabang))
  const sum = (xs: string[]) => xs.reduce((a, v) => a + (Number(v) || 0), 0)
  const idsInScope = new Set(evs.map((e) => String(e.id_event)))
  const rb = d.reimburse.filter((r) => idsInScope.has(r.id_event))
  return {
    totalCabang: idCabang == null ? d.cabang.length : 1,
    pesertaVolunteer: d.peserta.filter((p) => inScope(p.kotalevelup) && p.userlevel === '1').length,
    pesertaCore: d.peserta.filter((p) => inScope(p.kotalevelup) && p.userlevel === '3').length,
    pesertaSquad: d.peserta.filter((p) => inScope(p.kotalevelup) && p.userlevel === '2').length,
    eventOffline: evs.filter((e) => e.jenisevent === 'Offline').length,
    eventOnline: evs.filter((e) => e.jenisevent === 'Online').length,
    danaUsul: sum(rb.map((r) => r.danausul)),
    danaRiil: sum(rb.map((r) => r.danariil)),
    danaEvent: sum(evs.map((e) => e.danaevent)),
  }
}

export async function getAlkBerandaTodoEvents(idCabang: string | null): Promise<EventDashboard[]> {
  const d = getDb()
  return d.event
    .filter((e) => (idCabang == null || e.id_cabang === idCabang) && e.approvenasional !== '1')
    .sort((a, b) => b.tglevent.localeCompare(a.tglevent))
    .map((e) => toDashboard(d, e))
}

// ── Create / update (events are auto-approved in the demo) ───────────────────────────────────────

const iso = (dt: Date) => dt.toISOString().slice(0, 10)

export async function createEvent(payload: EventFormPayload, flyer?: File | null): Promise<number> {
  const poster = flyer ? await fileToDataUrl(flyer) : ''
  let newId = 0
  mutate((d) => {
    newId = d.nextId++
    const pengurus = alkPengurus()
    const cabang = pengurus?.cabang ?? payload.idCabang
    d.event.push({
      id_event: newId,
      nama_event: payload.nama_event,
      jenisevent: payload.jenisevent,
      wwtype: payload.wwtype === 'nasional' ? 'bulanan' : payload.wwtype,
      id_cabang: cabang,
      target: payload.target,
      targetpengurus: payload.targetpengurus,
      targetjumlah: payload.targetjumlah,
      tglevent: iso(payload.tglevent),
      tgleventselesai: iso(payload.tgleventselesai),
      jamevent: payload.jamevent,
      jamselesaievent: payload.jamselesaievent,
      alamatevent: payload.alamatevent,
      longlatevent: payload.longlatevent,
      radius: payload.radius,
      danaevent: payload.danaevent,
      suratpemberitahuan: payload.suratpemberitahuan,
      khusus: '',
      posterevent: '',
      image_url: poster || '/program/penyembahan.jpg',
      linkevent: `/demo-preview/join/${newId}`,
      approvenasional: '1', // demo: no Pusat approval step
      approvebrimnas: '1',
      notenasional: '',
    })
    addLog(d, `Event "${payload.nama_event}" dibuat dan langsung disetujui (demo)`)
  })
  return newId
}

export async function updateEvent(id: number, payload: Omit<EventFormPayload, 'idCabang'>, flyer?: File | null): Promise<void> {
  const poster = flyer ? await fileToDataUrl(flyer) : ''
  mutate((d) => {
    const e = d.event.find((x) => x.id_event === id)
    if (!e) return
    Object.assign(e, {
      nama_event: payload.nama_event,
      jenisevent: payload.jenisevent,
      wwtype: payload.wwtype === 'nasional' ? e.wwtype : payload.wwtype,
      target: payload.target,
      targetpengurus: payload.targetpengurus,
      targetjumlah: payload.targetjumlah,
      tglevent: iso(payload.tglevent),
      tgleventselesai: iso(payload.tgleventselesai),
      jamevent: payload.jamevent,
      jamselesaievent: payload.jamselesaievent,
      alamatevent: payload.alamatevent,
      longlatevent: payload.longlatevent,
      radius: payload.radius,
      danaevent: payload.danaevent,
      suratpemberitahuan: payload.suratpemberitahuan,
    })
    if (poster) e.image_url = poster
    addLog(d, `Event "${e.nama_event}" diperbarui`)
  })
}

export async function ajukanEvent(_id?: number): Promise<{ ok: true } | { ok: false; error: string }> {
  return { ok: true }
}

// QA review + nasional approval need services the demo does not have; the UI never reaches them.
export async function pollFlyerReview(): Promise<null> {
  return null
}
export async function retryFlyerReview(): Promise<never> {
  throw new Error('Tidak tersedia di demo')
}
export async function pollBeritaAcaraReview(): Promise<null> {
  return null
}
export async function retryBeritaAcaraReview(): Promise<never> {
  throw new Error('Tidak tersedia di demo')
}
const noApproval: EventApprovalResult = { ok: false, error: 'Approval nasional tidak ada di demo — event langsung disetujui.' }
export async function approveEventAlkNasional(): Promise<EventApprovalResult> {
  return noApproval
}
export async function approveEventBrimNasional(): Promise<EventApprovalResult> {
  return noApproval
}
export async function rejectEventAlkNasional(): Promise<EventApprovalResult> {
  return noApproval
}
export async function rejectEventBrimNasional(): Promise<EventApprovalResult> {
  return noApproval
}
