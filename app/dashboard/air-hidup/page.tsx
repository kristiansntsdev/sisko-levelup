import { redirect } from 'next/navigation'
import { anggotaAir, dataAliran } from '@/lib/air-hidup-data'
import { AIR_MIN_LEVEL } from '@/lib/air-hidup'
import { AliranPage } from '../pic/client'

export const dynamic = 'force-dynamic'

/** Aliran Air Hidup untuk Squad ke atas. */
export default async function AirHidupPage() {
  const me = await anggotaAir()
  if (!me) redirect('/login?callbackUrl=/dashboard/air-hidup')
  if (me.level < AIR_MIN_LEVEL) redirect('/dashboard')
  return <AliranPage data={await dataAliran(me)} />
}
