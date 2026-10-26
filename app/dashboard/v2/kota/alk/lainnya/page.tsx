import { db } from '@/lib/db'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { LainnyaClient } from '@/components/alk-v2/lainnya'

export default async function AlkV2LainnyaPage() {
  const pengurus = await requireAlkPengurus()
  const cabang = await db.cabang.findUnique({
    where: { id_cabang: Number(pengurus.cabang) },
    select: { namacabang: true },
  })
  return (
    <LainnyaClient
      nama={pengurus.nama}
      namaCabang={cabang?.namacabang ?? (pengurus.isNasional ? 'Nasional' : pengurus.cabang)}
      username={pengurus.username}
    />
  )
}
