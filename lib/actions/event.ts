'use server'
import { cookies } from 'next/headers'
import { put } from '@vercel/blob'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { event_wwtype } from '@/lib/generated/enums'
import {
  resolveEventCabang,
  isNasionalAdmin,
  isNasionalBrim,
  NASIONAL_EVENT_CABANG,
} from '@/lib/event-cabang'
import { appendNotenasional } from '@/lib/event-approval'
import { resolveEventPosterUrl } from '@/lib/event-poster'
import {
  emptyFlyerQa,
  extractJsonObject,
  flyerQaTelegramBanner,
  flyerQaTelegramFields,
  formatFlyerExpectedTanggal,
  needsFlyerReview,
  parseFlyerQa,
  parseFlyerQaReview,
  pollFlyerQaRun,
  startFlyerQaWebhook,
  stringifyFlyerQa,
  type FlyerQaRecord,
} from '@/lib/flyer-qa'
import { formatTelegramMessage, nasionalScopeLabel, notifyTelegram, eventActionButtons, eventFormTelegramFields, eventTelegramScope } from '@/lib/telegram'

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
      select: { id_event: true, tglevent: true, jamevent: true, posterevent: true, image_url: true },
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
      posterUrl: resolveEventPosterUrl(e.posterevent, e.image_url),
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
      select: { id_event: true, nama_event: true, tglevent: true, jamevent: true, posterevent: true, image_url: true },
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
      posterUrl: resolveEventPosterUrl(e.posterevent, e.image_url),
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
  approvebrimnas: string
  notenasional: string
  khusus: string
}

/** `null` = all cabang (Sekretariat / Brim Nasional). */
export async function getAllEventsByKotalevelup(
  kotalevelup: string | null,
): Promise<EventDashboard[]> {
  const rows = await db.event.findMany({
    where: kotalevelup == null ? undefined : { id_cabang: kotalevelup },
    orderBy: { tglevent: 'desc' },
    select: {
      id_event: true, nama_event: true,
      tglevent: true, jamevent: true, alamatevent: true, posterevent: true, image_url: true,
      approvenasional: true, approvebrimnas: true, notenasional: true, khusus: true,
    },
  })
  return rows.map((e) => {
    const ms = e.tglevent instanceof Date ? e.tglevent.getTime() : NaN
    const tglMs = Number.isFinite(ms) ? ms : 0
    return {
      id_event: e.id_event,
      nama_event: e.nama_event,
      tglMs,
      tglDisplay: tglMs
        ? e.tglevent.toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })
        : 'Tanggal tidak valid',
      jamevent: e.jamevent,
      alamatevent: e.alamatevent,
      posterUrl: resolveEventPosterUrl(e.posterevent, e.image_url),
      approvenasional: e.approvenasional,
      approvebrimnas: e.approvebrimnas ?? '0',
      notenasional: e.notenasional ?? '',
      khusus: e.khusus,
    }
  })
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
  approvebrimnas: string
  notenasional: string
  targetjumlah: number
  target: string
  targetpengurus: string
  suratpemberitahuan: string
  khusus: string
  flyerQa: FlyerQaRecord | null
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
      alamatevent: true, danaevent: true, posterevent: true, image_url: true,
      jenisevent: true, wwtype: true, linkevent: true, longlatevent: true,
      radius: true, approvenasional: true, approvebrimnas: true, notenasional: true, targetjumlah: true,
      target: true, targetpengurus: true, suratpemberitahuan: true, khusus: true, flyer_qa: true,
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
    posterUrl: resolveEventPosterUrl(event.posterevent, event.image_url),
    jenisevent: event.jenisevent,
    wwtype: event.wwtype,
    linkevent: event.linkevent,
    longlatevent: event.longlatevent,
    radius: event.radius,
    approvenasional: event.approvenasional,
    approvebrimnas: event.approvebrimnas ?? '0',
    notenasional: event.notenasional,
    targetjumlah: event.targetjumlah,
    target: event.target,
    targetpengurus: event.targetpengurus,
    suratpemberitahuan: event.suratpemberitahuan,
    khusus: event.khusus,
    flyerQa: parseFlyerQa(event.flyer_qa),
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
      image_url: true,
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
    posterUrl: resolveEventPosterUrl(event.posterevent, event.image_url),
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

const FLYER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const FLYER_MAX_BYTES = 4 * 1024 * 1024

