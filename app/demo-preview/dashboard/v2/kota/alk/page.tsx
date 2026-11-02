'use client'
import { Loading, useAlk, useLoad } from '@/components/demo-preview/alk'
import { BerandaClient } from '@/components/demo-preview/clone/alk-v2/beranda'
import { getAlkBerandaStats, getAlkBerandaTodoEvents } from '@/components/demo-preview/shim/actions/event'
import { getKasKota } from '@/components/demo-preview/shim/actions/kas-kota'
import { countPendingSquadApprovals } from '@/components/demo-preview/shim/actions/upgrade'

export default function AlkV2BerandaPage() {
  const alk = useAlk()
  const data = useLoad(async () => {
    const scope = alk!.cabang
    const [events, kas, stats, pendingApprovals] = await Promise.all([getAlkBerandaTodoEvents(scope), getKasKota(Number(scope)), getAlkBerandaStats(scope), countPendingSquadApprovals()])
    return { events, kas, stats, pendingApprovals }
  })
  if (!alk || !data) return <Loading />
  return (
    <BerandaClient
      nama={alk.nama}
      namaCabang={alk.namaCabang}
      stats={data.stats}
      saldo={data.kas.saldo}
      pendingApprovals={data.pendingApprovals}
      pendingPindahKota={0}
      pendingTiketNasional={0}
      events={data.events}
      isNasional={false}
    />
  )
}
