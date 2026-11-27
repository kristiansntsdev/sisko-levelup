/** Siapa saja yang sudah mengaktifkan notifikasi (halaman /pengumuman/pengguna). Hanya server, baca raw SQL. */
import { db } from '@/lib/db'
import { USERLEVEL_LABEL } from '@/lib/pwa-member'
import { peranPengurus } from './pengurus'
import { platformDari, type Platform } from './target'

export type PenggunaPush = {
  key: string
  tipe: 'anggota' | 'pengurus'
  id: number
  nama: string
  idKota: string
  kota: string
  peran: string
  perangkat: Partial<Record<Platform, number>>
  jumlah: number
  /** Epoch ms; ditampilkan di zona perangkat oleh <Waktu>. */
  sejakMs: number
  terakhirMs: number
}

export type RingkasanPush = {
  perangkat: number
  anggota: number
  pengurus: number
  platform: Record<Platform, number>
}

export type FilterPengguna = { q: string; kota: string; jenis: 'semua' | 'anggota' | 'pengurus'; halaman: number }

export const PENGGUNA_PER_HALAMAN = 50

const PERAN_LABEL = { sekretariat: 'Sekretariat Nasional', 'brim-nasional': 'BRIM Nasional', 'alk-kota': 'ALK Kota', 'brim-kota': 'BRIM Kota' } as const

/** sejak / terakhir = UNIX_TIMESTAMP(): kolom DATETIME diisi jam dinding server MySQL (WIB), driver membacanya sebagai UTC. */
type Grup = { id: number; n: bigint | number; sejak: bigint | number; terakhir: bigint | number; ua: string | null }

function hitungPlatform(ua: string | null): Partial<Record<Platform, number>> {
  const out: Partial<Record<Platform, number>> = {}
  for (const u of (ua ?? '').split('\n')) {
    const p = platformDari(u)
    out[p] = (out[p] ?? 0) + 1
  }
  return out
}

/** Jumlah perangkat, anggota, pengurus, dan platform. Null kalau tabel belum ada. */
export async function ringkasanPush(): Promise<RingkasanPush | null> {
  try {
    const rows = await db.$queryRaw<{ user_agent: string; id_peserta: number | null; id_pengurus: number | null }[]>`
      SELECT user_agent, id_peserta, id_pengurus FROM push_subscription`
    const out: RingkasanPush = { perangkat: rows.length, anggota: 0, pengurus: 0, platform: { iOS: 0, Android: 0, Desktop: 0, Lainnya: 0 } }
    out.anggota = new Set(rows.filter((r) => r.id_peserta != null).map((r) => Number(r.id_peserta))).size
    out.pengurus = new Set(rows.filter((r) => r.id_pengurus != null).map((r) => Number(r.id_pengurus))).size
    for (const r of rows) out.platform[platformDari(r.user_agent)]++
    return out
  } catch (err) {
    console.error('[pengumuman] ringkasan gagal', err)
    return null
  }
}

