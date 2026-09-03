import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { isNasionalBrim } from '@/lib/event-cabang'
import { getWfeSerentak } from '@/lib/actions/wfe-serentak'
import { WfeFlyerClient } from './wfe-flyer-client'

export default async function WfeFlyerPage() {
  const cookieStore = await cookies()
  const pengurusId = cookieStore.get('pengurus_id')?.value
  if (!pengurusId) redirect('/admin')

  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { username: true, divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'brim' || !isNasionalBrim(pengurus.username)) {
    redirect('/dashboard/kota/brim')
  }

  const campaigns = await getWfeSerentak()
  return <WfeFlyerClient campaigns={campaigns} />
}
