'use server'
import { db } from '@/lib/db'
import { NASIONAL_EVENT_CABANG } from '@/lib/event-cabang'
import { formatTelegramMessage, notifyTelegram, eventDetailLink } from '@/lib/telegram'

export async function updatePesertaProfile(idPeserta: number, data: { nama: string; nowa: string; gereja: string; sekolah: string; idTempatKerja: number | null }) {
  await db.peserta.update({
    where: { id_peserta: idPeserta },
    data: {
      nama: data.nama,
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

  const event = await db.event.findUnique({
    where: { id_event: idEvent },
    select: { id_cabang: true, nama_event: true },
  })
  if (event?.id_cabang === NASIONAL_EVENT_CABANG) {
    const peserta = await db.peserta.findUnique({
      where: { id_peserta: idPeserta },
      select: { nama: true },
    })
    void notifyTelegram(
      formatTelegramMessage({
        action: 'Registrasi',
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
      id_registrasi: true,
      id_peserta: true,
      id_event: true,
      status: true,
      event: {
        select: {
          nama_event: true,
          posterevent: true,
          jenisevent: true,
          tgleventselesai: true,
          jamselesaievent: true,
        },
      },
    },
  })
  if (!row) return null
  return {
    id_registrasi: row.id_registrasi,
    id_peserta: row.id_peserta,
    id_event: row.id_event,
    status: row.status,
    nama_event: row.event?.nama_event ?? '',
    posterUrl: row.event?.posterevent ?? null,
    jenisevent: row.event?.jenisevent ?? '',
    tglSelesaiMs: row.event?.tgleventselesai?.getTime() ?? 0,
    jamselesaievent: row.event?.jamselesaievent ?? '',
  }
}

export async function getRegistrasiByPeserta(idPeserta: number) {
  // tgleventselesai is DATE (midnight). Compare against start of today so
  // the event day itself is not treated as already ended.
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  await db.registrasi.updateMany({
    where: {
      id_peserta: idPeserta,
      status: 'confirmed',
      event: { tgleventselesai: { lt: startOfToday } },
    },
    data: { status: 'absence' },
  })

  // Tiket Aktif = joined this month, including past dates (absence) so
  // online absen masih bisa diakses kalau lupa. Exclude attend.
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const rows = await db.registrasi.findMany({
    where: {
      id_peserta: idPeserta,
      status: { in: ['confirmed', 'absence'] },
      event: {
        tglevent: { gte: startOfMonth, lt: startOfNextMonth },
      },
    },
    select: {
      id_registrasi: true,
      id_event: true,
      status: true,
      event: { select: { nama_event: true, tglevent: true, jamevent: true, posterevent: true } },
    },
    orderBy: { event: { tglevent: 'asc' } },
  })

  return rows.map((r) => {
    const tglevent = r.event?.tglevent ? new Date(r.event.tglevent) : null
    return {
      id_registrasi: r.id_registrasi,
      id_event: r.id_event,
      status: r.status,
      nama_event: r.event?.nama_event ?? '',
      tglDisplay: tglevent
        ? tglevent.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : '',
      tglMs: tglevent?.getTime() ?? 0,
    }
  })
}
