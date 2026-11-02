'use client'
import { DEMO_ACCOUNTS } from '../../db'
import { addLog, getDb, mutate } from '../../db'

export type * from '@/lib/actions/pwa-auth'

const ALK_DEST = '/demo-preview/dashboard/v2/kota/alk'

export async function loginEmailPassword(email: string, password: string): Promise<{ kind: 'peserta' } | { error: string }> {
  const e = email.trim().toLowerCase()
  const p = password.trim()
  if (!e || !p) return { error: 'Email dan password wajib diisi.' }
  const d = getDb()
  if (d.peserta.some((x) => x.email.toLowerCase() === e && x.password === p)) return { kind: 'peserta' }
  if (d.pengurus.some((x) => x.username.toLowerCase() === e && x.password === p)) return { error: 'Akun pengurus — masuk lewat halaman login demo.' }
  return { error: 'Email atau password salah.' }
}

export async function loginPengurusFromPwa(email: string, password: string): Promise<{ error: string } | never> {
  const e = email.trim().toLowerCase()
  const pw = password.trim()
  const pengurus = getDb().pengurus.find((x) => x.username.toLowerCase() === e && x.password === pw)
  if (!pengurus) return { error: 'Email atau password salah.' }
  mutate((d) => {
    d.session.idPengurus = pengurus.id_pengurus
  })
  window.location.assign(ALK_DEST)
  return new Promise<never>(() => {})
}

export async function logoutPengurusKeepMember() {
  mutate((d) => {
    d.session.idPengurus = null
  })
  window.location.assign(getDb().session.idPeserta ? '/demo-preview/dashboard' : '/demo-preview/login')
}

export async function getActiveSessions() {
  const d = getDb()
  const peserta = d.peserta.find((p) => p.id_peserta === d.session.idPeserta)
  const pengurus = d.pengurus.find((p) => p.id_pengurus === d.session.idPengurus)
  return {
    peserta: peserta
      ? { idPeserta: peserta.id_peserta, email: peserta.email as string | null, name: peserta.nama as string | null, needsRegistration: false }
      : d.session.google
        ? null
        : null,
    pengurus: pengurus ? { idPengurus: pengurus.id_pengurus, nama: pengurus.nama, divisi: pengurus.divisi as string | null, dest: ALK_DEST as string | null } : null,
  }
}

export async function completeRegistration(data: {
  nama: string; nowa: string; kotalevelup: string; gereja: string; sekolah: string; idTempatKerja: number | null
}): Promise<{ ok: true; idPeserta: number } | { error: string }> {
  const google = getDb().session.google
  if (!google) return { error: 'Sesi tidak ditemukan, coba login ulang.' }
  if (!data.nama.trim()) return { error: 'Nama wajib diisi.' }
  let id = 0
  mutate((d) => {
    id = d.nextId++
    d.peserta.push({
      id_peserta: id, usercode: `LUP-${1000 + id}`, nama: data.nama.trim(), nowa: data.nowa.trim(), gereja: data.gereja, pekerjaan: data.sekolah,
      userlevel: '0', kotalevelup: data.kotalevelup.trim(), gender: '-', tempatlahir: '', tgllahir: '', email: google.email,
      password: DEMO_ACCOUNTS.find((a) => a.email === google.email)?.password ?? 'demo123', foto: '', pendidikan: '', jurusan: '',
      provinsi: '12', kabupaten: '1275', kecamatan: '', desa: '', alamat: '',
    })
    d.session.idPeserta = id
    d.session.google = null
    addLog(d, `${data.nama.trim()} mendaftar jadi Tamu`)
  })
  return { ok: true, idPeserta: id }
}
