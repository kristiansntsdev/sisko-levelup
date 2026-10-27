'use server'
import { db } from '@/lib/db'
import { NASIONAL_EVENT_CABANG } from '@/lib/event-cabang'
import { resolveEventPosterUrl } from '@/lib/event-poster'
import { formatTelegramMessage, notifyTelegram, eventDetailLink } from '@/lib/telegram'
import { wibStartOfMonth, wibStartOfNextMonth, wibToday } from '@/lib/wib'

export async function updatePesertaProfile(
  idPeserta: number,
  data: {
    nama: string
    nowa: string
    /** Omit on profil edit — kota locked after daftar. */
    kotalevelup?: string
    gereja: string
    sekolah: string
    idTempatKerja: number | null
    gender?: string
    tempatlahir?: string
    tgllahir?: string
    pendidikan?: string
    jurusan?: string
    provinsi?: string
    kabupaten?: string
    kecamatan?: string
    desa?: string
    alamat?: string
  },
) {
  await db.peserta.update({
    where: { id_peserta: idPeserta },
    data: {
      nama: data.nama,
      nowa: data.nowa,
      ...(data.kotalevelup != null ? { kotalevelup: data.kotalevelup } : {}),
      gereja: data.gereja,
      pekerjaan: data.sekolah,
      id_tempat_kerja: data.idTempatKerja,
      ...(data.gender != null ? { gender: data.gender } : {}),
      ...(data.tempatlahir != null ? { tempatlahir: data.tempatlahir } : {}),
      ...(data.tgllahir != null ? { tgllahir: data.tgllahir } : {}),
      ...(data.pendidikan != null ? { pendidikan: data.pendidikan } : {}),
      ...(data.jurusan != null ? { jurusan: data.jurusan } : {}),
      ...(data.provinsi != null ? { provinsi: data.provinsi } : {}),
      ...(data.kabupaten != null ? { kabupaten: data.kabupaten } : {}),
      ...(data.kecamatan != null ? { kecamatan: data.kecamatan } : {}),
      ...(data.desa != null ? { desa: data.desa } : {}),
      ...(data.alamat != null ? { alamat: data.alamat } : {}),
    },
  })
}

/** Tiket yang masih memegang kursi. `cancelled` tidak dihitung. */
export async function countActiveRegistrasi(idEvent: number): Promise<number> {
  return db.registrasi.count({
    where: { id_event: idEvent, status: { not: 'cancelled' } },
  })
}

export type CreateRegistrasiResult = { id: number } | { full: true }

export async function createRegistrasi(idPeserta: number, idEvent: number): Promise<CreateRegistrasiResult> {
  const existing = await db.registrasi.findUnique({
    where: { id_peserta_id_event: { id_peserta: idPeserta, id_event: idEvent } },
    select: { status: true },
  })
  const live = existing != null && existing.status !== 'cancelled'
  if (!live) {
    const cap = await db.event.findUnique({
      where: { id_event: idEvent },
      select: { targetjumlah: true },
    })
    const target = cap?.targetjumlah ?? 0
    if (target > 0) {
      const taken = await countActiveRegistrasi(idEvent)
      // ponytail: dua request barengan bisa lewati hitungan ini; kunci baris event kalau perlu ketat.
      if (taken >= target) return { full: true }
    }
  }

  const row = await db.registrasi.upsert({
    where: { id_peserta_id_event: { id_peserta: idPeserta, id_event: idEvent } },
    create: { id_peserta: idPeserta, id_event: idEvent, status: 'confirmed' },
    update: { status: 'confirmed' },
    select: { id_registrasi: true },
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
  return { id: row.id_registrasi }
}

export async function checkRegistrasi(idPeserta: number, idEvent: number): Promise<boolean> {
  const id = await findRegistrasiId(idPeserta, idEvent)
  return id != null
}

/** Any non-cancelled ticket for this event (confirmed / attend / absence). */
export async function findRegistrasiId(idPeserta: number, idEvent: number): Promise<number | null> {
  const row = await db.registrasi.findFirst({
    where: {
      id_peserta: idPeserta,
      id_event: idEvent,
      status: { in: ['confirmed', 'attend', 'absence'] },
    },
    select: { id_registrasi: true },
  })
  return row?.id_registrasi ?? null
}

export async function getRegistrasiDetail(idRegistrasi: number) {
  const row = await db.registrasi.findUnique({
    where: { id_registrasi: idRegistrasi },
    select: {
      id_registrasi: true,
      id_peserta: true,
      id_event: true,
      status: true,
      peserta: { select: { nama: true, usercode: true } },
      event: {
        select: {
          nama_event: true,
          posterevent: true,
          image_url: true,
          jenisevent: true,
          tglevent: true,
          tgleventselesai: true,
          jamevent: true,
          jamselesaievent: true,
          alamatevent: true,
        },
      },
    },
  })
  if (!row) return null
  const tgl = row.event?.tglevent
  const tglSelesai = row.event?.tgleventselesai
  return {
    id_registrasi: row.id_registrasi,
    id_peserta: row.id_peserta,
    id_event: row.id_event,
    status: row.status,
    nama_event: row.event?.nama_event ?? '',
    posterUrl: resolveEventPosterUrl(row.event?.posterevent, row.event?.image_url) || null,
    jenisevent: row.event?.jenisevent ?? '',
    tglDisplay: tgl
      ? tgl.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        })
      : '',
    tglSelesaiDisplay: tglSelesai
      ? tglSelesai.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        })
      : '',
    jamevent: row.event?.jamevent ?? '',
    jamselesaievent: row.event?.jamselesaievent ?? '',
    alamatevent: row.event?.alamatevent ?? '',
    pesertaNama: row.peserta?.nama ?? '',
    usercode: row.peserta?.usercode ?? '',
    tglSelesaiMs: tglSelesai?.getTime() ?? 0,
  }
}