async function uploadEventFlyer(file: File): Promise<string> {
  if (!FLYER_TYPES.has(file.type)) {
    throw new Error('Flyer harus JPEG, PNG, WebP, atau GIF.')
  }
  if (file.size > FLYER_MAX_BYTES) {
    throw new Error('Flyer maksimal 4 MB.')
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN belum di-set.')
  // explicit token beats OIDC; store is not connected to the development environment
  const blob = await put(`events/flyers/${file.name}`, file, {
    access: 'public',
    addRandomSuffix: true,
    token,
  })
  return blob.url
}

export async function createEvent(payload: EventFormPayload, flyer?: File | null): Promise<number> {
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

  const imageUrl = flyer && flyer.size > 0 ? await uploadEventFlyer(flyer) : ''

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
      image_url: imageUrl,
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
      approvebrimnas: '0',
      approveadmin: '0',
      notenasional: '',
      noteadmin: '',
      qr: '',
      khusus,
      suratpemberitahuan: payload.suratpemberitahuan,
      flyer_qa: '',
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

  const isNasionalEvent = idCabang === NASIONAL_EVENT_CABANG
  let cabangLabel = isNasionalEvent ? nasionalScopeLabel(khusus) : idCabang
  if (!isNasionalEvent) {
    const cabangId = Number(idCabang)
    if (Number.isFinite(cabangId)) {
      const cabang = await db.cabang.findUnique({
        where: { id_cabang: cabangId },
        select: { namacabang: true },
      })
      if (cabang?.namacabang) cabangLabel = cabang.namacabang
    }
  }

  if (needsFlyerReview(payload.wwtype, imageUrl)) {
    await kickoffFlyerReview(id)
  } else {
    void notifyTelegram(
      formatTelegramMessage({
        tag: isNasionalEvent ? 'Event Nasional' : 'Event Kota',
        action: 'Dibuat',
        eventName: payload.nama_event,
        fields: eventFormTelegramFields({
          cabangLabel,
          isNasional: isNasionalEvent,
          khusus,
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
          id,
        }),
      }),
      { buttons: eventActionButtons(id, { poster: imageUrl || undefined, longlatevent: payload.longlatevent }) },
    )
  }

  return id
}

export async function updateEvent(
  id: number,
  payload: Omit<EventFormPayload, 'idCabang'>,
  flyer?: File | null,
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

  const current = await db.event.findUnique({
    where: { id_event: id },
    select: { image_url: true, posterevent: true },
  })
  if (!current) throw new Error('Event tidak ditemukan')

  const newFlyer = flyer && flyer.size > 0
  const imageUrl = newFlyer
    ? await uploadEventFlyer(flyer)
    : resolveEventPosterUrl(current.posterevent, current.image_url)
  const reviewed = needsFlyerReview(payload.wwtype, imageUrl)

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
      ...(newFlyer ? { image_url: imageUrl, posterevent: '' } : {}),
    },
  })
  revalidatePath('/dashboard/kota/alk')
  revalidatePath(`/dashboard/kota/alk/event/${id}`)

  if (reviewed && newFlyer) {
    await kickoffFlyerReview(id)
    return
  }

  if (!reviewed && isNasional) {
    void notifyTelegram(
      formatTelegramMessage({
        tag: 'Event Nasional',
        action: 'Diedit',
        eventName: payload.nama_event,
        fields: eventFormTelegramFields({
          cabangLabel: nasionalScopeLabel(khusus ?? ''),
          isNasional: true,
          khusus: khusus ?? '',
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
          id,
        }),
      }),
      { buttons: eventActionButtons(id, { longlatevent: payload.longlatevent }) },
    )
  }
}

async function requireAlkPengurus(): Promise<void> {
  const pengurusId = (await cookies()).get('pengurus_id')?.value
  if (!pengurusId) throw new Error('Unauthorized')
  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk') throw new Error('Unauthorized')
}

async function flyerQaPayloadForEvent(id: number) {
  const event = await db.event.findUnique({
    where: { id_event: id },
    select: {
      nama_event: true, tglevent: true, jamevent: true, alamatevent: true,
      id_cabang: true, image_url: true, posterevent: true, wwtype: true,
    },
  })
  if (!event) throw new Error('Event tidak ditemukan')
  const file_url = resolveEventPosterUrl(event.posterevent, event.image_url)
  if (!needsFlyerReview(event.wwtype, file_url)) {
    throw new Error('Event ini tidak perlu review flyer')
  }
  let kota = 'Nasional'
  if (event.id_cabang !== NASIONAL_EVENT_CABANG) {
    const cabangId = Number(event.id_cabang)
    if (Number.isFinite(cabangId)) {
      const cabang = await db.cabang.findUnique({
        where: { id_cabang: cabangId },
        select: { namacabang: true },
      })
      if (cabang?.namacabang) kota = cabang.namacabang
    }
  }
  return {
    file_url,
    kota,
    expected: {
      acara: event.nama_event,
      tanggal: formatFlyerExpectedTanggal(event.tglevent),
      waktu: event.jamevent,
      tempat: event.alamatevent,
    },
  }
}

