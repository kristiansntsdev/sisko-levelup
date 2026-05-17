import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getAllEventsByKotalevelup } from '@/lib/actions/event'
import { getKasKota } from '@/lib/actions/kas-kota'
import { AlkClient } from './alk-client'

export default async function AlkDashboardPage() {
  const cookieStore = await cookies()
  const pengurusId = cookieStore.get('pengurus_id')?.value
  if (!pengurusId) redirect('/admin')

  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { id_pengurus: true, nama: true, kotalevelup: true, divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk') redirect('/admin')

  const idCabang = Number(pengurus.kotalevelup)

  const [events, cabang, kasKota] = await Promise.all([
    getAllEventsByKotalevelup(pengurus.kotalevelup),
    db.cabang.findUnique({
      where: { id_cabang: idCabang },
      select: { namacabang: true },
    }),
    getKasKota(idCabang),
  ])

  return (
    <AlkClient
      pengurus={pengurus}
      events={events}
      namaCabang={cabang?.namacabang ?? pengurus.kotalevelup}
      kasKota={kasKota}
    />
  )
}
