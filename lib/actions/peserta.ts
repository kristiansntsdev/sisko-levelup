'use server'
import { db } from '@/lib/db'

export async function getPesertaById(idPeserta: number) {
  return db.peserta.findUnique({
    where: { id_peserta: idPeserta },
    select: { nama: true, nowa: true, gereja: true, pekerjaan: true, userlevel: true, kotalevelup: true },
  })
}
