'use server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { createAbsen } from '@/lib/actions/absen'
import { createRegistrasi } from '@/lib/actions/registrasi'
import { upsertJobsPlace } from '@/lib/actions/jobs-place'
import {
  eventDateTime,
  onlineAbsenPhase,
  type OnlineAbsenPhase,
} from '@/lib/event-absen-window'
import { isOnlineEvent } from '@/lib/event-link'
import { resolveEventPosterUrl } from '@/lib/event-poster'

export type OnlineCheckinProfile = {
  nama: string
  nowa: string
  gereja: string
  sekolah: string
}

export type OnlineCheckinSesi = {
  id_sesi: number
  nama: string
  jam_mulai: string
  jam_selesai: string
}

export type OnlineCheckinResult =
  /** Registrasi + absen tercatat. */
  | { status: 'attended' }
  /** Registrasi tercatat, absen belum bisa (di luar jendela). */
  | { status: 'registered'; phase: OnlineAbsenPhase; endAtMs: number | null }
  /** Nama / No. WA masih kosong — isi dulu lalu kirim ulang. */
  | { status: 'need_profile' }
  /** Event multi-sesi — peserta pilih sesi yang sedang berjalan. */
  | { status: 'need_sesi'; sesi: OnlineCheckinSesi[] }
  | {
      status: 'failed'
      reason: 'unauthenticated' | 'not_found' | 'not_online' | 'invalid_profile' | 'error'
    }

export type OnlineAbsenEvent = {
  id_event: number
  nama_event: string
  tglDisplay: string
  jamevent: string
  jamselesaievent: string
  posterUrl: string
  jenisevent: string
}

/** Header event untuk halaman `/absen/[eventId]`. */
export async function getOnlineAbsenEvent(id: number): Promise<OnlineAbsenEvent | null> {
  if (!id) return null
  const event = await db.event.findUnique({
    where: { id_event: id },
    select: {
      id_event: true,
      nama_event: true,
      tglevent: true,
      jamevent: true,
      jamselesaievent: true,
      posterevent: true,
      image_url: true,
      jenisevent: true,
    },
  })
  if (!event) return null
  return {
    id_event: event.id_event,
    nama_event: event.nama_event,
    tglDisplay: event.tglevent.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
    jamevent: event.jamevent,
    jamselesaievent: event.jamselesaievent ?? '',
    posterUrl: resolveEventPosterUrl(event.posterevent, event.image_url),
    jenisevent: event.jenisevent ?? '',
  }
}

/**
 * Satu aksi untuk QR event Online: registrasi (kalau belum) lalu absen
 * (kalau jendela absen sudah terbuka). Idempoten — aman dipanggil ulang.
 */
export async function onlineCheckin(
  idEvent: number,
  input?: { profile?: OnlineCheckinProfile; idSesi?: number },
): Promise<OnlineCheckinResult> {
  const session = await auth()
  const idPeserta = session?.user?.idPeserta
  if (!idPeserta) return { status: 'failed', reason: 'unauthenticated' }
  if (!idEvent) return { status: 'failed', reason: 'not_found' }

  const event = await db.event.findUnique({
    where: { id_event: idEvent },
    select: { jenisevent: true, tgleventselesai: true, jamselesaievent: true },
  })
  if (!event) return { status: 'failed', reason: 'not_found' }
  if (!isOnlineEvent(event.jenisevent)) return { status: 'failed', reason: 'not_online' }

  try {
    // 1. Data diri — nama + No. WA wajib sebelum registrasi.
    const profile = input?.profile
    if (profile) {
      const nama = profile.nama.trim()
      const nowa = profile.nowa.trim()
      if (!nama || !nowa) return { status: 'failed', reason: 'invalid_profile' }
      const sekolah = profile.sekolah.trim()
      const idTempatKerja = sekolah ? await upsertJobsPlace(sekolah) : null
      await db.peserta.update({
        where: { id_peserta: idPeserta },
        data: {
          nama,
          nowa,
          gereja: profile.gereja.trim(),
          pekerjaan: sekolah,
          id_tempat_kerja: idTempatKerja,
        },
      })
    } else {
      const peserta = await db.peserta.findUnique({
        where: { id_peserta: idPeserta },
        select: { nama: true, nowa: true },
      })
      if (!peserta?.nama.trim() || !peserta.nowa.trim()) return { status: 'need_profile' }
    }

    // 2. Registrasi — hanya kalau belum ada, supaya status `attend` tidak
    //    turun lagi jadi `confirmed` saat QR di-scan ulang.
    const registrasi = await db.registrasi.findUnique({
      where: { id_peserta_id_event: { id_peserta: idPeserta, id_event: idEvent } },
      select: { id_registrasi: true },
    })
    if (!registrasi) await createRegistrasi(idPeserta, idEvent)

    // 3. Sudah absen? (non-sesi: satu baris cukup; sesi: semua sesi selesai)
    const [sesiRows, absenRows] = await Promise.all([
      db.event_sesi.findMany({
        where: { id_event: idEvent },
        select: { id_sesi: true, nama: true, jam_mulai: true, jam_selesai: true },
        orderBy: { urutan: 'asc' },
      }),
      db.absen.findMany({
        where: {
          OR: [
            { id_peserta_int: idPeserta, id_event_int: idEvent },
            { id_peserta: String(idPeserta), id_event: String(idEvent) },
          ],
        },
        select: { id_sesi: true },
      }),
    ])
    const sudahAbsen = new Set(absenRows.map((a) => a.id_sesi).filter((s): s is number => s != null))
    const sisaSesi = sesiRows.filter((s) => !sudahAbsen.has(s.id_sesi))
    const selesai = sesiRows.length > 0 ? sisaSesi.length === 0 : absenRows.length > 0
    if (selesai) return { status: 'attended' }

    // 4. Jendela absen online (15 menit sebelum jam selesai → akhir bulan).
    const endAt =
      event.tgleventselesai && event.jamselesaievent
        ? eventDateTime(event.tgleventselesai, event.jamselesaievent)
        : null
    const phase = onlineAbsenPhase(new Date(), endAt)
    if (phase !== 'open') {
      return { status: 'registered', phase, endAtMs: endAt?.getTime() ?? null }
    }

    // 5. Multi-sesi: peserta pilih sesi yang diikuti.
    let idSesi: number | null = null
    if (sesiRows.length > 0) {
      const picked = input?.idSesi
      if (picked == null || !sisaSesi.some((s) => s.id_sesi === picked)) {
        return { status: 'need_sesi', sesi: sisaSesi }
      }
      idSesi = picked
    }

    const res = await createAbsen(
      { p: String(idPeserta), e: session.user?.email ?? '', ev: String(idEvent) },
      idSesi,
    )
    if (res.success || res.reason === 'already_scanned') {
      try {
        revalidatePath('/dashboard')
      } catch {
        /* ok di luar request scope */
      }
      return { status: 'attended' }
    }
    return { status: 'failed', reason: 'error' }
  } catch (err) {
    console.error('[onlineCheckin]', err)
    return { status: 'failed', reason: 'error' }
  }
}
