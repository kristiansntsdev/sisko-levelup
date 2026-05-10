'use server'
import { db } from '@/lib/db'

export async function updatePesertaProfile(idPeserta: number, data: { nowa: string; gereja: string; sekolah: string; idTempatKerja: number | null }) {
  await db.peserta.update({
    where: { id_peserta: idPeserta },
    data: {
      nowa: data.nowa,
      gereja: data.gereja,
      pekerjaan: data.sekolah,
      id_tempat_kerja: data.idTempatKerja,
    },
  })
}

export async function createRegistrasi(idPeserta: number, idEvent: number) {
  await db.registrasi.upsert({
    where: { id_peserta_id_event: { id_peserta: idPeserta, id_event: idEvent } },
    create: { id_peserta: idPeserta, id_event: idEvent, status: 'confirmed' },
    update: { status: 'confirmed' },
  })
}

export async function checkRegistrasi(idPeserta: number, idEvent: number): Promise<boolean> {
  const row = await db.registrasi.findFirst({
    where: { id_peserta: idPeserta, id_event: idEvent, status: 'confirmed' },
    select: { id_registrasi: true },
  })
  return !!row
}

export async function getRegistrasiDetail(idRegistrasi: number) {
  const row = await db.registrasi.findUnique({
    where: { id_registrasi: idRegistrasi },
    select: {
      id_peserta: true,
      id_event: true,
      event: { select: { nama_event: true, posterevent: true } },
    },
  })
  if (!row) return null
  return {
    id_peserta: row.id_peserta,
    id_event: row.id_event,
    nama_event: row.event?.nama_event ?? '',
    posterUrl: row.event?.posterevent ?? null,
  }
}

export async function getRegistrasiByPeserta(idPeserta: number) {
  const rows = await db.registrasi.findMany({
    where: { id_peserta: idPeserta, status: 'confirmed' },
    select: {
      id_registrasi: true,
      id_event: true,
      event: { select: { nama_event: true, tglevent: true, jamevent: true, posterevent: true } },
    },
    orderBy: { created_at: 'desc' },
  })

  return rows.map((r) => {
    const tglevent = r.event?.tglevent ? new Date(r.event.tglevent) : null
    return {
      id_registrasi: r.id_registrasi,
      id_event: r.id_event,
      nama_event: r.event?.nama_event ?? '',
      tglDisplay: tglevent
        ? tglevent.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : '',
      tglMs: tglevent?.getTime() ?? 0,
    }
  })
}