export async function daftarPengguna(f: FilterPengguna): Promise<{
  siap: boolean
  ringkasan: RingkasanPush
  items: PenggunaPush[]
  total: number
}> {
  const kosong: RingkasanPush = { perangkat: 0, anggota: 0, pengurus: 0, platform: { iOS: 0, Android: 0, Desktop: 0, Lainnya: 0 } }
  try {
    const [gp, gg, ringkasan, cabang] = await Promise.all([
      db.$queryRaw<Grup[]>`
        SELECT id_peserta AS id, COUNT(*) AS n, UNIX_TIMESTAMP(MIN(created_at)) AS sejak, UNIX_TIMESTAMP(MAX(updated_at)) AS terakhir,
               GROUP_CONCAT(user_agent SEPARATOR '\n') AS ua
        FROM push_subscription WHERE id_peserta IS NOT NULL GROUP BY id_peserta`,
      db.$queryRaw<Grup[]>`
        SELECT id_pengurus AS id, COUNT(*) AS n, UNIX_TIMESTAMP(MIN(created_at)) AS sejak, UNIX_TIMESTAMP(MAX(updated_at)) AS terakhir,
               GROUP_CONCAT(user_agent SEPARATOR '\n') AS ua
        FROM push_subscription WHERE id_pengurus IS NOT NULL GROUP BY id_pengurus`,
      ringkasanPush(),
      db.cabang.findMany({ select: { id_cabang: true, namacabang: true } }),
    ])
    const namaKota = new Map(cabang.map((c) => [String(c.id_cabang), c.namacabang]))
    const kotaKey = (k: string) => String(Number(k))

    if (!ringkasan) throw new Error('push_subscription belum ada')

    const [peserta, pengurus] = await Promise.all([
      gp.length
        ? db.peserta.findMany({ where: { id_peserta: { in: gp.map((g) => Number(g.id)) } }, select: { id_peserta: true, nama: true, kotalevelup: true, userlevel: true } })
        : [],
      gg.length
        ? db.pengurus.findMany({ where: { id_pengurus: { in: gg.map((g) => Number(g.id)) } }, select: { id_pengurus: true, nama: true, kotalevelup: true, divisi: true, username: true } })
        : [],
    ])
    const pMap = new Map(peserta.map((p) => [p.id_peserta, p]))
    const gMap = new Map(pengurus.map((p) => [p.id_pengurus, p]))

    const semua: PenggunaPush[] = []
    for (const g of gp) {
      const p = pMap.get(Number(g.id))
      if (!p) continue
      const idKota = kotaKey(p.kotalevelup)
      semua.push({
        key: `a-${g.id}`,
        tipe: 'anggota',
        id: Number(g.id),
        nama: p.nama,
        idKota,
        kota: namaKota.get(idKota) ?? 'Tanpa kota',
        peran: USERLEVEL_LABEL[p.userlevel] ?? 'Guest',
        perangkat: hitungPlatform(g.ua),
        jumlah: Number(g.n),
        sejakMs: Number(g.sejak) * 1000,
        terakhirMs: Number(g.terakhir) * 1000,
      })
    }
    for (const g of gg) {
      const p = gMap.get(Number(g.id))
      if (!p) continue
      const peran = peranPengurus(p)
      const idKota = kotaKey(p.kotalevelup)
      const pusat = peran === 'sekretariat' || peran === 'brim-nasional'
      semua.push({
        key: `p-${g.id}`,
        tipe: 'pengurus',
        id: Number(g.id),
        nama: p.nama,
        idKota: pusat ? '0' : idKota,
        kota: pusat ? 'Nasional' : (namaKota.get(idKota) ?? 'Tanpa kota'),
        peran: peran ? PERAN_LABEL[peran] : (p.divisi ?? 'Pengurus').toUpperCase(),
        perangkat: hitungPlatform(g.ua),
        jumlah: Number(g.n),
        sejakMs: Number(g.sejak) * 1000,
        terakhirMs: Number(g.terakhir) * 1000,
      })
    }

    const q = f.q.trim().toLowerCase()
    const hasil = semua
      .filter((u) => f.jenis === 'semua' || u.tipe === f.jenis)
      .filter((u) => !f.kota || u.idKota === kotaKey(f.kota))
      .filter((u) => !q || u.nama.toLowerCase().includes(q))
      .sort((a, b) => b.terakhirMs - a.terakhirMs)

    const page = Math.max(1, Math.floor(f.halaman) || 1)
    return {
      siap: true,
      ringkasan,
      total: hasil.length,
      items: hasil.slice((page - 1) * PENGGUNA_PER_HALAMAN, page * PENGGUNA_PER_HALAMAN),
    }
  } catch (err) {
    console.error('[pengumuman] daftar pengguna gagal', err)
    return { siap: false, ringkasan: kosong, items: [], total: 0 }
  }
}
