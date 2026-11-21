'use server'
import { pembacaSaatIni } from '@/lib/push/pembaca'
import { pengumumanDetail } from '@/lib/push/pengumuman'
import { MAKS_UCAPAN } from '@/lib/push/target'
import { simpanUcapan } from '@/lib/push/ultah'

export type HasilUcapan = { ok: true } | { ok: false; error: string }

/**
 * Ucapan selamat ulang tahun dari teman sekota. Id pengirim selalu dari sesi; baris harus baris ulang tahun yang
 * boleh dilihat pengirim, dan yang berulang tahun tidak mengucapkan untuk dirinya sendiri.
 */
export async function kirimUcapanUltah(idPengumuman: number, isi: string): Promise<HasilUcapan> {
  const pembaca = await pembacaSaatIni()
  if (!pembaca?.idPeserta || pembaca.admin) return { ok: false, error: 'Masuk sebagai anggota dulu' }
  const teks = String(isi ?? '').trim()
  if (!teks) return { ok: false, error: 'Ucapannya masih kosong' }
  if (teks.length > MAKS_UCAPAN) return { ok: false, error: `Maksimal ${MAKS_UCAPAN} karakter` }
  const item = await pengumumanDetail(Number(idPengumuman), pembaca)
  if (!item?.ultah) return { ok: false, error: 'Ucapan tidak ditemukan' }
  if (item.ultah.diri) return { ok: false, error: 'Ucapan ini untukmu, bukan darimu' }
  try {
    await simpanUcapan(item.id, pembaca.idPeserta, teks)
  } catch (err) {
    console.error('[ultah] simpan ucapan gagal', err)
    return { ok: false, error: 'Gagal mengirim, coba lagi' }
  }
  return { ok: true }
}
