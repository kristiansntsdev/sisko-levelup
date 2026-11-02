import { db } from '@/lib/db'
import { buildSuratKeuangan, type SuratKeuanganData } from '@/components/documents/surat-keuangan'

export type SuratKeuanganResult =
  | { status: 'ok'; data: SuratKeuanganData; idCabang: string; namaCabang: string }
  | { status: 'not_found' }
  | { status: 'not_ready' }

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Data surat pengajuan support dana untuk Keuangan; hanya tersedia setelah Sekretariat Nasional approve. */
export async function loadSuratKeuangan(idEvent: number): Promise<SuratKeuanganResult> {
  const event = await db.event.findUnique({
    where: { id_event: idEvent },
    select: { nama_event: true, tglevent: true, tgleventselesai: true, alamatevent: true, jenisevent: true, id_cabang: true },
  })
  if (!event) return { status: 'not_found' }

  const reimburse = await db.reimburse.findFirst({ where: { id_event: String(idEvent) } })
  if (!reimburse) return { status: 'not_found' }
  if (reimburse.ajukan !== 'Ajukan' || reimburse.approvenasional !== '1') return { status: 'not_ready' }

  const cabangId = Number(event.id_cabang)
  const cabang = Number.isInteger(cabangId) && cabangId > 0
    ? await db.cabang.findUnique({ where: { id_cabang: cabangId }, select: { namacabang: true, leadercabang: true } })
    : null

  // Same match as getEventDetail: absen rows reference the event by int or legacy string id.
  const absen = await db.absen.findMany({
    where: { OR: [{ id_event_int: idEvent }, { id_event: String(idEvent) }] },
    select: { id_peserta: true, id_peserta_int: true },
  })
  const hadir = new Set(
    absen
      .map((a) => a.id_peserta_int ?? parseInt(a.id_peserta, 10))
      .filter((n) => n != null && !isNaN(n)),
  )

  return {
    status: 'ok',
    idCabang: event.id_cabang,
    namaCabang: cabang?.namacabang ?? '',
    data: buildSuratKeuangan({
      event: {
        nama_event: event.nama_event,
        tglMulai: iso(event.tglevent),
        tglSelesai: iso(event.tgleventselesai),
        alamatevent: event.alamatevent,
        jenisevent: event.jenisevent,
      },
      cabang,
      reimburse,
      jumlahHadir: hadir.size,
    }),
  }
}
