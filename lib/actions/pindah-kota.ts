'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { isNasionalAdmin } from '@/lib/event-cabang'
import { setActor } from '@/lib/request-context'

type Ok = { ok: true }
type Err = { ok: false; error: string }
type Result = Ok | Err

const PENDING = ''
const APPROVED = '1'
const REJECTED = '0'

const MEMBER_PATHS = ['/dashboard/profil/edit', '/dashboard/profil', '/dashboard'] as const
const NASIONAL_PATHS = [
  '/dashboard/v2/kota/alk',
  '/dashboard/v2/kota/alk/pindah-kota',
] as const

export type PindahKotaMine = {
  id_pindah: number
  dari_kota: string
  ke_kota: string
  dariNama: string
  keNama: string
  catatan: string
  status: '' | '1' | '0'
  notenasional: string
}

export type PindahKotaPending = {
  id_pindah: number
  id_peserta: number
  nama: string
  usercode: string
  dariNama: string
  keNama: string
  catatan: string
}

async function requirePesertaId() {
  const session = await auth()
  const id = session?.user?.idPeserta
  if (!id) return null
  setActor({ type: 'peserta', id, label: session?.user?.name ?? null })
  return id
}

async function requireNasionalAlk() {
  const pengurusId = (await cookies()).get('pengurus_id')?.value
  if (!pengurusId) return null
  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { username: true, divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk' || !isNasionalAdmin(pengurus.username)) {
    return null
  }
  setActor({ type: 'pengurus', id: Number(pengurusId), label: pengurus.username })
  return pengurus
}

function revalidateMember() {
  for (const p of MEMBER_PATHS) revalidatePath(p)
}

function revalidateNasional() {
  for (const p of NASIONAL_PATHS) revalidatePath(p)
  revalidateMember()
}

async function cabangNamaMap(ids: string[]) {
  const nums = [...new Set(ids.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0))]
  if (nums.length === 0) return new Map<string, string>()
  const rows = await db.cabang.findMany({
    where: { id_cabang: { in: nums } },
    select: { id_cabang: true, namacabang: true },
  })
  return new Map(rows.map((r) => [String(r.id_cabang), r.namacabang]))
}

/** Pending if any; else latest decided row (for rejected UX). */
export async function getPindahKotaForMe(): Promise<PindahKotaMine | null> {
  const idPeserta = await requirePesertaId()
  if (!idPeserta) return null
  const pending = await db.pindah_kota.findFirst({
    where: { id_peserta: String(idPeserta), status: PENDING },
    orderBy: { id_pindah: 'desc' },
  })
  const row =
    pending ??
    (await db.pindah_kota.findFirst({
      where: { id_peserta: String(idPeserta) },
      orderBy: { id_pindah: 'desc' },
    }))
  if (!row) return null
  const names = await cabangNamaMap([row.dari_kota, row.ke_kota])
  const status = row.status === APPROVED || row.status === REJECTED ? row.status : PENDING
  return {
    id_pindah: row.id_pindah,
    dari_kota: row.dari_kota,
    ke_kota: row.ke_kota,
    dariNama: names.get(row.dari_kota) ?? `Kota #${row.dari_kota}`,
    keNama: names.get(row.ke_kota) ?? `Kota #${row.ke_kota}`,
    catatan: row.catatan,
    status,
    notenasional: row.notenasional,
  }
}

export async function ajukanPindahKota(keKota: string, catatan = ''): Promise<Result> {
  const idPeserta = await requirePesertaId()
  if (!idPeserta) return { ok: false, error: 'Tidak login' }
  const ke = String(keKota || '').trim()
  if (!ke) return { ok: false, error: 'Pilih LevelUP kota tujuan' }

  const peserta = await db.peserta.findUnique({
    where: { id_peserta: idPeserta },
    select: { kotalevelup: true },
  })
  if (!peserta) return { ok: false, error: 'Peserta tidak ditemukan' }
  const dari = String(peserta.kotalevelup || '').trim()
  if (!dari) return { ok: false, error: 'LevelUP Kota kamu belum terisi' }
  if (dari === ke) return { ok: false, error: 'Pilih kota yang berbeda' }

  const cabang = await db.cabang.findUnique({
    where: { id_cabang: Number(ke) || 0 },
    select: { id_cabang: true },
  })
  if (!cabang) return { ok: false, error: 'LevelUP kota tidak valid' }

  const note = catatan.trim().slice(0, 500)
  const existing = await db.pindah_kota.findFirst({
    where: { id_peserta: String(idPeserta), status: PENDING },
    select: { id_pindah: true },
  })

  if (existing) {
    await db.pindah_kota.update({
      where: { id_pindah: existing.id_pindah },
      data: {
        dari_kota: dari,
        ke_kota: String(cabang.id_cabang),
        catatan: note,
        notenasional: '',
      },
    })
  } else {
    await db.pindah_kota.create({
      data: {
        id_peserta: String(idPeserta),
        dari_kota: dari,
        ke_kota: String(cabang.id_cabang),
        catatan: note,
        status: PENDING,
        notenasional: '',
      },
    })
  }

  revalidateNasional()
  return { ok: true }
}

