'use server'
import { cookies } from 'next/headers'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { setActor } from '@/lib/request-context'
import { revalidatePath } from 'next/cache'
import { eventDateTime, isOnlineAbsenOpen } from '@/lib/event-absen-window'
import { NASIONAL_EVENT_CABANG, isNasionalAdmin } from '@/lib/event-cabang'
import { absenDuplicateWhere } from '@/lib/event-sesi'
import {
  canAbsenNasionalTicket,
  needsNasionalTicketApproval,
} from '@/lib/registrasi-status'
import type { QRPayload } from '@/lib/qr'
import { formatTelegramMessage, notifyTelegram, eventDetailLink } from '@/lib/telegram'

export async function getPesertaPreview(idPeserta: number) {
  return db.peserta.findUnique({
    where: { id_peserta: idPeserta },
    select: { nama: true, gereja: true },
  })
}

/** Peserta self-absen for Online events — only in the 15-min-before-end window. */
export async function absenOnlineSelf(idRegistrasi: number): Promise<
  | { success: true }
  | {
      success: false
      reason:
        | 'unauthenticated'
        | 'not_found'
        | 'forbidden'
        | 'not_online'
        | 'window_closed'
        | 'already_scanned'
        | 'error'
    }
> {
  const session = await auth()
  const idPeserta = session?.user?.idPeserta
  if (!idPeserta) return { success: false, reason: 'unauthenticated' }
  setActor({ type: 'peserta', id: idPeserta, label: session?.user?.name ?? null })

  const row = await db.registrasi.findUnique({
    where: { id_registrasi: idRegistrasi },
    select: {
      id_peserta: true,
      id_event: true,
      status: true,
      event: {
        select: {
          jenisevent: true,
          tgleventselesai: true,
          jamselesaievent: true,
        },
      },
    },
  })
  if (!row) return { success: false, reason: 'not_found' }
  if (row.id_peserta !== idPeserta) return { success: false, reason: 'forbidden' }
  if (row.event?.jenisevent !== 'Online') return { success: false, reason: 'not_online' }
  if (row.status === 'pending' || row.status === 'cancelled') {
    return { success: false, reason: 'forbidden' }
  }

  const endAt =
    row.event.tgleventselesai && row.event.jamselesaievent
      ? eventDateTime(row.event.tgleventselesai, row.event.jamselesaievent)
      : null
  if (!endAt || !isOnlineAbsenOpen(new Date(), endAt)) {
    return { success: false, reason: 'window_closed' }
  }

  const email = session.user?.email ?? ''
  const result = await createAbsen({
    p: String(row.id_peserta),
    e: email,
    ev: String(row.id_event),
  })
  if (result.success) {
    try {
      revalidatePath('/dashboard')
      revalidatePath(`/dashboard/tiket/${idRegistrasi}`)
    } catch {
      /* ok */
    }
    return { success: true }
  }
  if (result.reason === 'already_scanned') return { success: false, reason: 'already_scanned' }
  return { success: false, reason: 'error' }
}

/** Scanner (/alk/scanner) belum punya halaman gate sendiri — ini satu-satunya
 *  titik yang tahu pengurus mana yang scan, jadi dicek di sini juga. */
