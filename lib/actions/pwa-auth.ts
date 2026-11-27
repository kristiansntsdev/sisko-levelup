'use server'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { lepasPengurus } from '@/lib/push/lepas'
import {
  clearPengurusCookie,
  getPengurusFromCookie,
  pengurusDest,
  setPengurusCookie,
} from '@/lib/pengurus-session'

/** Email+password on PWA: peserta first, then pengurus. Pengurus → cookie + redirect. */
export async function loginEmailPassword(
  email: string,
  password: string,
): Promise<{ kind: 'peserta' } | { error: string }> {
  const e = email.trim()
  const p = password.trim()
  if (!e || !p) return { error: 'Email dan password wajib diisi.' }

  const peserta = await db.peserta.findFirst({
    where: { email: e, password: p },
    select: { id_peserta: true },
  })
  if (peserta) return { kind: 'peserta' }

  const pengurus = await db.pengurus.findFirst({
    where: { username: e, password: p },
  })
  if (!pengurus) return { error: 'Email atau password salah.' }

  const dest = pengurusDest(pengurus.divisi, pengurus.username)
  if (!dest) return { error: 'Divisi tidak dikenali.' }

  await setPengurusCookie(pengurus.id_pengurus)
  redirect(dest)
}

/** Profil sheet: masuk pengurus without clearing peserta NextAuth session. */
export async function loginPengurusFromPwa(
  email: string,
  password: string,
): Promise<{ error: string } | never> {
  const e = email.trim()
  const p = password.trim()
  if (!e || !p) return { error: 'Email dan password wajib diisi.' }

  const pengurus = await db.pengurus.findFirst({
    where: { username: e, password: p },
  })
  if (!pengurus) return { error: 'Email atau password salah.' }

  const dest = pengurusDest(pengurus.divisi, pengurus.username)
  if (!dest) return { error: 'Divisi tidak dikenali.' }

  await setPengurusCookie(pengurus.id_pengurus)
  redirect(dest)
}

/** Logout pengurus cookie; stay on member home if peserta session exists. */
export async function logoutPengurusKeepMember() {
  await lepasPengurus()
  await clearPengurusCookie()
  const session = await auth()
  if (session?.user?.idPeserta) redirect('/dashboard')
  redirect('/login')
}

export async function getActiveSessions() {
  const [session, pengurus] = await Promise.all([auth(), getPengurusFromCookie()])
  const cabangId = Number(pengurus?.kotalevelup)
  const cabang =
    pengurus && Number.isFinite(cabangId) && cabangId > 0
      ? await db.cabang.findUnique({ where: { id_cabang: cabangId }, select: { namacabang: true } })
      : null
  return {
    peserta: session?.user?.idPeserta
      ? {
          idPeserta: session.user.idPeserta,
          email: session.user.email ?? null,
          name: session.user.name ?? null,
          needsRegistration: Boolean(session.user.needsRegistration),
        }
      : null,
    pengurus: pengurus
      ? {
          idPengurus: pengurus.id_pengurus,
          nama: pengurus.nama,
          divisi: pengurus.divisi,
          kota: cabang?.namacabang ?? null,
          dest: pengurusDest(pengurus.divisi, pengurus.username),
        }
      : null,
  }
}

/**
 * Pendaftaran manual (tanpa Google): buat peserta Guest dengan email + password.
 * Client lanjut signIn('credentials') — resolveCredentials membuat auth_users-nya.
 */
export async function registerManual(data: {
  nama: string
  email: string
  password: string
  kotalevelup: string
  gereja: string
  nowa: string
}): Promise<{ ok: true } | { error: string }> {
  const nama = data.nama.trim()
  const email = data.email.trim()
  const password = data.password.trim()
  const kotalevelup = data.kotalevelup.trim()
  const gereja = data.gereja.trim()
  const nowa = data.nowa.trim()

  if (!nama) return { error: 'Nama wajib diisi.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Email tidak valid.' }
  if (password.length < 6) return { error: 'Password minimal 6 karakter.' }
  if (!kotalevelup) return { error: 'Pilih LevelUP Kota.' }
  if (!gereja) return { error: 'Nama gereja wajib diisi.' }

  const cabang = await db.cabang.findFirst({
    where: { id_cabang: Number(kotalevelup) || -1 },
    select: { id_cabang: true },
  })
  if (!cabang) return { error: 'LevelUP Kota tidak ditemukan.' }

  const taken = await db.peserta.findFirst({ where: { email }, select: { id_peserta: true } })
  if (taken) return { error: 'Email sudah terdaftar. Silakan masuk.' }

  const created = await db.peserta.create({
    data: {
      usercode: 'LUP-0',
      nama,
      gender: '-',
      pendidikan: '',
      jurusan: '',
      pekerjaan: '',
      provinsi: '35',
      kabupaten: '3521',
      kecamatan: '',
      desa: '',
      alamat: '',
      tgllahir: '',
      tempatlahir: '',
      nowa,
      kotalevelup,
      gereja,
      email,
      password,
      userlevel: '0',
      verifikasi: '0',
      foto: '',
      status: 'active',
      role: 'guest',
      id_tempat_kerja: null,
    },
    select: { id_peserta: true },
  })
  await db.peserta.update({
    where: { id_peserta: created.id_peserta },
    data: { usercode: `LUP-${created.id_peserta}` },
  })
  return { ok: true }
}

/** First Google login: create peserta + link auth_users, then client updates JWT. */
export async function completeRegistration(data: {
  nama: string
  nowa: string
  kotalevelup: string
  gereja: string
  sekolah: string
  idTempatKerja: number | null
}): Promise<{ ok: true; idPeserta: number } | { error: string }> {
  const session = await auth()
  const authUserId = session?.user?.authUserId
  const email = session?.user?.email
  if (!authUserId || !email) return { error: 'Sesi tidak ditemukan, coba login ulang.' }
  if (session.user.idPeserta) {
    return { ok: true, idPeserta: session.user.idPeserta }
  }

  const nama = data.nama.trim()
  const nowa = data.nowa.trim()
  // ponytail: Guest boleh skip WA + kota; Squad later forces kota via joinSquad
  if (!nama) return { error: 'Nama wajib diisi.' }

  const created = await db.peserta.create({
    data: {
      usercode: 'LUP-0',
      nama,
      gender: '-',
      pendidikan: '',
      jurusan: '',
      pekerjaan: data.sekolah,
      provinsi: '35',
      kabupaten: '3521',
      kecamatan: '',
      desa: '',
      alamat: '',
      tgllahir: '',
      tempatlahir: '',
      nowa,
      kotalevelup: data.kotalevelup.trim(),
      gereja: data.gereja,
      email,
      password: '',
      userlevel: '0',
      verifikasi: '0',
      foto: '',
      status: 'active',
      role: 'guest',
      id_tempat_kerja: data.idTempatKerja,
    },
    select: { id_peserta: true },
  })
  await db.peserta.update({
    where: { id_peserta: created.id_peserta },
    data: { usercode: `LUP-${created.id_peserta}` },
  })
  await db.auth_users.update({
    where: { id: authUserId },
    data: { id_peserta: created.id_peserta, name: nama },
  })

  return { ok: true, idPeserta: created.id_peserta }
}
