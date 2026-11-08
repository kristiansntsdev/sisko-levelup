import { db } from '@/lib/db'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { getAllEventsByKotalevelup } from '@/lib/actions/event'
import { getKasKota } from '@/lib/actions/kas-kota'
import { KasV2Client } from '@/components/alk-v2/kas'

export default async function AlkV2KasPage() {
  const pengurus = await requireAlkPengurus()
  const idCabang = Number(pengurus.cabang)

  // Event milik kas ini saja (Nasional = cabang 0), sama dengan filter export Excel.
  const [kas, events, cabang] = await Promise.all([
    getKasKota(idCabang),
    getAllEventsByKotalevelup(pengurus.cabang),
    db.cabang.findUnique({ where: { id_cabang: idCabang }, select: { namacabang: true } }),
  ])

  return (
    <KasV2Client
      kas={kas}
      events={events}
      namaCabang={cabang?.namacabang ?? (pengurus.isNasional ? 'Nasional' : pengurus.cabang)}
      exportHref="/api/kas-kota/export"
    />
  )
}
