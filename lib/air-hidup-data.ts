/** Baca data Air Hidup untuk halaman server. Hanya server; bukan 'use server', jadi bukan endpoint publik. */
import { db } from '@/lib/db'
import { Prisma } from '@/lib/generated/client'
import { sessionPesertaId } from '@/lib/peserta-session'
import { wibToday } from '@/lib/wib'
import {
  addDays, AIR_MIN_USERLEVEL, hitungNasional, kotaAir, PIC_USERLEVEL,
  type AirBeranda, type AliranData, type EditData, type KotaAir, type PicData, type WwLaporan,
} from '@/lib/air-hidup'

export type AnggotaAir = { id: number; nama: string; level: number; userlevel: string; cabang: number | null }

/** Anggota yang login; nama, level, dan kota dibaca dari DB, bukan dari sesi (level bisa berubah setelah login). */
export async function anggotaAir(): Promise<AnggotaAir | null> {
  const id = await sessionPesertaId()
  if (!id) return null
  const p = await db.peserta.findUnique({ where: { id_peserta: id }, select: { nama: true, userlevel: true, kotalevelup: true } })
  if (!p) return null
  const cabang = Number(p.kotalevelup)
  return { id, nama: p.nama, level: Number(p.userlevel) || 0, userlevel: p.userlevel, cabang: Number.isInteger(cabang) && cabang > 0 ? cabang : null }
}

export const hariIni = () => wibToday().toISOString().slice(0, 10)

type KotaRow = { id_cabang: number; namacabang: string; terakhir: string | null; mulai: string | null }

export async function daftarKotaAir(today: string, idCabang?: number): Promise<KotaAir[]> {
  const where = idCabang != null ? Prisma.sql`WHERE c.id_cabang = ${idCabang}` : Prisma.empty
  const rows = await db.$queryRaw<KotaRow[]>`
    SELECT c.id_cabang, c.namacabang,
           -- Air terisi di hari laporan DIKIRIM (bukan tanggal WW). created_at ditulis Prisma dalam UTC, +7 jam = hari WIB.
           DATE_FORMAT(MAX(l.created_at) + INTERVAL 7 HOUR, '%Y-%m-%d') AS terakhir,
           DATE_FORMAT(k.mulai, '%Y-%m-%d') AS mulai
    FROM cabang c
    LEFT JOIN ww_laporan l ON l.id_cabang = c.id_cabang
    LEFT JOIN ww_kota k ON k.id_cabang = c.id_cabang
    ${where}
    GROUP BY c.id_cabang, c.namacabang, k.mulai`
  return rows.map((r) => kotaAir(Number(r.id_cabang), r.namacabang, r.terakhir, today, r.mulai))
}

type LaporanRow = {
  id_laporan: number; id_cabang: number; namacabang: string; tanggal: string; jumlah: number; isi: string
  foto_url: string; foto_x: number; foto_y: number; nama: string | null; amin: bigint | number; saya: bigint | number
}

export async function daftarLaporan(idSaya: number, limit: number, idCabang?: number): Promise<WwLaporan[]> {
  const where = idCabang != null ? Prisma.sql`WHERE l.id_cabang = ${idCabang}` : Prisma.empty
  const rows = await db.$queryRaw<LaporanRow[]>`
    SELECT l.id_laporan, l.id_cabang, c.namacabang, DATE_FORMAT(l.tanggal, '%Y-%m-%d') AS tanggal,
           l.jumlah, l.isi, l.foto_url, l.foto_x, l.foto_y, p.nama,
           (SELECT COUNT(*) FROM ww_amin a WHERE a.id_laporan = l.id_laporan) AS amin,
           (SELECT COUNT(*) FROM ww_amin a WHERE a.id_laporan = l.id_laporan AND a.id_peserta = ${idSaya}) AS saya
    FROM ww_laporan l
    JOIN cabang c ON c.id_cabang = l.id_cabang
    LEFT JOIN peserta p ON p.id_peserta = l.id_peserta
    ${where}
    ORDER BY l.tanggal DESC, l.id_laporan DESC
    LIMIT ${limit}`
  return rows.map((r) => ({
    id: Number(r.id_laporan), idCabang: Number(r.id_cabang), namaKota: r.namacabang, tanggal: r.tanggal,
    jumlah: Number(r.jumlah), isi: r.isi, foto: r.foto_url, fotoX: Number(r.foto_x), fotoY: Number(r.foto_y), oleh: r.nama ?? 'PIC',
    amin: Number(r.amin), aminSaya: Number(r.saya) > 0,
  }))
}

