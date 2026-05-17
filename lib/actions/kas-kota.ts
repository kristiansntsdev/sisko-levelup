'use server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type TxnKotaItem = {
  id_txn: number
  tanggal: string
  keterangan: string
  jumlah: number
  tipe: 'masuk' | 'keluar'
  kategori: 'harian' | 'event'
}

export type KasKotaData = {
  id_kas_kota: number
  id_cabang: number
  saldo: number
  txns: TxnKotaItem[]
}

export async function getKasKota(idCabang: number): Promise<KasKotaData> {
  const [kas, txns] = await Promise.all([
    db.kas_kota.upsert({
      where: { id_cabang: idCabang },
      create: { id_cabang: idCabang, saldo: 0 },
      update: {},
    }),
    db.kas_kota_txn.findMany({
      where: { id_cabang: idCabang },
      orderBy: [{ tanggal: 'desc' }, { id_txn: 'desc' }],
    }),
  ])

  return {
    id_kas_kota: kas.id_kas_kota,
    id_cabang: kas.id_cabang,
    saldo: Number(kas.saldo),
    txns: txns.map((t) => ({
      id_txn: t.id_txn,
      tanggal: t.tanggal.toISOString(),
      keterangan: t.keterangan,
      jumlah: Number(t.jumlah),
      tipe: t.tipe as 'masuk' | 'keluar',
      kategori: t.kategori as 'harian' | 'event',
    })),
  }
}

export async function addTxnKota(payload: {
  idCabang: number
  tipe: 'masuk' | 'keluar'
  jumlah: number
  keterangan: string
  tanggal: string
  kategori: 'harian' | 'event'
}) {
  const { idCabang, tipe, jumlah, keterangan, tanggal, kategori } = payload

  await db.$transaction([
    db.kas_kota_txn.create({
      data: {
        id_cabang: idCabang,
        tanggal: new Date(tanggal),
        keterangan,
        jumlah,
        tipe,
        kategori,
      },
    }),
    db.kas_kota.update({
      where: { id_cabang: idCabang },
      data: {
        saldo: tipe === 'masuk' ? { increment: jumlah } : { decrement: jumlah },
        updated_at: new Date(),
      },
    }),
  ])

  revalidatePath('/dashboard/kota/alk')
}

export async function deleteTxnKota(
  idTxn: number,
  idCabang: number,
  jumlah: number,
  tipe: 'masuk' | 'keluar',
) {
  await db.$transaction([
    db.kas_kota_txn.delete({ where: { id_txn: idTxn } }),
    db.kas_kota.update({
      where: { id_cabang: idCabang },
      data: {
        saldo: tipe === 'masuk' ? { decrement: jumlah } : { increment: jumlah },
        updated_at: new Date(),
      },
    }),
  ])

  revalidatePath('/dashboard/kota/alk')
}

export async function updateTxnKota(
  idTxn: number,
  idCabang: number,
  oldJumlah: number,
  oldTipe: 'masuk' | 'keluar',
  payload: {
    tipe: 'masuk' | 'keluar'
    jumlah: number
    keterangan: string
    tanggal: string
    kategori: 'harian' | 'event'
  },
) {
  const { tipe, jumlah, keterangan, tanggal, kategori } = payload

  const reverseOld = oldTipe === 'masuk' ? -oldJumlah : oldJumlah
  const applyNew = tipe === 'masuk' ? jumlah : -jumlah
  const netDelta = reverseOld + applyNew

  await db.$transaction([
    db.kas_kota_txn.update({
      where: { id_txn: idTxn },
      data: {
        tanggal: new Date(tanggal),
        keterangan,
        jumlah,
        tipe,
        kategori,
      },
    }),
    db.kas_kota.update({
      where: { id_cabang: idCabang },
      data: {
        saldo: netDelta > 0
          ? { increment: netDelta }
          : netDelta < 0
            ? { decrement: -netDelta }
            : undefined,
        updated_at: new Date(),
      },
    }),
  ])

  revalidatePath('/dashboard/kota/alk')
}
