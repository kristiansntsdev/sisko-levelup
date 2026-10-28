'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { isNasionalAdmin, NASIONAL_EVENT_CABANG } from '@/lib/event-cabang'
import { resolveEventPosterUrl } from '@/lib/event-poster'
import {
  needsNasionalTicketApproval,
  ticketStatusOnRequest,
} from '@/lib/registrasi-status'
import { setActor } from '@/lib/request-context'
import {
  formatTelegramMessage,
  notifyTelegram,
  eventDetailLink,
  tiketNasionalApproveLink,
} from '@/lib/telegram'
import { USERLEVEL_LABEL } from '@/lib/pwa-member'
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

export type CreateRegistrasiResult =
  | { id: number; pending?: true }
  | { full: true }

const LIVE_TICKET = ['pending', 'confirmed', 'attend', 'absence'] as const

export async function createRegistrasi(idPeserta: number, idEvent: number): Promise<CreateRegistrasiResult> {
  const event = await db.event.findUnique({
    where: { id_event: idEvent },
    select: { id_cabang: true, nama_event: true, wwtype: true, targetjumlah: true },
  })
  if (!event) return { full: true }

  const existing = await db.registrasi.findUnique({
    where: { id_peserta_id_event: { id_peserta: idPeserta, id_event: idEvent } },
    select: { id_registrasi: true, status: true },
  })

  // Jangan downgrade tiket yang sudah live (confirmed/attend/absence/pending).
  if (existing && LIVE_TICKET.includes(existing.status as (typeof LIVE_TICKET)[number])) {
    return existing.status === 'pending'
      ? { id: existing.id_registrasi, pending: true }
      : { id: existing.id_registrasi }
  }

  const target = event.targetjumlah ?? 0
  if (target > 0) {
    const taken = await countActiveRegistrasi(idEvent)
    // ponytail: dua request barengan bisa lewati hitungan ini; kunci baris event kalau perlu ketat.
    if (taken >= target) return { full: true }
  }

  const status = ticketStatusOnRequest(event.wwtype)
  const row = await db.registrasi.upsert({
    where: { id_peserta_id_event: { id_peserta: idPeserta, id_event: idEvent } },
    create: { id_peserta: idPeserta, id_event: idEvent, status },
    update: { status },
    select: { id_registrasi: true },
  })

  if (event.id_cabang === NASIONAL_EVENT_CABANG || needsNasionalTicketApproval(event.wwtype)) {
    const peserta = await db.peserta.findUnique({
      where: { id_peserta: idPeserta },
      select: { nama: true },
    })
    const pending = status === 'pending'
    void notifyTelegram(
      formatTelegramMessage({
        action: pending ? 'Pengajuan Tiket' : 'Registrasi',
        eventName: event.nama_event,
        fields: {
          Peserta: peserta?.nama ?? idPeserta,
          ID: idEvent,
          ...(pending ? { Status: 'Menunggu Sekretariat Nasional' } : {}),
        },
        layout: 'peserta',
      }),
      {
        buttons: [
          pending
            ? { text: '✅ Approval Tiket', url: tiketNasionalApproveLink() }
            : { text: '📋 Detail Event', url: eventDetailLink(idEvent) },
        ],
      },
    )
  }
  return status === 'pending' ? { id: row.id_registrasi, pending: true } : { id: row.id_registrasi }
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

export type RegistrasiMine =
  | { id: number; status: 'pending' }
  | { id: number; status: 'confirmed' | 'attend' | 'absence' }

/** Pending atau tiket live — untuk CTA View Event. */
export async function findRegistrasiMine(
  idPeserta: number,
  idEvent: number,
): Promise<RegistrasiMine | null> {
  const row = await db.registrasi.findFirst({
    where: {
      id_peserta: idPeserta,
      id_event: idEvent,
      status: { in: ['pending', 'confirmed', 'attend', 'absence'] },
    },
    select: { id_registrasi: true, status: true },
  })
  if (!row) return null
  if (row.status === 'pending') return { id: row.id_registrasi, status: 'pending' }
  return { id: row.id_registrasi, status: row.status as 'confirmed' | 'attend' | 'absence' }
}

type Ok = { ok: true }
type Err = { ok: false; error: string }
type Result = Ok | Err

const NASIONAL_TICKET_PATHS = [
  '/dashboard/v2/kota/alk',
  '/dashboard/v2/kota/alk/tiket-nasional',
] as const

async function requireNasionalAlk() {
  const pengurusId = (await cookies()).get('pengurus_id')?.value
  if (!pengurusId) return null
  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { username: true, divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk' || !isNasionalAdmin(pengurus.username)) {
    return null
  }
  setActor({ type: 'pengurus', id: Number(pengurusId), label: pengurus.username })
  return pengurus
}

function revalidateNasionalTickets() {
  for (const p of NASIONAL_TICKET_PATHS) revalidatePath(p)
}

export type TiketNasionalPending = {
  id_registrasi: number
  id_peserta: number
  id_event: number
  nama: string
  usercode: string
  level: string
  kotaNama: string
  eventName: string
  tglDisplay: string
}

export async function listPendingTiketNasional(): Promise<TiketNasionalPending[]> {
  const nasional = await requireNasionalAlk()
  if (!nasional) return []
  const rows = await db.registrasi.findMany({
    where: {
      status: 'pending',
      event: { wwtype: 'nasional' },
    },
    orderBy: { id_registrasi: 'desc' },
    select: {
      id_registrasi: true,
      id_peserta: true,
      id_event: true,
      peserta: {
        select: { nama: true, usercode: true, userlevel: true, kotalevelup: true },
      },
      event: {
        select: { nama_event: true, tglevent: true },
      },
    },
  })
  if (rows.length === 0) return []
  const kotaIds = [
    ...new Set(
      rows
        .map((r) => Number(r.peserta?.kotalevelup))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  ]
  const cabangs =
    kotaIds.length > 0
      ? await db.cabang.findMany({
          where: { id_cabang: { in: kotaIds } },
          select: { id_cabang: true, namacabang: true },
        })
      : []
  const kotaMap = new Map(cabangs.map((c) => [String(c.id_cabang), c.namacabang]))

  return rows.map((r) => {
    const tgl = r.event?.tglevent
    const kota = r.peserta?.kotalevelup ?? ''
    return {
      id_registrasi: r.id_registrasi,
      id_peserta: r.id_peserta,
      id_event: r.id_event,
      nama: r.peserta?.nama ?? '',
      usercode: r.peserta?.usercode ?? '',
      level: USERLEVEL_LABEL[r.peserta?.userlevel ?? ''] ?? r.peserta?.userlevel ?? '—',
      kotaNama: kotaMap.get(kota) ?? (kota ? `Kota #${kota}` : '—'),
      eventName: r.event?.nama_event ?? '',
      tglDisplay: tgl
        ? tgl.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
          })
        : '',
    }
  })
}

