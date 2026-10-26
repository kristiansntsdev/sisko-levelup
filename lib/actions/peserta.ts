'use server'
import { db } from '@/lib/db'
import { memberCardFromPeserta } from '@/lib/pwa-member'

export async function getPesertaById(idPeserta: number) {
  return db.peserta.findUnique({
    where: { id_peserta: idPeserta },
    select: {
      id_peserta: true,
      usercode: true,
      nama: true,
      nowa: true,
      gereja: true,
      pekerjaan: true,
      userlevel: true,
      kotalevelup: true,
      gender: true,
      tempatlahir: true,
      tgllahir: true,
      email: true,
      foto: true,
    },
  })
}

export async function getMemberCardForPeserta(idPeserta: number) {
  const p = await db.peserta.findUnique({
    where: { id_peserta: idPeserta },
    select: {
      usercode: true,
      nama: true,
      gender: true,
      tempatlahir: true,
      tgllahir: true,
      gereja: true,
      kotalevelup: true,
      userlevel: true,
      foto: true,
    },
  })
  if (!p) return null
  const cabangId = Number(p.kotalevelup)
  const cabang = Number.isFinite(cabangId)
    ? await db.cabang.findUnique({
        where: { id_cabang: cabangId },
        select: { namacabang: true },
      })
    : null
  return memberCardFromPeserta({
    ...p,
    kotaName: cabang?.namacabang ?? (p.kotalevelup ? `Kota #${p.kotalevelup}` : '—'),
  })
}
