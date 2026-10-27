import { db } from '@/lib/db'
import { requireAlkPengurus } from '@/lib/alk-auth'
import {
  getAlkBerandaStats,
  getAlkBerandaTodoEvents,
} from '@/lib/actions/event'
import { getKasKota } from '@/lib/actions/kas-kota'
import { countPendingSquadApprovals } from '@/lib/actions/upgrade'
import { BerandaClient } from '@/components/alk-v2/beranda'

export default async function AlkV2BerandaPage() {
  const pengurus = await requireAlkPengurus()
  const idCabang = Number(pengurus.cabang)
  const scope = pengurus.isNasional ? null : pengurus.cabang

  const [events, cabang, kasKota, stats, pendingApprovals] = await Promise.all([
    getAlkBerandaTodoEvents(scope),
    db.cabang.findUnique({
      where: { id_cabang: idCabang },
      select: { namacabang: true },
    }),
    getKasKota(idCabang),
    getAlkBerandaStats(scope),
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
