import { db } from '@/lib/db'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { listPengurusKota } from '@/lib/actions/pengurus-kota'
import { AnggotaListClient } from '@/components/alk-v2/anggota'

export default async function AlkV2AnggotaPage() {
  const pengurus = await requireAlkPengurus()
  const [members, cabang] = await Promise.all([
    listPengurusKota(),
    db.cabang.findUnique({
      where: { id_cabang: Number(pengurus.cabang) },
      select: { namacabang: true },
    }),
  ])
  return (
    <AnggotaListClient
      members={members}
      namaCabang={cabang?.namacabang ?? (pengurus.isNasional ? 'Nasional' : pengurus.cabang)}
    />
  )
}
