'use server'
import { pembacaSaatIni } from '@/lib/push/pembaca'
import { pengumumanDetail } from '@/lib/push/pengumuman'
import { MAKS_UCAPAN } from '@/lib/push/target'
import { halamanPengumuman } from '@/lib/push/pengumuman'
import { kirimPush, TTL_BIASA } from '@/lib/push/send'
import { adaUcapan, muatUltah, simpanUcapan, ubahSuka } from '@/lib/push/ultah'

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
  let baru = false
  try {
    baru = await simpanUcapan(item.id, pembaca.idPeserta, teks)
  } catch (err) {
    console.error('[ultah] simpan ucapan gagal', err)
    return { ok: false, error: 'Gagal mengirim, coba lagi' }
  }
  // Push ke yang berulang tahun hanya untuk ucapan baru (mengganti isi tidak membunyikan lagi). Tag sama per baris:
  // ucapan berikutnya menggantikan notifikasi sebelumnya, jadi tidak menumpuk. Gagal kirim tidak membatalkan ucapan.
  if (baru) {
    try {
      const semua = (await muatUltah(item.id, item.ultah.id, pembaca.idPeserta)).ucapan
      const saya = semua.find((u) => u.idDari === pembaca.idPeserta)
      const lain = semua.length - 1
      const body = lain > 0 ? `${saya?.nama ?? 'Temanmu'} dan ${lain} lainnya mengucapkan selamat ulang tahun` : `${saya?.nama ?? 'Temanmu'}: ${teks}`
      await kirimPush(
        { peserta: [item.ultah.id] },
        { title: 'Ucapan ulang tahun untukmu 🎉', body, url: halamanPengumuman(item.id), tag: `ultah-ucapan-${item.id}`, renotify: true },
        { ttl: TTL_BIASA, urgency: 'normal' },
      )
    } catch (err) {
      console.error('[ultah] push ucapan gagal', err)
    }
  }
  return { ok: true }
}

export type HasilSuka = { ok: true; aktif: boolean } | { ok: false; error: string }

/**
 * Suka (❤️). `idTarget` 0 = postingan ulang tahunnya: teman menyukai. Selain itu = ucapan dari anggota itu: hanya yang
 * berulang tahun yang menyukai, dan pengirimnya dikabari lewat push. Batal suka tidak mengirim apa pun.
 */
export async function sukaiUltah(idPengumuman: number, idTarget: number): Promise<HasilSuka> {
  const pembaca = await pembacaSaatIni()
  if (!pembaca?.idPeserta || pembaca.admin) return { ok: false, error: 'Masuk sebagai anggota dulu' }
  const item = await pengumumanDetail(Number(idPengumuman), pembaca)
  if (!item?.ultah) return { ok: false, error: 'Postingan tidak ditemukan' }
  const target = Math.max(0, Math.floor(Number(idTarget)) || 0)
  if (target === 0 && item.ultah.diri) return { ok: false, error: 'Postingan ini untukmu' }
  if (target !== 0 && !item.ultah.diri) return { ok: false, error: 'Hanya yang berulang tahun yang bisa menyukai ucapan' }
  try {
    if (target !== 0 && !(await adaUcapan(item.id, target))) return { ok: false, error: 'Ucapan tidak ditemukan' }
    const aktif = await ubahSuka(item.id, target, pembaca.idPeserta)
    if (aktif && target !== 0) {
      await kirimPush(
        { peserta: [target] },
        { title: `${item.ultah.nama} menyukai ucapanmu ❤️`, body: 'Ucapan selamat ulang tahunmu sudah dibaca dan disukai.', url: halamanPengumuman(item.id), tag: `ultah-suka-${item.id}`, renotify: true },
        { ttl: TTL_BIASA, urgency: 'normal' },
      ).catch((err: unknown) => console.error('[ultah] push suka gagal', err))
    }
    return { ok: true, aktif }
  } catch (err) {
    console.error('[ultah] suka gagal', err)
    return { ok: false, error: 'Gagal, coba lagi' }
  }
}
