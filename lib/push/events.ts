/** Push yang dipicu aksi event. Semua fungsi fire-and-forget (`void ...`) dan tidak pernah melempar. Hanya server. */
import { db } from '@/lib/db'
import { NASIONAL_EVENT_CABANG } from '@/lib/event-cabang'
import { isEventFullyApproved } from '@/lib/event-approval'
import { wibToday } from '@/lib/wib'
import { berlangganan, kirimPush, klaimPush, pushAktif, TTL_BIASA, type HasilKirim } from './send'
import { pushPengurus, urlEventPengurus } from './pengurus'
import { pesertaLihatEvent } from './rules'

export async function namaKota(idCabang: string): Promise<string> {
  if (idCabang === NASIONAL_EVENT_CABANG) return 'Nasional'
  const row = await db.cabang.findUnique({ where: { id_cabang: Number(idCabang) }, select: { namacabang: true } })
  return row?.namacabang ?? 'LevelUP'
}

function tanggalPendek(d: Date): string {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

/** Event baru tayang (disetujui Sekretariat + BRIM Nasional): peserta yang berhak melihat + pengurus kota. Sekali per event. */
export async function pushEventTayang(idEvent: number, aktorId?: number | null): Promise<void> {
  try {
    if (!pushAktif()) return
    const ev = await db.event.findUnique({
      where: { id_event: idEvent },
      select: {
        id_event: true, nama_event: true, tglevent: true, tgleventselesai: true, jamevent: true,
        id_cabang: true, wwtype: true, approvenasional: true, approvebrimnas: true,
      },
    })
    if (!ev || !isEventFullyApproved(ev) || ev.tgleventselesai < wibToday()) return
    if (!(await klaimPush(`event-tayang:${idEvent}`))) return

    const kota = await namaKota(ev.id_cabang)
    const kapan = `${tanggalPendek(ev.tglevent)}${ev.jamevent ? ` · ${ev.jamevent}` : ''}`

    const subs = await berlangganan()
    if (subs.peserta.length) {
      const rows = await db.peserta.findMany({
        where: { id_peserta: { in: subs.peserta } },
        select: { id_peserta: true, userlevel: true, kotalevelup: true },
      })
      const ids = rows
        .filter((p) => pesertaLihatEvent(p, { id_cabang: ev.id_cabang, wwtype: ev.wwtype }))
        .map((p) => p.id_peserta)
      await kirimPush(
        { peserta: ids },
        { title: `Event baru · ${kota}`, body: `${ev.nama_event} — ${kapan}`, url: `/join/${idEvent}`, tag: `event-${idEvent}` },
        { ttl: TTL_BIASA },
      )
    }
    await pushPengurus({
      title: 'Event kamu sudah tayang',
      body: `${ev.nama_event} — ${kapan}`,
      tag: `event-tayang-${idEvent}`,
      idCabang: ev.id_cabang,
      pusat: ev.id_cabang === NASIONAL_EVENT_CABANG,
      aktorId,
      url: (peran) => urlEventPengurus(peran, idEvent),
    })
  } catch (err) {
    console.error('[push] pushEventTayang gagal', err)
  }
}

/** Keputusan Sekretariat / BRIM Nasional: pengurus kota pemilik event + pusat lainnya (urgency tinggi). */
export async function pushFeedbackKota(input: {
  idEvent: number
  idCabang: string
  namaEvent: string
  oleh: 'Sekretariat Nasional' | 'BRIM Nasional'
  keputusan: 'Disetujui' | 'Ditolak'
  alasan?: string
  aktorId?: number | null
}): Promise<void> {
  const { idEvent, idCabang, namaEvent, oleh, keputusan, alasan, aktorId } = input
  await pushPengurus({
    title: `${keputusan} ${oleh}`,
    body: `${namaEvent}${alasan ? ` — ${alasan}` : ''}`,
    tag: `feedback-${idEvent}-${oleh === 'BRIM Nasional' ? 'brim' : 'sekre'}`,
    renotify: true,
    urgency: 'high',
    idCabang,
    // Pusat ikut (padanan Telegram); pelaku tidak dikirimi.
    pusat: true,
    aktorId,
    url: (peran) => urlEventPengurus(peran, idEvent),
  })
}

/** Padanan alert Telegram untuk pengurus pusat (dan pengurus kota event ini kalau kotaJuga). */
export async function pushAlert(input: {
  judul: string
  isi: string
  tag?: string
  idEvent?: number
  idCabang?: string
  kotaJuga?: boolean
  aktorId?: number | null
  /** Halaman tujuan kalau bukan halaman event. */
  url?: (peran: import('./pengurus').PeranPengurus) => string
}): Promise<void> {
  await pushPengurus({
    title: input.judul,
    body: input.isi,
    tag: input.tag,
    pusat: true,
    idCabang: input.kotaJuga ? input.idCabang : undefined,
    aktorId: input.aktorId,
    url: input.url ?? ((peran) => urlEventPengurus(peran, input.idEvent ?? 0, 'approve')),
  })
}

/**
 * Laporan WW baru (Air Hidup): kabar terbaru untuk semua anggota yang mengaktifkan notifikasi, kecuali pelapornya.
 * Sekali per laporan (klaimPush). Tap → Aliran Air Hidup. Fire-and-forget, tidak pernah melempar.
 */
export async function pushLaporanWw(input: { idLaporan: number; idKota: number; idPelapor: number; jumlah: number; isi: string; foto?: string }): Promise<HasilKirim | null> {
  try {
    if (!pushAktif()) return null
    if (!(await klaimPush(`ww-laporan:${input.idLaporan}`))) return null
    const kota = await namaKota(String(input.idKota))
    const subs = await berlangganan()
    const ids = subs.peserta.filter((id) => id !== input.idPelapor)
    if (!ids.length) return null
    const isi = input.isi.trim().replace(/\s+/g, ' ')
    return await kirimPush(
      { peserta: ids },
      {
        title: `Kabar WW · ${kota}`,
        body: `${input.jumlah} orang minum Air Hidup — “${isi.length > 120 ? `${isi.slice(0, 117)}…` : isi}”`,
        url: '/dashboard/air-hidup',
        tag: `ww-laporan-${input.idLaporan}`,
        ...(input.foto ? { image: input.foto } : {}),
      },
      { ttl: TTL_BIASA },
    )
  } catch (err) {
    console.error('[push] pushLaporanWw gagal', err)
    return null
  }
}

/**
 * Amin baru di laporan WW: kabari pelapornya. Sekali per (laporan, pemberi Amin) supaya batal-lalu-Amin lagi tidak
 * mengirim ulang; tag per laporan membuat Amin berikutnya menggantikan notifikasi sebelumnya. Tidak untuk Amin ke laporan
 * sendiri. Fire-and-forget, tidak pernah melempar.
 */
export async function pushAminWw(input: { idLaporan: number; idPemberi: number; namaPemberi: string }): Promise<void> {
  try {
    if (!pushAktif()) return
    const [lap] = await db.$queryRaw<{ id_peserta: number; id_cabang: number }[]>`
      SELECT id_peserta, id_cabang FROM ww_laporan WHERE id_laporan = ${input.idLaporan} LIMIT 1`
    if (!lap) return
    const pelapor = Number(lap.id_peserta)
    if (pelapor === input.idPemberi) return
    if (!(await klaimPush(`ww-amin:${input.idLaporan}:${input.idPemberi}`))) return
    const kota = await namaKota(String(lap.id_cabang))
    await kirimPush(
      { peserta: [pelapor] },
      {
        title: `${input.namaPemberi} mengaminkan laporan WW-mu 🙏`,
        body: `Laporan WW ${kota} kamu mendapat Amin.`,
        url: '/dashboard/air-hidup',
        tag: `ww-amin-${input.idLaporan}`,
        renotify: true,
      },
      { ttl: TTL_BIASA },
    )
  } catch (err) {
    console.error('[push] pushAminWw gagal', err)
  }
}