/** Panel Beranda: Kabar Terbaru untuk semua anggota, bar air kota hanya Core ke atas. null = belum login. */
export async function dataBeranda(): Promise<AirBeranda | null> {
  const me = await anggotaAir()
  if (!me) return null
  const today = hariIni()
  const [laporan, kota] = await Promise.all([
    daftarLaporan(me.id, 3),
    me.level >= AIR_MIN_USERLEVEL && me.cabang ? daftarKotaAir(today, me.cabang).then((k) => k[0] ?? null) : Promise.resolve(null),
  ])
  return { kota, isPic: me.userlevel === PIC_USERLEVEL, pembaca: `p${me.id}`, laporan }
}

/** Dashboard PIC. null = bukan PIC atau kotanya tidak valid. */
export async function dataPic(me: AnggotaAir): Promise<PicData | null> {
  if (me.userlevel !== PIC_USERLEVEL || !me.cabang) return null
  const today = hariIni()
  const kota = (await daftarKotaAir(today, me.cabang))[0]
  if (!kota) return null
  return { today, kota, namaKota: kota.namaKota, laporanKota: await daftarLaporan(me.id, 20, me.cabang) }
}

/** Aliran Air Hidup: penghitung 30 hari, bar tiap kota (hanya LevelUP Pusat), laporan terbaru. */
export async function dataAliran(me: AnggotaAir): Promise<AliranData> {
  const today = hariIni()
  const baru = await db.$queryRaw<{ id_cabang: number; tanggal: string; jumlah: number }[]>`
    SELECT id_cabang, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal, jumlah FROM ww_laporan WHERE tanggal >= ${addDays(today, -30)}`
  const [laporan, kota] = await Promise.all([
    daftarLaporan(me.id, 50),
    me.level >= 5 ? daftarKotaAir(today) : Promise.resolve(undefined),
  ])
  return {
    today,
    nasional: hitungNasional(baru.map((r) => ({ idCabang: Number(r.id_cabang), tanggal: r.tanggal, jumlah: Number(r.jumlah) })), today),
    kota,
    laporan,
  }
}

/** Laporan untuk diedit: hanya PIC kota pemilik laporan. null = bukan PIC kota itu / tidak ada. */
export async function dataEditLaporan(me: AnggotaAir, idLaporan: number): Promise<EditData | null> {
  if (me.userlevel !== PIC_USERLEVEL || !me.cabang || !Number.isInteger(idLaporan) || idLaporan <= 0) return null
  const [r] = await db.$queryRaw<{ id_laporan: number; id_cabang: number; namacabang: string; tanggal: string; jumlah: number; isi: string; foto_url: string; foto_x: number; foto_y: number }[]>`
    SELECT l.id_laporan, l.id_cabang, c.namacabang, DATE_FORMAT(l.tanggal, '%Y-%m-%d') AS tanggal, l.jumlah, l.isi, l.foto_url, l.foto_x, l.foto_y
    FROM ww_laporan l JOIN cabang c ON c.id_cabang = l.id_cabang
    WHERE l.id_laporan = ${idLaporan} AND l.id_cabang = ${me.cabang} LIMIT 1`
  if (!r) return null
  return {
    today: hariIni(),
    namaKota: r.namacabang,
    laporan: { id: Number(r.id_laporan), tanggal: r.tanggal, jumlah: Number(r.jumlah), isi: r.isi, foto: r.foto_url, fotoX: Number(r.foto_x), fotoY: Number(r.foto_y) },
  }
}
