import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import {
  getAllEventsByKotalevelup,
  getAlkBerandaStats,
} from '@/lib/actions/event'
import { isNasionalAdmin, resolveEventCabang } from '@/lib/event-cabang'
import { getKasKota } from '@/lib/actions/kas-kota'
import { countPendingSquadApprovals } from '@/lib/actions/upgrade'
import { AlkClient } from './alk-client'

export default async function AlkDashboardPage() {
  const cookieStore = await cookies()
  const pengurusId = cookieStore.get('pengurus_id')?.value
  if (!pengurusId) redirect('/admin')

  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: {
      id_pengurus: true,
      nama: true,
      username: true,
      kotalevelup: true,
      divisi: true,
    },
  })
  if (!pengurus || pengurus.divisi !== 'alk') redirect('/admin')

  const kotalevelup = resolveEventCabang(pengurus)
  const idCabang = Number(kotalevelup)
  const isNasional = isNasionalAdmin(pengurus.username)

  const [events, cabang, kasKota, stats, pendingApprovals] = await Promise.all([
    getAllEventsByKotalevelup(kotalevelup),
    db.cabang.findUnique({
      where: { id_cabang: idCabang },
      select: { namacabang: true },
    }),
    getKasKota(idCabang),
    getAlkBerandaStats(kotalevelup),
    countPendingSquadApprovals(),
  ])

  return (
    <AlkClient
      pengurus={{
        id_pengurus: pengurus.id_pengurus,
        nama: pengurus.nama,
        kotalevelup,
        divisi: pengurus.divisi,
      }}
      events={events}
      namaCabang={cabang?.namacabang ?? (isNasional ? 'Nasional' : kotalevelup)}
      kasKota={kasKota}
      stats={stats}
      pendingApprovals={pendingApprovals}
      isNasional={isNasional}
    />
  )
}
