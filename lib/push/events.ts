/** Push yang dipicu aksi event. Semua fungsi fire-and-forget (`void ...`) dan tidak pernah melempar. Hanya server. */
import { db } from '@/lib/db'
import { NASIONAL_EVENT_CABANG } from '@/lib/event-cabang'
import { isEventFullyApproved } from '@/lib/event-approval'
import { wibToday } from '@/lib/wib'
import { berlangganan, kirimPush, klaimPush, pushAktif, TTL_BIASA } from './send'
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