async function saveFlyerQa(id: number, rec: FlyerQaRecord): Promise<void> {
  await db.event.update({
    where: { id_event: id },
    data: { flyer_qa: stringifyFlyerQa(rec) },
  })
  revalidatePath(`/dashboard/kota/alk/event/${id}`)
}

async function kickoffFlyerReview(id: number): Promise<FlyerQaRecord> {
  try {
    const payload = await flyerQaPayloadForEvent(id)
    const { agentId } = await startFlyerQaWebhook(payload)
    const rec = emptyFlyerQa({ state: 'reviewing', agentId })
    await saveFlyerQa(id, rec)
    return rec
  } catch (err) {
    const rec = emptyFlyerQa({
      state: 'error',
      error: err instanceof Error ? err.message : 'Gagal mulai review flyer',
    })
    await saveFlyerQa(id, rec)
    return rec
  }
}

export async function pollFlyerReview(id: number): Promise<FlyerQaRecord | null> {
  await requireAlkPengurus()
  const event = await db.event.findUnique({
    where: { id_event: id },
    select: { flyer_qa: true },
  })
  if (!event) throw new Error('Event tidak ditemukan')
  const rec = parseFlyerQa(event.flyer_qa)
  if (!rec || rec.state !== 'reviewing') return rec
  try {
    const run = await pollFlyerQaRun(rec.agentId, rec.runId)
    rec.runId = run.runId
    if (run.status === 'FINISHED') {
      rec.error = null
      try {
        rec.review = run.result ? parseFlyerQaReview(extractJsonObject(run.result)) : null
      } catch {
        rec.review = null
      }
      if (rec.review) {
        rec.state = 'done'
      } else {
        rec.state = 'error'
        rec.error = 'Hasil review tidak valid'
      }
      await saveFlyerQa(id, rec)
    } else if (run.status === 'ERROR' || run.status === 'CANCELLED' || run.status === 'EXPIRED') {
      rec.state = 'error'
      rec.error = `Review ${run.status}`
      await saveFlyerQa(id, rec)
    }
  } catch (err) {
    rec.error = err instanceof Error ? err.message : 'Gagal cek status review'
  }
  return rec
}

export async function retryFlyerReview(id: number): Promise<FlyerQaRecord> {
  await requireAlkPengurus()
  return kickoffFlyerReview(id)
}

export async function ajukanEventFlyer(
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAlkPengurus()
  } catch {
    return { ok: false, error: 'Unauthorized' }
  }
  const event = await db.event.findUnique({
    where: { id_event: id },
    select: {
      nama_event: true, jenisevent: true, wwtype: true, target: true, targetpengurus: true,
      targetjumlah: true, tglevent: true, tgleventselesai: true, jamevent: true,
      jamselesaievent: true, alamatevent: true, longlatevent: true, radius: true,
      danaevent: true, suratpemberitahuan: true, khusus: true, id_cabang: true,
      posterevent: true, image_url: true, flyer_qa: true,
    },
  })
  if (!event) return { ok: false, error: 'Event tidak ditemukan' }
  const rec = parseFlyerQa(event.flyer_qa)
  if (!rec || rec.state !== 'done') return { ok: false, error: 'Review flyer belum selesai' }
  if (rec.diajukan) return { ok: false, error: 'Event sudah diajukan' }

  rec.diajukan = true
  rec.diajukanAt = new Date().toISOString()
  await saveFlyerQa(id, rec)

  const isNasionalEvent = event.id_cabang === NASIONAL_EVENT_CABANG
  let cabangLabel = isNasionalEvent ? nasionalScopeLabel(event.khusus) : event.id_cabang
  if (!isNasionalEvent) {
    const cabangId = Number(event.id_cabang)
    if (Number.isFinite(cabangId)) {
      const cabang = await db.cabang.findUnique({
        where: { id_cabang: cabangId },
        select: { namacabang: true },
      })
      if (cabang?.namacabang) cabangLabel = cabang.namacabang
    }
  }
  const poster = resolveEventPosterUrl(event.posterevent, event.image_url)
  void notifyTelegram(
    formatTelegramMessage({
      tag: isNasionalEvent ? 'Event Nasional' : 'Event Kota',
      action: 'Diajukan',
      eventName: event.nama_event,
      banner: flyerQaTelegramBanner(rec.review?.status),
      boldFields: ['QA flyer'],
      fields: {
        ...flyerQaTelegramFields(rec.review),
        ...eventFormTelegramFields({
          cabangLabel,
          isNasional: isNasionalEvent,
          khusus: event.khusus,
          jenisevent: event.jenisevent,
          wwtype: event.wwtype,
          target: event.target,
          targetpengurus: event.targetpengurus,
          targetjumlah: event.targetjumlah,
          tglevent: event.tglevent,
          tgleventselesai: event.tgleventselesai,
          jamevent: event.jamevent,
          jamselesaievent: event.jamselesaievent,
          alamatevent: event.alamatevent,
          longlatevent: event.longlatevent,
          radius: event.radius,
          danaevent: event.danaevent,
          suratpemberitahuan: event.suratpemberitahuan,
          id,
        }),
      },
    }),
    { buttons: eventActionButtons(id, { poster: poster || undefined, longlatevent: event.longlatevent }) },
  )
  return { ok: true }
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