export async function countPendingTiketNasional(): Promise<number> {
  const nasional = await requireNasionalAlk()
  if (!nasional) return 0
  return db.registrasi.count({
    where: { status: 'pending', event: { wwtype: 'nasional' } },
  })
}

export async function approveTiketNasional(idRegistrasi: number): Promise<Result> {
  const nasional = await requireNasionalAlk()
  if (!nasional) return { ok: false, error: 'Akses ditolak' }
  const row = await db.registrasi.findUnique({
    where: { id_registrasi: idRegistrasi },
    select: {
      id_registrasi: true,
      status: true,
      id_peserta: true,
      id_event: true,
      event: { select: { wwtype: true, nama_event: true } },
      peserta: { select: { nama: true } },
    },
  })
  if (!row || row.status !== 'pending') return { ok: false, error: 'Pengajuan tidak ditemukan' }
  if (!needsNasionalTicketApproval(row.event?.wwtype)) {
    return { ok: false, error: 'Bukan event nasional' }
  }

  await db.registrasi.update({
    where: { id_registrasi: idRegistrasi },
    data: { status: 'confirmed' },
  })

  void notifyTelegram(
    formatTelegramMessage({
      action: 'Tiket Disetujui',
      eventName: row.event?.nama_event ?? '',
      fields: {
        Peserta: row.peserta?.nama ?? row.id_peserta,
        ID: row.id_event,
      },
      layout: 'peserta',
    }),
    { buttons: [{ text: '📋 Detail Event', url: eventDetailLink(row.id_event) }] },
  )

  revalidateNasionalTickets()
  revalidatePath(`/join/${row.id_event}`)
  revalidatePath(`/dashboard/tiket/${idRegistrasi}`)
  return { ok: true }
}

export async function rejectTiketNasional(idRegistrasi: number): Promise<Result> {
  const nasional = await requireNasionalAlk()
  if (!nasional) return { ok: false, error: 'Akses ditolak' }
  const row = await db.registrasi.findUnique({
    where: { id_registrasi: idRegistrasi },
    select: {
      id_registrasi: true,
      status: true,
      id_event: true,
      event: { select: { wwtype: true } },
    },
  })
  if (!row || row.status !== 'pending') return { ok: false, error: 'Pengajuan tidak ditemukan' }
  if (!needsNasionalTicketApproval(row.event?.wwtype)) {
    return { ok: false, error: 'Bukan event nasional' }
  }

  await db.registrasi.update({
    where: { id_registrasi: idRegistrasi },
    data: { status: 'cancelled' },
  })
  revalidateNasionalTickets()
  revalidatePath(`/join/${row.id_event}`)
  return { ok: true }
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