export async function getRegistrasiByPeserta(idPeserta: number) {
  // tgleventselesai is DATE (UTC midnight tanggal WIB). Bandingkan dengan
  // tanggal WIB hari ini supaya hari-H event belum dianggap lewat.
  await db.registrasi.updateMany({
    where: {
      id_peserta: idPeserta,
      status: 'confirmed',
      event: { tgleventselesai: { lt: wibToday() } },
    },
    data: { status: 'absence' },
  })

  // Tiket Aktif = joined this month, including past dates (absence) so
  // online absen masih bisa diakses kalau lupa. Exclude attend.
  const startOfMonth = wibStartOfMonth()
  const startOfNextMonth = wibStartOfNextMonth()

  const rows = await db.registrasi.findMany({
    where: {
      id_peserta: idPeserta,
      status: { in: ['confirmed', 'absence', 'attend'] },
      event: {
        tglevent: { gte: startOfMonth, lt: startOfNextMonth },
      },
    },
    select: {
      id_registrasi: true,
      id_event: true,
      status: true,
      event: {
        select: {
          nama_event: true,
          tglevent: true,
          tgleventselesai: true,
          jamevent: true,
          jamselesaievent: true,
          posterevent: true,
          image_url: true,
          jenisevent: true,
          wwtype: true,
          alamatevent: true,
        },
      },
    },
    orderBy: { event: { tglevent: 'asc' } },
  })

  const WW: Record<string, string> = { bulanan: 'WW Bulanan', jfe: 'WW JFE', nasional: 'Nasional' }
  const todayMs = wibToday().getTime()

  return rows.map((r) => {
    const tglevent = r.event?.tglevent ? new Date(r.event.tglevent) : null
    const tglSelesai = r.event?.tgleventselesai ? new Date(r.event.tgleventselesai) : null
    const endMs = tglSelesai?.getTime() ?? tglevent?.getTime() ?? 0
    const ticketState =
      r.status === 'attend' ? 'Hadir'
        : r.status === 'absence' ? 'Tidak hadir'
          : endMs < todayMs ? 'Tidak hadir'
            : 'Terdaftar'
    return {
      id_registrasi: r.id_registrasi,
      id_event: r.id_event,
      status: r.status,
      nama_event: r.event?.nama_event ?? '',
      tglDisplay: tglevent
        ? tglevent.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
          })
        : '',
      tglMs: tglevent?.getTime() ?? 0,
      tglSelesaiMs: endMs,
      jamevent: r.event?.jamevent ?? '',
      jamselesaievent: r.event?.jamselesaievent ?? '',
      jenisevent: r.event?.jenisevent ?? '',
      category: WW[r.event?.wwtype ?? ''] ?? 'Event',
      posterUrl: resolveEventPosterUrl(r.event?.posterevent, r.event?.image_url),
      alamatevent: r.event?.alamatevent ?? '',
      ticketState: ticketState as 'Terdaftar' | 'Hadir' | 'Tidak hadir',
      active: r.status === 'confirmed' || (r.status === 'absence' && endMs >= todayMs),
    }
  })
}