async function telegramScopeForEvent(event: {
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
    select: { nama_event: true, khusus: true, id_cabang: true, tglevent: true, tgleventselesai: true },
  })
  if (!event) return { ok: false, error: 'Event tidak ditemukan' }

  await db.event.update({
    where: { id_event: idEvent },
    data: { approvenasional: '1' },
  })
  revalidatePath('/dashboard/kota/alk')
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}`)

  const scope = await telegramScopeForEvent(event)
  void notifyTelegram(
    formatTelegramMessage({
      tag: scope.tag,
      action: 'Approved ALK',
      eventName: event.nama_event,
      fields: { ...scope.fields, ID: idEvent },
    }),
    { buttons: eventActionButtons(idEvent) },
  )
  return { ok: true }
}

async function requireBrimNasional(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const pengurusId = (await cookies()).get('pengurus_id')?.value
  if (!pengurusId) return { ok: false, error: 'Unauthorized' }
  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { username: true, divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'brim' || !isNasionalBrim(pengurus.username)) {
    return { ok: false, error: 'Hanya Brim Nasional yang bisa approve' }
  }
  return { ok: true }
}

/** Brim Nasional approve → approvebrimnas = 1 */
export async function approveEventBrimNasional(
  idEvent: number,
): Promise<EventApprovalResult> {
  const gate = await requireBrimNasional()
  if (!gate.ok) return gate

  const event = await db.event.findUnique({
    where: { id_event: idEvent },
    select: { nama_event: true, khusus: true, id_cabang: true, tglevent: true, tgleventselesai: true },
  })
  if (!event) return { ok: false, error: 'Event tidak ditemukan' }

  await db.event.update({
    where: { id_event: idEvent },
    data: { approvebrimnas: '1' },
  })
  revalidatePath('/dashboard/kota/brim')
  revalidatePath(`/dashboard/kota/brim/event/${idEvent}/approve`)

  const scope = await telegramScopeForEvent(event)
  void notifyTelegram(
    formatTelegramMessage({
      tag: scope.tag,
      action: 'Approved Brim',
      eventName: event.nama_event,
      fields: { ...scope.fields, ID: idEvent },
    }),
    { buttons: eventActionButtons(idEvent) },
  )
  return { ok: true }
}

/** Brim Nasional reject → append "Brim Nasional: …" ke notenasional */
export async function rejectEventBrimNasional(
  idEvent: number,
  alasan: string,
): Promise<EventApprovalResult> {
  const gate = await requireBrimNasional()
  if (!gate.ok) return gate

  const reason = alasan.trim()
  if (!reason) return { ok: false, error: 'Alasan reject wajib diisi' }

  const existing = await db.event.findUnique({
    where: { id_event: idEvent },
    select: { notenasional: true, nama_event: true, khusus: true, id_cabang: true, tglevent: true, tgleventselesai: true },
  })
  if (!existing) return { ok: false, error: 'Event tidak ditemukan' }

  await db.event.update({
    where: { id_event: idEvent },
    data: {
      approvebrimnas: '0',
      notenasional: appendNotenasional(existing.notenasional, 'brim', reason),
    },
  })
  revalidatePath('/dashboard/kota/brim')
  revalidatePath(`/dashboard/kota/brim/event/${idEvent}/approve`)

  const scope = await telegramScopeForEvent(existing)
  void notifyTelegram(
    formatTelegramMessage({
      tag: scope.tag,
      action: 'Rejected Brim',
      eventName: existing.nama_event,
      fields: { ...scope.fields, Alasan: reason, ID: idEvent },
    }),
    { buttons: eventActionButtons(idEvent) },
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
    select: { notenasional: true, nama_event: true, khusus: true, id_cabang: true, tglevent: true, tgleventselesai: true },
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

  const scope = await telegramScopeForEvent(existing)
  void notifyTelegram(
    formatTelegramMessage({
      tag: scope.tag,
      action: 'Rejected ALK',
      eventName: existing.nama_event,
      fields: { ...scope.fields, Alasan: reason, ID: idEvent },
    }),
    { buttons: eventActionButtons(idEvent) },
  )
  return { ok: true }
}
