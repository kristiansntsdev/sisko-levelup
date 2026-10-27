import { db } from '@/lib/db'
import { requireAlkPengurus } from '@/lib/alk-auth'
import {
  getAllEventsByKotalevelup,
  getAlkBerandaStats,
} from '@/lib/actions/event'
import { getKasKota } from '@/lib/actions/kas-kota'
import { countPendingSquadApprovals } from '@/lib/actions/upgrade'
import { BerandaClient } from '@/components/alk-v2/beranda'

export default async function AlkV2BerandaPage() {
  const pengurus = await requireAlkPengurus()
  const idCabang = Number(pengurus.cabang)

  const [events, cabang, kasKota, stats, pendingApprovals] = await Promise.all([
    getAllEventsByKotalevelup(pengurus.isNasional ? null : pengurus.cabang),
    db.cabang.findUnique({
      where: { id_cabang: idCabang },
      select: { namacabang: true },
    }),
    getKasKota(idCabang),
    getAlkBerandaStats(pengurus.isNasional ? null : pengurus.cabang),
    countPendingSquadApprovals(),
  ])

  return (
    <BerandaClient
      nama={pengurus.nama}
      namaCabang={cabang?.namacabang ?? (pengurus.isNasional ? 'Nasional' : pengurus.cabang)}
      stats={stats}
      saldo={kasKota.saldo}
      pendingApprovals={pendingApprovals}
      events={events}
      isNasional={pengurus.isNasional}
    />
  )
}
