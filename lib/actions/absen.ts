'use server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { QRPayload } from '@/lib/qr'

export async function getPesertaPreview(idPeserta: number) {
  return db.peserta.findUnique({
    where: { id_peserta: idPeserta },
    select: { nama: true, gereja: true },
  })
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

    return { success: true, nama: peserta?.nama ?? '', gereja: peserta?.gereja ?? '' }
  } catch (err) {
    console.error('[createAbsen]', err)
    return { success: false, reason: 'error' }
  }
}
