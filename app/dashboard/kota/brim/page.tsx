import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getPengaturanKota } from '@/lib/actions/brim'
import { getAllEventsByKotalevelup } from '@/lib/actions/event'
import { isNasionalBrim } from '@/lib/event-cabang'
import { BrimClient } from './brim-client'

export default async function BrimDashboardPage() {
  const cookieStore = await cookies()
  const pengurusId = cookieStore.get('pengurus_id')?.value
  if (!pengurusId) redirect('/admin')

  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: {
      id_pengurus: true,
      nama: true,
      username: true,
      kotalevelup: true,
      divisi: true,
    },
  })
  if (!pengurus || pengurus.divisi !== 'brim') redirect('/admin')

  const nasional = isNasionalBrim(pengurus.username)

  const [pengaturan, cabang, events] = await Promise.all([
    getPengaturanKota(pengurus.kotalevelup),
    db.cabang.findUnique({
      where: { id_cabang: Number(pengurus.kotalevelup) },
      select: { namacabang: true },
    }),
    nasional ? getAllEventsByKotalevelup(null) : Promise.resolve([]),
  ])

  return (
    <BrimClient
      nama={pengurus.nama}
      kotalevelup={cabang?.namacabang ?? (nasional ? 'Nasional' : pengurus.kotalevelup)}
      pengaturan={pengaturan ?? null}
      events={events}
      isNasional={nasional}
    />
  )
}
