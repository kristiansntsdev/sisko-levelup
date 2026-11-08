'use server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getPengurusFromCookie } from '@/lib/pengurus-session'
import { resolveEventCabang } from '@/lib/event-cabang'
import { setActor } from '@/lib/request-context'
import { ALK_BASE } from '@/components/alk-v2/paths'

export type TxnKotaItem = {
  id_txn: number
  tanggal: string
  keterangan: string
  jumlah: number
  tipe: 'masuk' | 'keluar'
  kategori: 'harian' | 'event'
  /** null = harian, atau baris lama yang hanya menyimpan nama event (lihat lib/kas-event.ts) */
  id_event: number | null
}

export type KasKotaData = {
  id_kas_kota: number
  id_cabang: number
  saldo: number
  txns: TxnKotaItem[]
}

export type TxnKotaInput = {
  tipe: 'masuk' | 'keluar'
  jumlah: number
  keterangan: string
  /** YYYY-MM-DD (tanggal kalender WIB) */
  tanggal: string
  kategori: 'harian' | 'event'
  /** Wajib untuk kategori event; diabaikan untuk harian */
  idEvent?: number | null
}

export type KasResult = { ok: true } | { ok: false; error: string }

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
      id_event: t.id_event,
    })),
  }
}

/** Cabang kas milik pengurus ALK yang login (Nasional = 0). Tidak pernah dari client. */
async function kasCabang(): Promise<number | null> {
  const p = await getPengurusFromCookie()
  if (!p || p.divisi !== 'alk') return null
  setActor({ type: 'pengurus', id: p.id_pengurus, label: p.username })
  const id = Number(resolveEventCabang(p))
  return Number.isFinite(id) ? id : null
}

const MAX_KETERANGAN = 500

type TxnData = Omit<TxnKotaInput, 'tanggal' | 'idEvent'> & { tanggal: Date; id_event: number | null }

async function parseInput(input: TxnKotaInput, idCabang: number): Promise<{ ok: true; data: TxnData } | { ok: false; error: string }> {
  const { tipe, kategori } = input
  if (tipe !== 'masuk' && tipe !== 'keluar') return { ok: false, error: 'Tipe tidak valid' }
  if (kategori !== 'harian' && kategori !== 'event') return { ok: false, error: 'Kategori tidak valid' }
  const jumlah = Number(input.jumlah)
  if (!Number.isInteger(jumlah) || jumlah <= 0 || jumlah > 9_999_999_999_999) return { ok: false, error: 'Jumlah harus lebih dari 0' }
  const keterangan = String(input.keterangan ?? '').trim()
  if (!keterangan) return { ok: false, error: 'Keterangan wajib diisi' }
  if (keterangan.length > MAX_KETERANGAN) return { ok: false, error: `Keterangan maksimal ${MAX_KETERANGAN} karakter` }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.tanggal)) return { ok: false, error: 'Tanggal tidak valid' }
  const tanggal = new Date(`${input.tanggal}T00:00:00.000Z`)
  if (isNaN(tanggal.getTime()) || tanggal.toISOString().slice(0, 10) !== input.tanggal) return { ok: false, error: 'Tanggal tidak valid' }
  let id_event: number | null = null
  if (kategori === 'event') {
    const idEvent = Number(input.idEvent)
    if (!Number.isInteger(idEvent) || idEvent <= 0) return { ok: false, error: 'Pilih event' }
    const ev = await db.event.findUnique({ where: { id_event: idEvent }, select: { id_cabang: true } })
    // Kas kota hanya untuk event kotanya; kas Nasional (cabang 0) boleh event mana saja, seperti daftar event di tab Kas lama.
    if (!ev || (idCabang !== 0 && ev.id_cabang !== String(idCabang))) return { ok: false, error: 'Event tidak ditemukan di kota ini' }
    id_event = idEvent
  }
  return { ok: true, data: { tipe, kategori, jumlah, keterangan, tanggal, id_event } }
}

/** Pengaruh satu transaksi ke saldo: masuk menambah, keluar mengurangi. */
const signed = (tipe: string, jumlah: number) => (tipe === 'masuk' ? jumlah : -jumlah)

function saldoChange(delta: number) {
  return delta > 0 ? { increment: delta } : { decrement: -delta }
}

function revalidateKas() {
  revalidatePath('/dashboard/kota/alk')
  revalidatePath(ALK_BASE)
  revalidatePath(`${ALK_BASE}/kas`)
}

export async function addTxnKota(input: TxnKotaInput): Promise<KasResult> {
  const idCabang = await kasCabang()
  if (idCabang == null) return { ok: false, error: 'Sesi pengurus ALK berakhir, silakan login ulang' }
  const parsed = await parseInput(input, idCabang)
  if (!parsed.ok) return parsed
  const { tipe, jumlah, keterangan, tanggal, kategori, id_event } = parsed.data

  await db.$transaction([
    db.kas_kota_txn.create({
      data: { id_cabang: idCabang, tanggal, keterangan, jumlah, tipe, kategori, id_event },
    }),
    db.kas_kota.upsert({
      where: { id_cabang: idCabang },
      create: { id_cabang: idCabang, saldo: signed(tipe, jumlah) },
      update: { saldo: saldoChange(signed(tipe, jumlah)), updated_at: new Date() },
    }),
  ])

  revalidateKas()
  return { ok: true }
}

export async function updateTxnKota(idTxn: number, input: TxnKotaInput): Promise<KasResult> {
  const idCabang = await kasCabang()
  if (idCabang == null) return { ok: false, error: 'Sesi pengurus ALK berakhir, silakan login ulang' }
  const parsed = await parseInput(input, idCabang)
  if (!parsed.ok) return parsed
  const { tipe, jumlah, keterangan, tanggal, kategori, id_event } = parsed.data

  // Selisih saldo dihitung dari baris di DB, bukan dari angka yang dikirim client.
  const found = await db.$transaction(async (tx) => {
    const old = await tx.kas_kota_txn.findFirst({ where: { id_txn: idTxn, id_cabang: idCabang } })
    if (!old) return false
    await tx.kas_kota_txn.update({
      where: { id_txn: idTxn },
      data: { tanggal, keterangan, jumlah, tipe, kategori, id_event },
    })
    const delta = signed(tipe, jumlah) - signed(old.tipe, Number(old.jumlah))
    if (delta !== 0) {
      await tx.kas_kota.update({
        where: { id_cabang: idCabang },
        data: { saldo: saldoChange(delta), updated_at: new Date() },
      })
    }
    return true
  })
  if (!found) return { ok: false, error: 'Transaksi tidak ditemukan' }

  revalidateKas()
  return { ok: true }
}

export async function deleteTxnKota(idTxn: number): Promise<KasResult> {
  const idCabang = await kasCabang()
  if (idCabang == null) return { ok: false, error: 'Sesi pengurus ALK berakhir, silakan login ulang' }

  const found = await db.$transaction(async (tx) => {
    const old = await tx.kas_kota_txn.findFirst({ where: { id_txn: idTxn, id_cabang: idCabang } })
    if (!old) return false
    await tx.kas_kota_txn.delete({ where: { id_txn: idTxn } })
    await tx.kas_kota.update({
      where: { id_cabang: idCabang },
      data: { saldo: saldoChange(-signed(old.tipe, Number(old.jumlah))), updated_at: new Date() },
    })
    return true
  })
  if (!found) return { ok: false, error: 'Transaksi tidak ditemukan' }

  revalidateKas()
  return { ok: true }
}
