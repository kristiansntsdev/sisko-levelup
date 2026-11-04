'use server'
import { cookies } from 'next/headers'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { setActor } from '@/lib/request-context'
import { revalidatePath } from 'next/cache'
import { eventDateTime, isOnlineAbsenOpen } from '@/lib/event-absen-window'
import type { QRPayload } from '@/lib/qr'
import { recordAbsen, type RecordAbsenResult } from '@/lib/absen-record'

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
  const result = await recordAbsen(
    { p: String(row.id_peserta), e: email, ev: String(row.id_event) },
    null,
    null,
    { scannerUsername: null },
  )
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

export async function createAbsen(
  payload: QRPayload,
  idSesi?: number | null,
  idLokasi?: number | null,
): Promise<RecordAbsenResult> {
  const pengurus = await requireAlkPengurusForScan()
  if (!pengurus) return { success: false, reason: 'unauthorized' }
  setActor({ type: 'pengurus', id: pengurus.id, label: pengurus.label })
  return recordAbsen(payload, idSesi, idLokasi, { scannerUsername: pengurus.username })
}

export type RecentAbsenRow = {
  id_absen: number
  nama: string
  gereja: string
  gender: string
  id_sesi: number | null
  time: string
}

export type RecentAbsen = { rows: RecentAbsenRow[]; total: number }

/** Absen terbaru + total hadir untuk event; `idSesi` membatasi ke satu sesi (null = semua absen event). */
export async function getRecentAbsenForEvent(
  idEvent: number,
  limit = 5,
  idSesi: number | null = null,
): Promise<RecentAbsen> {
  const where = {
    OR: [{ id_event_int: idEvent }, { id_event: String(idEvent) }],
    ...(idSesi != null ? { id_sesi: idSesi } : {}),
  }
  const [rows, total] = await Promise.all([
    db.absen.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id_absen: true,
        id_peserta_int: true,
        id_peserta: true,
        id_sesi: true,
        timestamp: true,
      },
    }),
    db.absen.count({ where }),
  ])
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
  const list = rows.map((r) => {
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
  return { rows: list, total }
}
