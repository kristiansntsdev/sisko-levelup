/** Batas pengumuman: judul tampil penuh di notifikasi; isi lengkap di halaman pengumuman, notifikasi hanya awalnya. */
export const MAKS_JUDUL = 80
export const MAKS_ISI = 1000
/** Ucapan selamat ulang tahun dari teman sekota. */
export const MAKS_UCAPAN = 200

/** Normalisasi nomor HP untuk mencocokkan peserta.nowa (teks bebas: 0812-34.., +62 812.., 62812..). Murni. */

/** Hanya digit, tanpa kode negara: 0812… / +62812… / 812… → "812…". Null kalau terlalu pendek. */
export function nomorInti(raw: string): string | null {
  let d = (raw ?? '').replace(/\D/g, '')
  if (d.startsWith('62')) d = d.slice(2)
  else if (d.startsWith('0')) d = d.slice(1)
  return d.length >= 8 && d.length <= 13 ? d : null
}

export function nomorSama(a: string, b: string): boolean {
  const x = nomorInti(a)
  const y = nomorInti(b)
  return x !== null && x === y
}

/** Tujuan tap notifikasi: hanya path di app ini. */
export function pathAman(raw: string | null | undefined): string {
  const t = (raw ?? '').trim()
  return t.startsWith('/') && !t.startsWith('//') && !t.includes('\\') && t.length <= 200 ? t : '/dashboard'
}

export type Platform = 'iOS' | 'Android' | 'Desktop' | 'Lainnya'

/** Jenis perangkat dari user agent saat langganan disimpan. iPad PWA bisa melapor sebagai Mac (masuk Desktop). */
export function platformDari(ua: string): Platform {
  const s = ua ?? ''
  if (/iPhone|iPad|iPod/.test(s)) return 'iOS'
  if (/Android/.test(s)) return 'Android'
  if (/Windows|Macintosh|Mac OS X|Linux|CrOS/.test(s)) return 'Desktop'
  return 'Lainnya'
}

/** Notifikasi percobaan setelah pengguna menekan Aktifkan: memastikan push benar-benar sampai ke HP itu. */
export function pesanAktif(nama: string): { title: string; body: string } {
  const n = nama.trim() || 'Sahabat LevelUP'
  return {
    title: 'Notifikasi LevelUP aktif',
    body: `Selamat Fitur Notifikasi LevelUP telah berhasil diaktifkan, Semangat Melayani Selalu di LevelUP - ${n}`,
  }
}
