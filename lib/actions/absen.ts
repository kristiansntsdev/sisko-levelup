'use server'
import { db } from '@/lib/db'
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

  const existing = await db.absen.findFirst({
    where: { id_peserta: payload.p, id_event: payload.ev },
    select: { id_absen: true },
  })
  if (existing) return { success: false, reason: 'already_scanned' }

  const peserta = await db.peserta.findUnique({
    where: { id_peserta: idPeserta },
    select: { nama: true, gereja: true },
  })

  await Promise.all([
    db.absen.create({
      data: {
        id_peserta: payload.p,
        id_peserta_int: idPeserta,
        email: payload.e,
        id_event: payload.ev,
        id_event_int: idEvent,
        hadir: '1',
        timestamp: new Date(),
        lampiran: '',
        approve: '',
      },
    }),
    db.registrasi.updateMany({
      where: { id_peserta: idPeserta, id_event: idEvent, status: 'confirmed' },
      data: { status: 'attend' },
    }),
  ])

  return { success: true, nama: peserta?.nama ?? '', gereja: peserta?.gereja ?? '' }
}
