'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { ARTIKEL_IMG_MAX_BYTES, putArtikelImage } from '@/lib/artikel-blob'
import { makePengumumanCookie, passwordCocok, pengumumanTerbuka, PENGUMUMAN_COOKIE } from '@/lib/pengumuman-auth'
import {
  cariAnggotaOpsi, kirimPengumumanPush, MAKS_ANGGOTA, MAKS_KOTA, MAKS_NOMOR,
  type AnggotaOpsi, type HasilPengumuman, type TargetPengumuman,
} from '@/lib/push/pengumuman'
import { pushAktif } from '@/lib/push/send'
import { MAKS_ISI, MAKS_JUDUL, nomorInti, pathAman } from '@/lib/push/target'

export async function loginPengumuman(_prev: { error: string } | null, formData: FormData): Promise<{ error: string }> {
  if (!process.env.PENGUMUMAN_PASSWORD) return { error: 'PENGUMUMAN_PASSWORD belum di-set di server.' }
  const password = String(formData.get('password') ?? '').trim()
  if (!password) return { error: 'Password wajib diisi.' }
  if (!passwordCocok(password)) return { error: 'Password salah.' }
  const value = makePengumumanCookie()
  if (!value) return { error: 'PENGUMUMAN_PASSWORD belum di-set di server.' }
  ;(await cookies()).set(PENGUMUMAN_COOKIE, value, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 8,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  redirect('/pengumuman')
}

export async function logoutPengumuman() {
  ;(await cookies()).delete(PENGUMUMAN_COOKIE)
  redirect('/pengumuman')
}

export type KirimResult = ({ ok: true } & HasilPengumuman) | { ok: false; error: string }

export async function kirimPengumuman(formData: FormData): Promise<KirimResult> {
  if (!(await pengumumanTerbuka())) return { ok: false, error: 'Sesi berakhir. Masuk lagi.' }
  if (!pushAktif()) return { ok: false, error: 'Kunci VAPID belum diisi di server.' }

  const judul = String(formData.get('judul') ?? '').trim()
  const isi = String(formData.get('isi') ?? '').trim()
  if (!judul || judul.length > MAKS_JUDUL) return { ok: false, error: `Judul wajib, maksimal ${MAKS_JUDUL} karakter.` }
  if (!isi || isi.length > MAKS_ISI) return { ok: false, error: `Isi wajib, maksimal ${MAKS_ISI} karakter.` }
  // Kosong = tap notifikasi membuka halaman pengumuman itu sendiri.
  const rawUrl = String(formData.get('url') ?? '').trim()
  const url = rawUrl ? pathAman(rawUrl) : ''

  const semua = formData.get('semua') === '1'
  const kotaIds = [...new Set(formData.getAll('kota').map((v) => String(v).trim()).filter(Boolean))]
  const anggotaIds = [...new Set(formData.getAll('anggota').map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0))]
  const nomor = [...new Set(String(formData.get('nomor') ?? '').split(/[\n,;]+/).map((v) => v.trim()).filter(Boolean))]
  if (kotaIds.length > MAKS_KOTA || anggotaIds.length > MAKS_ANGGOTA || nomor.length > MAKS_NOMOR) {
    return { ok: false, error: `Terlalu banyak penerima (maks ${MAKS_KOTA} kota, ${MAKS_ANGGOTA} anggota, ${MAKS_NOMOR} nomor).` }
  }
  if (!semua && !kotaIds.length && !anggotaIds.length && !nomor.length) return { ok: false, error: 'Pilih penerima.' }
  if (!semua && nomor.some((n) => !nomorInti(n))) return { ok: false, error: 'Ada nomor HP yang tidak valid.' }
  let kota: string[] = []
  if (!semua && kotaIds.length) {
    const ada = await db.cabang.findMany({ where: { id_cabang: { in: kotaIds.map(Number).filter(Number.isFinite) } }, select: { id_cabang: true } })
    kota = ada.map((c) => String(c.id_cabang))
    if (kota.length !== kotaIds.length) return { ok: false, error: 'Ada kota yang tidak dikenali.' }
  }
  const target: TargetPengumuman = semua ? { semua: true, kota: [], anggota: [], nomor: [] } : { semua: false, kota, anggota: anggotaIds, nomor }

  let image: string | undefined
  const file = formData.get('gambar')
  if (file instanceof File && file.size > 0) {
    if (file.size > ARTIKEL_IMG_MAX_BYTES) return { ok: false, error: 'Gambar maksimal 4 MB.' }
    try {
      image = await putArtikelImage(file, 'push')
    } catch (e) {
      if (e instanceof Error && e.message.includes('BLOB_READ_WRITE_TOKEN')) return { ok: false, error: e.message }
      return { ok: false, error: 'File ini tidak bisa dibaca sebagai gambar.' }
    }
  }

  try {
    const isiPush = { judul, isi, url, image }
    const hasil = await kirimPengumumanPush(isiPush, target)
    revalidatePath('/pengumuman')
    revalidatePath('/dashboard/pengumuman')
    return { ok: true, ...hasil }
  } catch (e) {
    console.error('[pengumuman] kirim gagal', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Gagal mengirim.' }
  }
}

/** Dropdown cari anggota: "Nama - Nama kota". */
export async function cariAnggota(q: string): Promise<AnggotaOpsi[]> {
  if (!(await pengumumanTerbuka())) return []
  return cariAnggotaOpsi(String(q ?? '').slice(0, 60))
}
