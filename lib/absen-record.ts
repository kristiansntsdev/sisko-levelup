/**
 * Server-only absen write, shared by the pengurus scanner (createAbsen) and the
 * peserta self-absen flows. NOT a 'use server' module: callers must do their own
 * auth. scannerUsername is set only for pengurus scans (Sekretariat-only rule for
 * event nasional); null = peserta self-absen on their own ticket.
 */
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { NASIONAL_EVENT_CABANG, isNasionalAdmin } from '@/lib/event-cabang'
import { absenDuplicateWhere } from '@/lib/event-sesi'
import { canAbsenNasionalTicket, needsNasionalTicketApproval } from '@/lib/registrasi-status'
import type { QRPayload } from '@/lib/qr'
import { formatTelegramMessage, notifyTelegram, eventDetailLink } from '@/lib/telegram'

class LokasiConflict extends Error {
  constructor(public lokasi: string) {
    super('lokasi_conflict')
  }
}

export async function recordAbsen(
  payload: QRPayload,
  idSesi: number | null | undefined,
  idLokasi: number | null | undefined,
  opts: { scannerUsername: string | null },
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
    if (opts.scannerUsername != null && needsNasionalTicketApproval(gate?.wwtype) && !isNasionalAdmin(opts.scannerUsername)) {
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

export type RecordAbsenResult = Awaited<ReturnType<typeof recordAbsen>>
