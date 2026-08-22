'use server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { eventDateTime, isOnlineAbsenOpen } from '@/lib/event-absen-window'
import { NASIONAL_EVENT_CABANG } from '@/lib/event-cabang'
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

export async function createAbsen(payload: QRPayload): Promise<
  | { success: true; nama: string; gereja: string }
  | { success: false; reason: 'invalid_payload' | 'already_scanned' | 'error' }
> {
  const idPeserta = Number(payload.p)
  const idEvent = Number(payload.ev)
  if (!idPeserta || !idEvent) return { success: false, reason: 'invalid_payload' }

  const idPesertaStr = String(payload.p)
  const idEventStr = String(payload.ev)

  try {
    const existing = await db.absen.findFirst({
      where: {
        OR: [
          { id_peserta: idPesertaStr, id_event: idEventStr },
          { id_peserta_int: idPeserta, id_event_int: idEvent },
        ],
      },
      select: { id_absen: true },
    })
    if (existing) return { success: false, reason: 'already_scanned' }

    const peserta = await db.peserta.findUnique({
      where: { id_peserta: idPeserta },
      select: { nama: true, gereja: true },
    })

    // Absen row first (Presensi source of truth), then flip registrasi status.
    await db.$transaction(async (tx) => {
      await tx.absen.create({
        data: {
          id_peserta: idPesertaStr,
          id_peserta_int: idPeserta,
          email: payload.e || '',
          id_event: idEventStr,
          id_event_int: idEvent,
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

    return { success: true, nama: peserta?.nama ?? '', gereja: peserta?.gereja ?? '' }
  } catch (err) {
    console.error('[createAbsen]', err)
    return { success: false, reason: 'error' }
  }
}
