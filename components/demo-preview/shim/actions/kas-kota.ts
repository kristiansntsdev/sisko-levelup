'use client'
import type { KasKotaData } from '@/lib/actions/kas-kota'

export type * from '@/lib/actions/kas-kota'

export async function getKasKota(idCabang: number): Promise<KasKotaData> {
  return { id_kas_kota: idCabang, id_cabang: idCabang, saldo: 4250000, txns: [] }
}
