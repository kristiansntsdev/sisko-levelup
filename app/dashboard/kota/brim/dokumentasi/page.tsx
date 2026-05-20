import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getAllEventsByKotalevelup } from '@/lib/actions/event'
import { getDokumentasiByKota } from '@/lib/actions/dokumentasi'
import { DokumentasiClient } from './dokumentasi-client'

export default async function DokumentasiKotaPage() {
  const cookieStore = await cookies()
  const pengurusId = cookieStore.get('pengurus_id')?.value
  if (!pengurusId) redirect('/admin')

  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { divisi: true, kotalevelup: true },
  })
  if (!pengurus || pengurus.divisi !== 'brim') redirect('/admin')

  const [events, dokumentasi] = await Promise.all([
    getAllEventsByKotalevelup(pengurus.kotalevelup),
    getDokumentasiByKota(pengurus.kotalevelup),
  ])

  return <DokumentasiClient events={events} dokumentasi={dokumentasi} />
}
