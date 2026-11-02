'use client'
import { memberCardFromPeserta } from '@/lib/pwa-member'
import { getDb } from '../../db'

export async function getPesertaById(idPeserta: number) {
  const p = getDb().peserta.find((x) => x.id_peserta === idPeserta)
  if (!p) return null
  const { id_peserta, usercode, nama, nowa, gereja, pekerjaan, userlevel, kotalevelup, gender, tempatlahir, tgllahir, email, foto, pendidikan, jurusan, provinsi, kabupaten, kecamatan, desa, alamat } = p
  return { id_peserta, usercode, nama, nowa, gereja, pekerjaan, userlevel, kotalevelup, gender, tempatlahir, tgllahir, email, foto, pendidikan, jurusan, provinsi, kabupaten, kecamatan, desa, alamat }
}

export async function getMemberCardForPeserta(idPeserta: number) {
  const d = getDb()
  const p = d.peserta.find((x) => x.id_peserta === idPeserta)
  if (!p) return null
  const cabang = d.cabang.find((c) => String(c.id_cabang) === p.kotalevelup)
  return memberCardFromPeserta({
    usercode: p.usercode, nama: p.nama, gender: p.gender, tempatlahir: p.tempatlahir, tgllahir: p.tgllahir,
    gereja: p.gereja, userlevel: p.userlevel, foto: p.foto,
    kotaName: cabang?.namacabang ?? (p.kotalevelup ? `Kota #${p.kotalevelup}` : '—'),
  })
}
