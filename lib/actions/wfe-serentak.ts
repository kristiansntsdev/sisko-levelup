'use server'

import { cookies } from 'next/headers'
import { put } from '@vercel/blob'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { isNasionalBrim } from '@/lib/event-cabang'

export type WfeSerentakRow = {
  id: number
  bulan_mulai: string
  bulan_selesai: string
  image_url: string
}

const FLYER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const FLYER_MAX_BYTES = 4 * 1024 * 1024

function isoDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthStart(ym: string): Date {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m || m < 1 || m > 12) throw new Error('Bulan tidak valid')
  return new Date(Date.UTC(y, m - 1, 1))
}

function monthEnd(ym: string): Date {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m || m < 1 || m > 12) throw new Error('Bulan tidak valid')
  return new Date(Date.UTC(y, m, 0))
}

function parseDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

async function requireBrimNasional(): Promise<void> {
  const pengurusId = (await cookies()).get('pengurus_id')?.value
  if (!pengurusId) throw new Error('Unauthorized')
  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { username: true, divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'brim' || !isNasionalBrim(pengurus.username)) {
    throw new Error('Hanya Brim Nasional')
  }
}

function toRow(r: { id: number; bulan_mulai: Date; bulan_selesai: Date; image_url: string }): WfeSerentakRow {
  return {
    id: r.id,
    bulan_mulai: isoDate(r.bulan_mulai),
    bulan_selesai: isoDate(r.bulan_selesai),
    image_url: r.image_url,
  }
}

export async function getWfeSerentak(): Promise<WfeSerentakRow[]> {
  await requireBrimNasional()
  const rows = await db.wfe_serentak.findMany({ orderBy: { id: 'desc' } })
  return rows.map(toRow)
}

/** ALK form preview + kickoff lookup. date = YYYY-MM-DD or Date. */
export async function getWfeSerentakForDate(date: Date | string): Promise<WfeSerentakRow | null> {
  const d = typeof date === 'string' ? parseDay(date) : date
  const row = await db.wfe_serentak.findFirst({
    where: {
      bulan_mulai: { lte: d },
      bulan_selesai: { gte: d },
    },
    orderBy: { id: 'desc' },
  })
  return row ? toRow(row) : null
}

export async function saveWfeSerentak(
  bulanMulaiYm: string,
  bulanSelesaiYm: string,
  flyer: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireBrimNasional()
  } catch {
    return { ok: false, error: 'Unauthorized' }
  }
  let mulai: Date
  let selesai: Date
  try {
    mulai = monthStart(bulanMulaiYm)
    selesai = monthEnd(bulanSelesaiYm)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Bulan tidak valid' }
  }
  if (mulai > selesai) return { ok: false, error: 'Bulan mulai harus sebelum bulan selesai' }
  if (!flyer || flyer.size === 0) return { ok: false, error: 'Flyer pusat wajib diunggah' }
  if (!FLYER_TYPES.has(flyer.type)) return { ok: false, error: 'Flyer harus JPEG, PNG, WebP, atau GIF.' }
  if (flyer.size > FLYER_MAX_BYTES) return { ok: false, error: 'Flyer maksimal 4 MB.' }

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return { ok: false, error: 'BLOB_READ_WRITE_TOKEN belum di-set.' }
  const blob = await put(`wfe-serentak/${flyer.name}`, flyer, {
    access: 'public',
    addRandomSuffix: true,
    token,
  })

  const existing = await db.wfe_serentak.findFirst({
    where: { bulan_mulai: mulai, bulan_selesai: selesai },
    orderBy: { id: 'desc' },
  })
  if (existing) {
    await db.wfe_serentak.update({
      where: { id: existing.id },
      data: { image_url: blob.url },
    })
  } else {
    await db.wfe_serentak.create({
      data: { bulan_mulai: mulai, bulan_selesai: selesai, image_url: blob.url },
    })
  }
  revalidatePath('/dashboard/kota/brim')
  revalidatePath('/dashboard/kota/brim/wfe-flyer')
  return { ok: true }
}
