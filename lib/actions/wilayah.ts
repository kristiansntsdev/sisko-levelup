'use server'
import { db } from '@/lib/db'

export type WilayahOption = { id: string; nama: string }

export async function listProvinsi(): Promise<WilayahOption[]> {
  const rows = await db.wilayah_provinsi.findMany({
    select: { id: true, nama: true },
    orderBy: { nama: 'asc' },
  })
  return rows.map((r) => ({ id: r.id, nama: r.nama }))
}

export async function listKabupaten(provinsiId: string): Promise<WilayahOption[]> {
  if (!provinsiId) return []
  const rows = await db.wilayah_kabupaten.findMany({
    where: { provinsi_id: provinsiId },
    select: { id: true, nama: true },
    orderBy: { nama: 'asc' },
  })
  return rows.map((r) => ({ id: r.id, nama: r.nama }))
}

export async function listKecamatan(kabupatenId: string): Promise<WilayahOption[]> {
  if (!kabupatenId) return []
  const rows = await db.wilayah_kecamatan.findMany({
    where: { kabupaten_id: kabupatenId },
    select: { id: true, nama: true },
    orderBy: { nama: 'asc' },
  })
  return rows.map((r) => ({ id: r.id, nama: r.nama }))
}

export async function listDesa(kecamatanId: string): Promise<WilayahOption[]> {
  if (!kecamatanId) return []
  const rows = await db.wilayah_desa.findMany({
    where: { kecamatan_id: kecamatanId },
    select: { id: true, nama: true },
    orderBy: { nama: 'asc' },
  })
  return rows
    .filter((r): r is { id: string; nama: string } => Boolean(r.nama))
    .map((r) => ({ id: r.id, nama: r.nama }))
}