export async function batalPindahKota(): Promise<Result> {
  const idPeserta = await requirePesertaId()
  if (!idPeserta) return { ok: false, error: 'Tidak login' }
  const existing = await db.pindah_kota.findFirst({
    where: { id_peserta: String(idPeserta), status: PENDING },
    select: { id_pindah: true },
  })
  if (!existing) return { ok: false, error: 'Tidak ada pengajuan pending' }
  await db.pindah_kota.delete({ where: { id_pindah: existing.id_pindah } })
  revalidateNasional()
  return { ok: true }
}

export async function listPendingPindahKota(): Promise<PindahKotaPending[]> {
  const nasional = await requireNasionalAlk()
  if (!nasional) return []
  const rows = await db.pindah_kota.findMany({
    where: { status: PENDING },
    orderBy: { id_pindah: 'desc' },
  })
  if (rows.length === 0) return []
  const ids = rows.map((r) => Number(r.id_peserta)).filter((n) => Number.isFinite(n))
  const [pesertas, names] = await Promise.all([
    db.peserta.findMany({
      where: { id_peserta: { in: ids } },
      select: { id_peserta: true, nama: true, usercode: true },
    }),
    cabangNamaMap(rows.flatMap((r) => [r.dari_kota, r.ke_kota])),
  ])
  const byId = new Map(pesertas.map((p) => [p.id_peserta, p]))
  return rows.flatMap((r) => {
    const p = byId.get(Number(r.id_peserta))
    if (!p) return []
    return [
      {
        id_pindah: r.id_pindah,
        id_peserta: p.id_peserta,
        nama: p.nama,
        usercode: p.usercode,
        dariNama: names.get(r.dari_kota) ?? `Kota #${r.dari_kota}`,
        keNama: names.get(r.ke_kota) ?? `Kota #${r.ke_kota}`,
        catatan: r.catatan,
      },
    ]
  })
}

export async function countPendingPindahKota(): Promise<number> {
  const nasional = await requireNasionalAlk()
  if (!nasional) return 0
  return db.pindah_kota.count({ where: { status: PENDING } })
}

export async function approvePindahKota(idPindah: number): Promise<Result> {
  const nasional = await requireNasionalAlk()
  if (!nasional) return { ok: false, error: 'Akses ditolak' }
  const row = await db.pindah_kota.findUnique({
    where: { id_pindah: idPindah },
  })
  if (!row || row.status !== PENDING) return { ok: false, error: 'Pengajuan tidak ditemukan' }
  const idPeserta = Number(row.id_peserta)
  if (!Number.isFinite(idPeserta)) return { ok: false, error: 'Peserta tidak valid' }

  const cabang = await db.cabang.findUnique({
    where: { id_cabang: Number(row.ke_kota) || 0 },
    select: { id_cabang: true },
  })
  if (!cabang) return { ok: false, error: 'Kota tujuan tidak valid' }

  const now = new Date()
  await db.$transaction([
    db.peserta.update({
      where: { id_peserta: idPeserta },
      data: { kotalevelup: String(cabang.id_cabang) },
    }),
    db.pindah_kota.update({
      where: { id_pindah: idPindah },
      data: { status: APPROVED, decided_at: now, notenasional: '' },
    }),
  ])
  revalidateNasional()
  return { ok: true }
}

export async function rejectPindahKota(idPindah: number, alasan: string): Promise<Result> {
  const nasional = await requireNasionalAlk()
  if (!nasional) return { ok: false, error: 'Akses ditolak' }
  const note = alasan.trim()
  if (!note) return { ok: false, error: 'Alasan reject wajib diisi' }
  const row = await db.pindah_kota.findUnique({
    where: { id_pindah: idPindah },
    select: { id_pindah: true, status: true },
  })
  if (!row || row.status !== PENDING) return { ok: false, error: 'Pengajuan tidak ditemukan' }

  await db.pindah_kota.update({
    where: { id_pindah: idPindah },
    data: {
      status: REJECTED,
      notenasional: note.slice(0, 1000),
      decided_at: new Date(),
    },
  })
  revalidateNasional()
  return { ok: true }
}
