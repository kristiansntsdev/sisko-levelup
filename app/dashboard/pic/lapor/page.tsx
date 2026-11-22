import { redirect } from 'next/navigation'
import { anggotaAir, dataPic } from '@/lib/air-hidup-data'
import { LaporPage } from '../client'

export const dynamic = 'force-dynamic'

export default async function LaporWwPage() {
  const me = await anggotaAir()
  if (!me) redirect('/login?callbackUrl=/dashboard/pic/lapor')
  const data = await dataPic(me)
  if (!data) redirect('/dashboard')
  return <LaporPage namaKota={data.namaKota} today={data.today} />
}
