import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getPengaturanKota } from '@/lib/actions/brim'
import { BrimClient } from './brim-client'

export default async function BrimDashboardPage() {
  const cookieStore = await cookies()
  const pengurusId = cookieStore.get('pengurus_id')?.value
  if (!pengurusId) redirect('/admin')

  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { id_pengurus: true, nama: true, kotalevelup: true, divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'brim') redirect('/admin')

  const [pengaturan, cabang] = await Promise.all([
    getPengaturanKota(pengurus.kotalevelup),
    db.cabang.findUnique({
      where: { id_cabang: Number(pengurus.kotalevelup) },
      select: { kotacabang: true },
    }),
  ])

  return (
    <BrimClient
      nama={pengurus.nama}
      kotalevelup={cabang?.kotacabang ?? pengurus.kotalevelup}
      pengaturan={pengaturan ?? null}
    />
  )
}
