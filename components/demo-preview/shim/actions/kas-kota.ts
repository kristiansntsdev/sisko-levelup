'use client'
import type { KasKotaData, KasResult, TxnKotaInput } from '@/lib/actions/kas-kota'
import { addLog, getDb, mutate, type DbKasTxn } from '../../db'
import { alkPengurus } from '../util'

export type * from '@/lib/actions/kas-kota'

const signed = (t: Pick<DbKasTxn, 'tipe' | 'jumlah'>) => (t.tipe === 'masuk' ? t.jumlah : -t.jumlah)

export async function getKasKota(idCabang: number): Promise<KasKotaData> {
  const rows = getDb()
    .kas_kota_txn.filter((t) => t.id_cabang === idCabang)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id_txn - a.id_txn)
  return {
    id_kas_kota: idCabang,
    id_cabang: idCabang,
    saldo: rows.reduce((s, t) => s + signed(t), 0),
    txns: rows.map((t) => ({
      id_txn: t.id_txn,
      tanggal: `${t.tanggal}T00:00:00.000Z`,
      keterangan: t.keterangan,
      jumlah: t.jumlah,
      tipe: t.tipe,
      kategori: t.kategori,
      id_event: t.id_event ?? null,
    })),
  }
}

/** Same checks as the real action, minus the DB. */
function check(input: TxnKotaInput): { ok: false; error: string } | null {
  if (!Number.isInteger(input.jumlah) || input.jumlah <= 0) return { ok: false, error: 'Jumlah harus lebih dari 0' }
  if (!input.keterangan.trim()) return { ok: false, error: 'Keterangan wajib diisi' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.tanggal)) return { ok: false, error: 'Tanggal tidak valid' }
  if (input.kategori === 'event' && !getDb().event.some((e) => e.id_event === input.idEvent)) return { ok: false, error: 'Pilih event' }
  return null
}

const eventIdOf = (input: TxnKotaInput) => (input.kategori === 'event' ? (input.idEvent ?? null) : null)

function cabang(): number | null {
  const p = alkPengurus()
  return p ? Number(p.cabang) : null
}

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

export async function addTxnKota(input: TxnKotaInput): Promise<KasResult> {
  const idCabang = cabang()
  if (idCabang == null) return { ok: false, error: 'Sesi pengurus ALK berakhir, silakan login ulang' }
  const bad = check(input)
  if (bad) return bad
  mutate((d) => {
    d.kas_kota_txn.push({
      id_txn: d.nextId++,
      id_cabang: idCabang,
      tanggal: input.tanggal,
      keterangan: input.keterangan.trim(),
      jumlah: input.jumlah,
      tipe: input.tipe,
      kategori: input.kategori,
      id_event: eventIdOf(input),
    })
    addLog(d, `Kas: ${input.tipe === 'masuk' ? 'pemasukan' : 'pengeluaran'} ${fmt(input.jumlah)} dicatat`)
  })
  return { ok: true }
}

export async function updateTxnKota(idTxn: number, input: TxnKotaInput): Promise<KasResult> {
  const idCabang = cabang()
  if (idCabang == null) return { ok: false, error: 'Sesi pengurus ALK berakhir, silakan login ulang' }
  const bad = check(input)
  if (bad) return bad
  if (!getDb().kas_kota_txn.some((t) => t.id_txn === idTxn && t.id_cabang === idCabang)) return { ok: false, error: 'Transaksi tidak ditemukan' }
  mutate((d) => {
    const t = d.kas_kota_txn.find((x) => x.id_txn === idTxn)
    if (!t) return
    Object.assign(t, { tanggal: input.tanggal, keterangan: input.keterangan.trim(), jumlah: input.jumlah, tipe: input.tipe, kategori: input.kategori, id_event: eventIdOf(input) })
    addLog(d, 'Kas: transaksi diperbarui')
  })
  return { ok: true }
}

export async function deleteTxnKota(idTxn: number): Promise<KasResult> {
  const idCabang = cabang()
  if (idCabang == null) return { ok: false, error: 'Sesi pengurus ALK berakhir, silakan login ulang' }
  if (!getDb().kas_kota_txn.some((t) => t.id_txn === idTxn && t.id_cabang === idCabang)) return { ok: false, error: 'Transaksi tidak ditemukan' }
  mutate((d) => {
    d.kas_kota_txn = d.kas_kota_txn.filter((t) => t.id_txn !== idTxn)
    addLog(d, 'Kas: transaksi dihapus')
  })
  return { ok: true }
}
