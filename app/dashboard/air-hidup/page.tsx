import { redirect } from 'next/navigation'
import { anggotaAir, dataAliran } from '@/lib/air-hidup-data'
import { AliranPage } from '../pic/client'

export const dynamic = 'force-dynamic'

/** Aliran Air Hidup untuk semua anggota; bar air tiap kota hanya LevelUP Pusat. */
export default async function AirHidupPage() {
  const me = await anggotaAir()
  if (!me) redirect('/login?callbackUrl=/dashboard/air-hidup')
  return <AliranPage data={await dataAliran(me)} />
}
