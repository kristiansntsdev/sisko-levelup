import { redirect } from 'next/navigation'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { listPendingTiketNasional } from '@/lib/actions/registrasi'
import { TiketNasionalV2Client } from '@/components/alk-v2/tiket-nasional'
import { ALK_BASE } from '@/components/alk-v2/paths'

export default async function AlkV2TiketNasionalPage() {
  const pengurus = await requireAlkPengurus()
  if (!pengurus.isNasional) redirect(ALK_BASE)
  const items = await listPendingTiketNasional()
  return <TiketNasionalV2Client items={items} />
}
