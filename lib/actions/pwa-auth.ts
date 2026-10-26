'use server'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
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

  const dest = pengurusDest(pengurus.divisi)
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

  const dest = pengurusDest(pengurus.divisi)
  if (!dest) return { error: 'Divisi tidak dikenali.' }

  await setPengurusCookie(pengurus.id_pengurus)
  redirect(dest)
}

/** Logout pengurus cookie; stay on member home if peserta session exists. */
export async function logoutPengurusKeepMember() {
  await clearPengurusCookie()
  const session = await auth()
  if (session?.user?.idPeserta) redirect('/dashboard')
  redirect('/login')
}

export async function getActiveSessions() {
  const [session, pengurus] = await Promise.all([auth(), getPengurusFromCookie()])
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
          dest: pengurusDest(pengurus.divisi),
        }
      : null,
  }
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
  if (!nama) return { error: 'Nama wajib diisi.' }
  if (!nowa) return { error: 'Nomor WA wajib diisi.' }
  if (!data.kotalevelup) return { error: 'Pilih LevelUP kota kamu.' }

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
      kotalevelup: data.kotalevelup,
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
