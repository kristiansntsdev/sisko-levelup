'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

async function getAlkPengurus() {
  const store = await cookies()
  const id = store.get('pengurus_id')?.value
  if (!id) return null
  const p = await db.pengurus.findUnique({
    where: { id_pengurus: Number(id) },
    select: { kotalevelup: true, divisi: true },
  })
  return p?.divisi === 'brim' ? p : null
}

export interface DokumentasiItem {
  id: number
  id_event: number
  gdrive_link: string
}

export async function getDokumentasiByKota(kotalevelup: string): Promise<DokumentasiItem[]> {
  return db.dokumentasi_kota.findMany({
    where: { kotalevelup },
    select: { id: true, id_event: true, gdrive_link: true },
  })
}

export async function saveDokumentasiKota(
  idEvent: number,
  gdriveLink: string,
): Promise<{ error?: string; success?: boolean }> {
  const pengurus = await getAlkPengurus()
  if (!pengurus) return { error: 'Akses ditolak' }

  await db.dokumentasi_kota.upsert({
    where: { id_event: idEvent },
    create: { id_event: idEvent, kotalevelup: pengurus.kotalevelup, gdrive_link: gdriveLink },
    update: { gdrive_link: gdriveLink },
  })

  revalidatePath('/dashboard/kota/brim/dokumentasi')
  return { success: true }
}

export async function deleteDokumentasiKota(
  idEvent: number,
): Promise<{ error?: string; success?: boolean }> {
  const pengurus = await getAlkPengurus()
  if (!pengurus) return { error: 'Akses ditolak' }

  await db.dokumentasi_kota.deleteMany({ where: { id_event: idEvent, kotalevelup: pengurus.kotalevelup } })
  revalidatePath('/dashboard/kota/brim/dokumentasi')
  return { success: true }
}

export interface DokumentasiPeserta {
  id_event: number
  nama_event: string
  gdrive_link: string
  unlocked: boolean
}

export async function getDokumentasiForPeserta(idPeserta: number): Promise<DokumentasiPeserta[]> {
  const peserta = await db.peserta.findUnique({
    where: { id_peserta: idPeserta },
    select: { kotalevelup: true },
  })
  if (!peserta) return []

  const docs = await db.dokumentasi_kota.findMany({
    where: { kotalevelup: peserta.kotalevelup },
    select: { id_event: true, gdrive_link: true },
  })
  if (!docs.length) return []

  const eventIds = docs.map(d => d.id_event)

  const eventIdStrs = eventIds.map(String)

  const [events, absenList] = await Promise.all([
    db.event.findMany({
      where: { id_event: { in: eventIds } },
      select: { id_event: true, nama_event: true },
    }),
    db.absen.findMany({
      where: {
        AND: [
          { OR: [{ id_peserta_int: idPeserta }, { id_peserta: String(idPeserta) }] },
          { OR: [{ id_event_int: { in: eventIds } }, { id_event: { in: eventIdStrs } }] },
        ],
      },
      select: { id_event: true, id_event_int: true },
    }),
  ])

  const eventMap = new Map(events.map(e => [e.id_event, e.nama_event]))
  const absenSet = new Set<number>()
  for (const a of absenList) {
    absenSet.add(a.id_event_int ?? Number(a.id_event))
  }

  return docs.map(d => ({
    id_event: d.id_event,
    nama_event: eventMap.get(d.id_event) ?? `Event ${d.id_event}`,
    gdrive_link: d.gdrive_link,
    unlocked: absenSet.has(d.id_event),
  }))
}

export async function getAbsenEmails(idEvent: number): Promise<string[]> {
  const rows = await db.absen.findMany({
    where: { id_event_int: idEvent },
    select: { id_peserta_int: true },
  })
  const ids = rows
    .map(r => r.id_peserta_int)
    .filter((id): id is number => id !== null)

  if (!ids.length) return []

  const pesertaList = await db.peserta.findMany({
    where: { id_peserta: { in: ids } },
    select: { email: true },
  })
  return pesertaList.map(p => p.email).filter(Boolean)
}
