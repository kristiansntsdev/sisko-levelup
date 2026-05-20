import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getPengaturanKota } from '@/lib/actions/brim'
import { PamfletClient } from './pamflet-client'

export default async function PamfletPage() {
  const cookieStore = await cookies()
  const pengurusId = cookieStore.get('pengurus_id')?.value
  if (!pengurusId) redirect('/admin')

  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { divisi: true, kotalevelup: true },
  })
  if (!pengurus || pengurus.divisi !== 'brim') redirect('/admin')

  const pengaturan = await getPengaturanKota(pengurus.kotalevelup)

  return <PamfletClient kotaLogo={pengaturan?.logo ?? ''} />
}
