import { redirect } from 'next/navigation'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { listPendingPindahKota } from '@/lib/actions/pindah-kota'
import { PindahKotaV2Client } from '@/components/alk-v2/pindah-kota'
import { ALK_BASE } from '@/components/alk-v2/paths'

export default async function AlkV2PindahKotaPage() {
  const pengurus = await requireAlkPengurus()
  if (!pengurus.isNasional) redirect(ALK_BASE)
  const items = await listPendingPindahKota()
  return <PindahKotaV2Client items={items} />
}