async function requireAlkPengurusForScan(): Promise<{ id: number; label: string | null; username: string } | null> {
  const pengurusId = (await cookies()).get('pengurus_id')?.value
  if (!pengurusId) return null
  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { divisi: true, username: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk') return null
  return { id: Number(pengurusId), label: pengurus.username, username: pengurus.username }
}

class LokasiConflict extends Error {
  constructor(public lokasi: string) {
    super('lokasi_conflict')
  }
}

export async function createAbsen(
  payload: QRPayload,
  idSesi?: number | null,
  idLokasi?: number | null,
): Promise<
  | { success: true; nama: string; gereja: string }
  | {
      success: false
      reason:
        | 'invalid_payload'
        | 'already_scanned'
        | 'sesi_required'
        | 'sesi_invalid'
        | 'not_approved'
        | 'unauthorized'
        | 'nasional_only'
        | 'lokasi_required'
        | 'lokasi_invalid'
        | 'lokasi_conflict'
        | 'error'
      /** Nama lokasi yang sudah mengunci sesi (reason lokasi_conflict). */
      lokasi?: string
    }
> {
  const pengurus = await requireAlkPengurusForScan()
  if (!pengurus) return { success: false, reason: 'unauthorized' }
  setActor({ type: 'pengurus', id: pengurus.id, label: pengurus.label })

  const idPeserta = Number(payload.p)
  const idEvent = Number(payload.ev)
  if (!idPeserta || !idEvent) return { success: false, reason: 'invalid_payload' }

  const idPesertaStr = String(payload.p)
  const idEventStr = String(payload.ev)

  try {
    const [sesiRows, lokasiRows, gate] = await Promise.all([
      db.event_sesi.findMany({
        where: { id_event: idEvent },
        select: { id_sesi: true, id_lokasi: true },
      }),
      db.event_lokasi.findMany({
        where: { id_event: idEvent },
        select: { id_lokasi: true, nama: true },
      }),
      db.event.findUnique({ where: { id_event: idEvent }, select: { wwtype: true } }),
    ])
    // Event nasional hanya boleh di-scan Sekretariat Nasional.
    if (needsNasionalTicketApproval(gate?.wwtype) && !isNasionalAdmin(pengurus.username)) {
      return { success: false, reason: 'nasional_only' }
    }
    const hasSesi = sesiRows.length > 0
    let resolvedSesi: number | null = null
    let resolvedLokasi: number | null = null

    if (hasSesi) {
      if (idSesi == null) return { success: false, reason: 'sesi_required' }
      if (!sesiRows.some((s) => s.id_sesi === idSesi)) {
        return { success: false, reason: 'sesi_invalid' }
      }
      resolvedSesi = idSesi

      // Multi-lokasi: operator memilih lokasi per sesi; satu sesi hanya satu lokasi.
      if (lokasiRows.length > 0) {
        if (idLokasi == null) return { success: false, reason: 'lokasi_required' }
        if (!lokasiRows.some((l) => l.id_lokasi === idLokasi)) {
          return { success: false, reason: 'lokasi_invalid' }
        }
        const locked = sesiRows.find((x) => x.id_sesi === idSesi)?.id_lokasi
        if (locked != null && locked !== idLokasi) {
          return {
            success: false,
            reason: 'lokasi_conflict',
            lokasi: lokasiRows.find((l) => l.id_lokasi === locked)?.nama ?? '',
          }
        }
        resolvedLokasi = idLokasi
      }
    } else if (lokasiRows.length > 0) {
      // Lokasi tanpa sesi tidak ada yang dikunci; tetap wajib pilih lokasi yang sah.
      if (idLokasi == null) return { success: false, reason: 'lokasi_required' }
      if (!lokasiRows.some((l) => l.id_lokasi === idLokasi)) {
        return { success: false, reason: 'lokasi_invalid' }
      }
    }

    const existing = await db.absen.findFirst({
      where: absenDuplicateWhere(idPeserta, idEvent, resolvedSesi),
      select: { id_absen: true },
    })
    if (existing) return { success: false, reason: 'already_scanned' }

    const [peserta, eventGate, ticket] = await Promise.all([
      db.peserta.findUnique({
        where: { id_peserta: idPeserta },
        select: { nama: true, gereja: true },
      }),
      db.event.findUnique({
        where: { id_event: idEvent },
        select: { wwtype: true },
      }),
      db.registrasi.findUnique({
        where: { id_peserta_id_event: { id_peserta: idPeserta, id_event: idEvent } },
        select: { status: true },
      }),
    ])
    if (
      needsNasionalTicketApproval(eventGate?.wwtype) &&
      !canAbsenNasionalTicket(ticket?.status)
    ) {
      return { success: false, reason: 'not_approved' }
    }

    // Absen row first (Presensi source of truth), then flip registrasi status.
    await db.$transaction(async (tx) => {
      // Kunci sesi ke lokasi pada scan pertama. Update bersyarat (id_lokasi IS NULL)
      // supaya dua perangkat yang scan bersamaan tidak sama-sama menang.
      if (resolvedSesi != null && resolvedLokasi != null) {
        const claimed = await tx.event_sesi.updateMany({
          where: { id_sesi: resolvedSesi, id_lokasi: null },
          data: { id_lokasi: resolvedLokasi },
        })
        if (claimed.count === 0) {
          const row = await tx.event_sesi.findUnique({
            where: { id_sesi: resolvedSesi },
            select: { id_lokasi: true },
          })
          if (row?.id_lokasi !== resolvedLokasi) {
            const other = row?.id_lokasi != null
              ? await tx.event_lokasi.findUnique({
                  where: { id_lokasi: row.id_lokasi },
                  select: { nama: true },
                })
              : null
            throw new LokasiConflict(other?.nama ?? '')
          }
        }
      }
      await tx.absen.create({
        data: {
          id_peserta: idPesertaStr,
          id_peserta_int: idPeserta,
          email: payload.e || '',
          id_event: idEventStr,
          id_event_int: idEvent,
          id_sesi: resolvedSesi,
          hadir: '1',
          timestamp: new Date(),
          lampiran: '',
          approve: '',
        },
      })
      // Scan wins even if auto-absence already flipped confirmed → absence
      await tx.registrasi.updateMany({
        where: {
          id_peserta: idPeserta,
          id_event: idEvent,
          status: { in: ['confirmed', 'absence'] },
        },
        data: { status: 'attend' },
      })
    })

    // Don't let cache revalidation flip a successful write into a client error
    try {
      revalidatePath(`/dashboard/kota/alk/event/${idEvent}`)
      revalidatePath('/dashboard/kota/alk')
    } catch {
      /* ok outside request scope (scripts/tests) */
    }

    const event = await db.event.findUnique({
      where: { id_event: idEvent },
      select: { id_cabang: true, nama_event: true },
    })
    if (event?.id_cabang === NASIONAL_EVENT_CABANG) {
      void notifyTelegram(
        formatTelegramMessage({
          action: 'Absen',
          eventName: event.nama_event,
          fields: {
            Peserta: peserta?.nama ?? idPeserta,
            ID: idEvent,
          },
          layout: 'peserta',
        }),
        { buttons: [{ text: '📋 Detail Event', url: eventDetailLink(idEvent) }] },
      )
    }

    try {
      revalidatePath(`/dashboard/v2/kota/alk/event/${idEvent}`)
      revalidatePath('/dashboard/v2/kota/alk')
      revalidatePath('/dashboard/v2/kota/alk/scanner')
    } catch {
      /* ok */
    }

    return { success: true, nama: peserta?.nama ?? '', gereja: peserta?.gereja ?? '' }
  } catch (err) {
    if (err instanceof LokasiConflict) {
      return { success: false, reason: 'lokasi_conflict', lokasi: err.lokasi }
    }
    console.error('[createAbsen]', err)
    return { success: false, reason: 'error' }
  }
}

export type RecentAbsenRow = {
  id_absen: number
  nama: string
  gereja: string
  gender: string
  id_sesi: number | null
  time: string
}

export async function getRecentAbsenForEvent(
  idEvent: number,
  limit = 5,
): Promise<RecentAbsenRow[]> {
  const rows = await db.absen.findMany({
    where: {
      OR: [{ id_event_int: idEvent }, { id_event: String(idEvent) }],
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    select: {
      id_absen: true,
      id_peserta_int: true,
      id_peserta: true,
      id_sesi: true,
      timestamp: true,
    },
  })
  const ids = rows
    .map((r) => r.id_peserta_int ?? Number(r.id_peserta))
    .filter((n) => Number.isFinite(n))
  const pesertas = ids.length
    ? await db.peserta.findMany({
        where: { id_peserta: { in: ids } },
        select: { id_peserta: true, nama: true, gereja: true, gender: true },
      })
    : []
  const byId = new Map(pesertas.map((p) => [p.id_peserta, p]))
  return rows.map((r) => {
    const pid = r.id_peserta_int ?? Number(r.id_peserta)
    const p = byId.get(pid)
    const ts = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp)
    return {
      id_absen: r.id_absen,
      nama: p?.nama ?? `Peserta #${pid}`,
      gereja: p?.gereja ?? '',
      gender: p?.gender ?? 'L',
      id_sesi: r.id_sesi,
      time: ts.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta',
      }),
    }
  })
}
