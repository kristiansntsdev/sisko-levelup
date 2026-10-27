import { db } from '@/lib/db'
import { requireAlkPengurus } from '@/lib/alk-auth'
import {
  getAlkBerandaStats,
  getAlkBerandaTodoEvents,
} from '@/lib/actions/event'
import { getKasKota } from '@/lib/actions/kas-kota'
import { countPendingSquadApprovals } from '@/lib/actions/upgrade'
import { countPendingPindahKota } from '@/lib/actions/pindah-kota'
import { BerandaClient } from '@/components/alk-v2/beranda'

export default async function AlkV2BerandaPage() {
  const pengurus = await requireAlkPengurus()
  const idCabang = Number(pengurus.cabang)
  const scope = pengurus.isNasional ? null : pengurus.cabang

  const [events, cabang, kasKota, stats, pendingApprovals, pendingPindahKota] =
    await Promise.all([
      getAlkBerandaTodoEvents(scope),
      db.cabang.findUnique({
        where: { id_cabang: idCabang },
        select: { namacabang: true },
      }),
      getKasKota(idCabang),
      getAlkBerandaStats(scope),
      countPendingSquadApprovals(),
      pengurus.isNasional ? countPendingPindahKota() : Promise.resolve(0),
    ])

  return (
    <BerandaClient
      nama={pengurus.nama}
      namaCabang={cabang?.namacabang ?? (pengurus.isNasional ? 'Nasional' : pengurus.cabang)}
      stats={stats}
      saldo={kasKota.saldo}
      pendingApprovals={pendingApprovals}
      pendingPindahKota={pendingPindahKota}
      events={events}
      isNasional={pengurus.isNasional}
    />
  )
}
