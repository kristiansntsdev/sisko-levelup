'use server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { ALK_BASE, roleToDivisi } from '@/components/alk-v2/paths'

export type PengurusKotaRow = {
  id_pengurus: number
  nama: string
  username: string
  divisi: string | null
  kotalevelup: string
  me: boolean
}

type Result = { ok: true } | { ok: false; error: string }

export async function listPengurusKota(): Promise<PengurusKotaRow[]> {
  const me = await requireAlkPengurus()
  const where = me.isNasional
    ? { OR: [{ kotalevelup: me.cabang }, { kotalevelup: '0' }] }
    : { kotalevelup: me.kotalevelup }
  const rows = await db.pengurus.findMany({
    where,
    orderBy: { nama: 'asc' },
    select: {
      id_pengurus: true,
      nama: true,
      username: true,
      divisi: true,
      kotalevelup: true,
    },
  })
  return rows.map((r) => ({
    ...r,
    me: r.id_pengurus === me.id_pengurus,
  }))
}

export async function createPengurusKota(input: {
  nama: string
  email: string
  password: string
  role: 'Admin LK' | 'BRIM'
}): Promise<Result> {
  const me = await requireAlkPengurus()
  const nama = input.nama.trim()
  const email = input.email.trim().toLowerCase()
  const password = input.password
  if (nama.length < 3) return { ok: false, error: 'Nama minimal 3 karakter' }
  if (!email.includes('@')) return { ok: false, error: 'Email tidak valid' }
  if (password.length < 4) return { ok: false, error: 'Password minimal 4 karakter' }

  const exists = await db.pengurus.findFirst({
    where: { username: email },
    select: { id_pengurus: true },
  })
  if (exists) return { ok: false, error: 'Email sudah dipakai' }

  await db.pengurus.create({
    data: {
      nama,
      nowa: '',
      username: email,
      password,
      leveladmin: '1',
      kotalevelup: me.isNasional ? me.cabang : me.kotalevelup,
      divisi: roleToDivisi(input.role),
    },
  })
  revalidatePath(`${ALK_BASE}/anggota`)
  revalidatePath(ALK_BASE)
  return { ok: true }
}

export async function updatePengurusKota(input: {
  id: number
  email: string
  password?: string
  role: 'Admin LK' | 'BRIM'
}): Promise<Result> {
  const me = await requireAlkPengurus()
  const email = input.email.trim().toLowerCase()
  if (!email.includes('@')) return { ok: false, error: 'Email tidak valid' }

  const row = await db.pengurus.findUnique({
    where: { id_pengurus: input.id },
    select: { id_pengurus: true, kotalevelup: true },
  })
  if (!row) return { ok: false, error: 'Tidak ditemukan' }
  if (!me.isNasional && row.kotalevelup !== me.kotalevelup) {
    return { ok: false, error: 'Bukan cabang ini' }
  }

  const clash = await db.pengurus.findFirst({
    where: { username: email, NOT: { id_pengurus: input.id } },
    select: { id_pengurus: true },
  })
  if (clash) return { ok: false, error: 'Email sudah dipakai' }

  await db.pengurus.update({
    where: { id_pengurus: input.id },
    data: {
      username: email,
      divisi: roleToDivisi(input.role),
      ...(input.password && input.password.length >= 4 ? { password: input.password } : {}),
    },
  })
  revalidatePath(`${ALK_BASE}/anggota`)
  return { ok: true }
}
