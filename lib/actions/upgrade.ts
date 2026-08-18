'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// ponytail: membership approval baru sampai squad (userlevel 2). Core (3) belum.

type Ok = { ok: true }
type Err = { ok: false; error: string }
type Result = Ok | Err

async function requirePesertaId() {
  const session = await auth()
  const id = session?.user?.idPeserta
  if (!id) return null
  return id
}

async function requireAlkPengurus() {
  const pengurusId = (await cookies()).get('pengurus_id')?.value
  if (!pengurusId) return null
  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { kotalevelup: true, divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk') return null
  return pengurus
}

async function upgradesForCabang(kotalevelup: string) {
  const rows = await db.upgrade.findMany({ orderBy: { id_upgrade: 'desc' } })
  if (rows.length === 0) return []
  const ids = rows.map((r) => Number(r.id_peserta)).filter((n) => Number.isFinite(n))
  const pesertas = await db.peserta.findMany({
    where: { id_peserta: { in: ids }, kotalevelup },
    select: { id_peserta: true, nama: true, usercode: true },
  })
  const byId = new Map(pesertas.map((p) => [p.id_peserta, p]))
  return rows.flatMap((r) => {
    const p = byId.get(Number(r.id_peserta))
    if (!p) return []
    return [{ id_upgrade: r.id_upgrade, nama: p.nama, usercode: p.usercode }]
  })
}

export async function joinVolunteer(): Promise<Result> {
  const idPeserta = await requirePesertaId()
  if (!idPeserta) return { ok: false, error: 'Tidak login' }
  const p = await db.peserta.findUnique({
    where: { id_peserta: idPeserta },
    select: { userlevel: true },
  })
  if (!p || p.userlevel !== '0') return { ok: false, error: 'Tidak bisa join volunteer' }
  await db.peserta.update({
    where: { id_peserta: idPeserta },
    data: { userlevel: '1' },
  })
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function joinSquad(): Promise<Result> {
  const idPeserta = await requirePesertaId()
  if (!idPeserta) return { ok: false, error: 'Tidak login' }
  const p = await db.peserta.findUnique({
    where: { id_peserta: idPeserta },
    select: { userlevel: true },
  })
  if (!p || p.userlevel !== '1') return { ok: false, error: 'Tidak bisa join squad' }
  const existing = await db.upgrade.findFirst({
    where: { id_peserta: String(idPeserta) },
    select: { id_upgrade: true },
  })
  if (existing) return { ok: true }
  await db.upgrade.create({
    data: {
      id_peserta: String(idPeserta),
      member: '2',
      approveadmin: '',
      approvesekertariat: '',
      approvenasional: '',
    },
  })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/kota/alk')
  return { ok: true }
}

export async function getPendingSquadForMe(): Promise<boolean> {
  const idPeserta = await requirePesertaId()
  if (!idPeserta) return false
  const row = await db.upgrade.findFirst({
    where: { id_peserta: String(idPeserta) },
    select: { id_upgrade: true },
  })
  return !!row
}

export async function getPendingSquadApprovals() {
  const pengurus = await requireAlkPengurus()
  if (!pengurus) return []
  return upgradesForCabang(pengurus.kotalevelup)
}

export async function countPendingSquadApprovals(): Promise<number> {
  const pengurus = await requireAlkPengurus()
  if (!pengurus) return 0
  return (await upgradesForCabang(pengurus.kotalevelup)).length
}

export async function approveSquad(idUpgrade: number): Promise<Result> {
  const pengurus = await requireAlkPengurus()
  if (!pengurus) return { ok: false, error: 'Akses ditolak' }
  const row = await db.upgrade.findUnique({
    where: { id_upgrade: idUpgrade },
    select: { id_upgrade: true, id_peserta: true },
  })
  if (!row) return { ok: false, error: 'Tidak ditemukan' }
  const idPeserta = Number(row.id_peserta)
  if (!Number.isFinite(idPeserta)) return { ok: false, error: 'Peserta tidak valid' }
  const peserta = await db.peserta.findUnique({
    where: { id_peserta: idPeserta },
    select: { kotalevelup: true },
  })
  if (!peserta || peserta.kotalevelup !== pengurus.kotalevelup) {
    return { ok: false, error: 'Bukan cabang ini' }
  }
  await db.$transaction([
    db.peserta.update({
      where: { id_peserta: idPeserta },
      data: { userlevel: '2' },
    }),
    db.upgrade.delete({ where: { id_upgrade: idUpgrade } }),
  ])
  revalidatePath('/dashboard/kota/alk')
  revalidatePath('/dashboard/kota/alk/approval')
  revalidatePath('/dashboard')
  return { ok: true }
}
