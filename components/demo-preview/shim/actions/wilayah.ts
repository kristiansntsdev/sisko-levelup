'use client'
import type { WilayahOption } from '@/lib/actions/wilayah'

export type * from '@/lib/actions/wilayah'

// Small slice of the BPS tables: enough to exercise the cascading selects in Profil → Perubahan Data.
const PROV: WilayahOption[] = [{ id: '12', nama: 'SUMATERA UTARA' }, { id: '35', nama: 'JAWA TIMUR' }]
const KAB: Record<string, WilayahOption[]> = {
  '12': [{ id: '1275', nama: 'KOTA MEDAN' }, { id: '1207', nama: 'DELI SERDANG' }, { id: '1276', nama: 'KOTA BINJAI' }],
  '35': [{ id: '3521', nama: 'NGAWI' }, { id: '3578', nama: 'KOTA SURABAYA' }],
}
const KEC: Record<string, WilayahOption[]> = {
  '1275': [{ id: '127501', nama: 'MEDAN KOTA' }, { id: '127502', nama: 'MEDAN BARAT' }, { id: '127503', nama: 'MEDAN SELAYANG' }],
  '1207': [{ id: '120701', nama: 'LUBUK PAKAM' }, { id: '120702', nama: 'TANJUNG MORAWA' }],
  '1276': [{ id: '127601', nama: 'BINJAI KOTA' }, { id: '127602', nama: 'BINJAI UTARA' }],
  '3521': [{ id: '352101', nama: 'NGAWI' }],
  '3578': [{ id: '357801', nama: 'GENTENG' }],
}
const DESA: Record<string, WilayahOption[]> = {
  '127501': [{ id: '12750101', nama: 'PUSAT PASAR' }, { id: '12750102', nama: 'SEI RENGAS II' }],
  '127502': [{ id: '12750201', nama: 'KARANG BEROMBAK' }],
  '127503': [{ id: '12750301', nama: 'ASAM KUMBANG' }],
  '120701': [{ id: '12070101', nama: 'PETAPAHAN' }],
  '127601': [{ id: '12760101', nama: 'SETIA' }],
}

export async function listProvinsi(): Promise<WilayahOption[]> {
  return PROV
}
export async function listKabupaten(provinsiId: string): Promise<WilayahOption[]> {
  return KAB[provinsiId] ?? []
}
export async function listKecamatan(kabupatenId: string): Promise<WilayahOption[]> {
  return KEC[kabupatenId] ?? []
}
export async function listDesa(kecamatanId: string): Promise<WilayahOption[]> {
  return DESA[kecamatanId] ?? []
}
