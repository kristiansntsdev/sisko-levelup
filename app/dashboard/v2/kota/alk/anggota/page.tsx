import { db } from '@/lib/db'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { listPengurusKota, listPesertaKota } from '@/lib/actions/pengurus-kota'
import { AnggotaListClient, PesertaListClient } from '@/components/alk-v2/anggota'

export default async function AlkV2AnggotaPage() {
  const pengurus = await requireAlkPengurus()
  const cabang = await db.cabang.findUnique({
    where: { id_cabang: Number(pengurus.cabang) },
    select: { namacabang: true },
  })
  const namaCabang = cabang?.namacabang ?? (pengurus.isNasional ? 'Nasional' : pengurus.cabang)

  // Hanya Sekretariat Nasional yang mengelola akun pengurus di sini; Admin LK kota
  // melihat anggota (peserta) kotanya sendiri beserta userlevel-nya.
  if (!pengurus.isNasional) {
    const peserta = await listPesertaKota()
    return <PesertaListClient peserta={peserta} namaCabang={namaCabang} />
  }

  const members = await listPengurusKota()
  return <AnggotaListClient members={members} namaCabang={namaCabang} />
}
