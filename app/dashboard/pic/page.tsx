import { redirect } from 'next/navigation'
import { anggotaAir, dataPic } from '@/lib/air-hidup-data'
import { PicPage } from './client'

export const dynamic = 'force-dynamic'

/** Dashboard PIC: hanya userlevel 4. */
export default async function DashboardPicPage() {
  const me = await anggotaAir()
  if (!me) redirect('/login?callbackUrl=/dashboard/pic')
  const data = await dataPic(me)
  if (!data) redirect('/dashboard')
  return <PicPage data={data} />
}
