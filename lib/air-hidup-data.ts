/** Baca data Air Hidup untuk halaman server. Hanya server; bukan 'use server', jadi bukan endpoint publik. */
import { db } from '@/lib/db'
import { Prisma } from '@/lib/generated/client'
import { sessionPesertaId } from '@/lib/peserta-session'
import { wibToday } from '@/lib/wib'
import {
  AIR_MIN_LEVEL, airAnggota, hitungNasional, PIC_USERLEVEL, terakhirMinum,
  type AirAnggota, type AirBeranda, type AliranData, type EditData, type PicData, type WwLaporan,
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

type AnggotaRow = {
  id_peserta: number; nama: string; id_cabang: number | null; namacabang: string | null
  tag: string | null; absen: string | null; mulai: string | null
}

/**
 * Status air anggota. Terakhir minum = yang paling baru antara (a) absen di event Online (WW Online) dan (b) penandaan di
 * laporan WW PIC (`ww_peserta`). Air mulai penuh di hari kota masuk sistem (`ww_kota.mulai`) atau hari anggota daftar
 * (`peserta.created_at`, kosong untuk anggota lama), mana yang lebih baru.
 * Waktu: `absen.timestamp` ditulis Prisma dalam UTC (+7 jam = hari WIB); `ww_peserta.created_at` diisi default DB (jam dinding WIB).
 */
export async function daftarAirAnggota(today: string, f: { idCabang?: number; idPeserta?: number; tambahan?: number[]; minLevel?: number } = {}): Promise<AirAnggota[]> {
  const kondisi: Prisma.Sql[] = []
  if (f.idPeserta != null) kondisi.push(Prisma.sql`p.id_peserta = ${f.idPeserta}`)
  if (f.minLevel != null) kondisi.push(Prisma.sql`CAST(p.userlevel AS UNSIGNED) >= ${f.minLevel}`)
  if (f.idCabang != null) {
    kondisi.push(f.tambahan?.length
      ? Prisma.sql`(c.id_cabang = ${f.idCabang} OR p.id_peserta IN (${Prisma.join(f.tambahan)}))`
      : Prisma.sql`c.id_cabang = ${f.idCabang}`)
  }
  const where = kondisi.length ? Prisma.sql`WHERE ${Prisma.join(kondisi, ' AND ')}` : Prisma.empty
  const rows = await db.$queryRaw<AnggotaRow[]>`
    SELECT p.id_peserta, p.nama, c.id_cabang, c.namacabang,
           DATE_FORMAT(t.m, '%Y-%m-%d') AS tag,
           DATE_FORMAT(o.m + INTERVAL 7 HOUR, '%Y-%m-%d') AS absen,
           DATE_FORMAT(NULLIF(GREATEST(COALESCE(k.mulai, '1970-01-01'), COALESCE(DATE(p.created_at), '1970-01-01')), '1970-01-01'), '%Y-%m-%d') AS mulai
    FROM peserta p
    LEFT JOIN cabang c ON c.id_cabang = CAST(p.kotalevelup AS UNSIGNED)
    LEFT JOIN ww_kota k ON k.id_cabang = c.id_cabang
    LEFT JOIN (SELECT id_peserta, MAX(created_at) AS m FROM ww_peserta GROUP BY id_peserta) t ON t.id_peserta = p.id_peserta
    LEFT JOIN (
      SELECT a.id_peserta_int AS id_peserta, MAX(a.\`timestamp\`) AS m
      FROM absen a JOIN event e ON e.id_event = a.id_event_int
      WHERE LOWER(TRIM(e.jenisevent)) = 'online' AND a.id_peserta_int IS NOT NULL
      GROUP BY a.id_peserta_int
    ) o ON o.id_peserta = p.id_peserta
    ${where}`
  return rows.map((r) =>
    airAnggota({
      id: Number(r.id_peserta), nama: r.nama, idCabang: r.id_cabang == null ? null : Number(r.id_cabang), namaKota: r.namacabang,
      terakhir: terakhirMinum(r.tag, r.absen), mulai: r.mulai,
    }, today))
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

/** Panel Beranda: air milik anggota itu sendiri + Kabar Terbaru untuk semua anggota. null = belum login. */
export async function dataBeranda(): Promise<AirBeranda | null> {
  const me = await anggotaAir()
  if (!me || me.level < AIR_MIN_LEVEL) return null
  const today = hariIni()
  const isPic = me.userlevel === PIC_USERLEVEL
  // Air anggota gagal dibaca (mis. tabel ww_peserta belum dimigrasi) tidak boleh menyembunyikan Kabar Terbaru / tombol Dashboard PIC.
  const aman = <T,>(p: Promise<T>, nilai: T) => p.catch((e: unknown) => (console.error('dataBeranda air', e), nilai))
  const [laporan, [saya]] = await Promise.all([
    daftarLaporan(me.id, 3),
    aman(daftarAirAnggota(today, { idPeserta: me.id }), [] as AirAnggota[]),
  ])
  return { saya: saya ?? null, isPic, pembaca: `p${me.id}`, laporan }
}

/** Dashboard PIC. null = bukan PIC atau kotanya tidak valid. */
export async function dataPic(me: AnggotaAir): Promise<PicData | null> {
  if (me.userlevel !== PIC_USERLEVEL || !me.cabang) return null
  const today = hariIni()
  const anggota = await daftarAirAnggota(today, { idCabang: me.cabang })
  const saya = anggota.find((a) => a.id === me.id)
  if (!saya) return null
  return { today, saya, namaKota: saya.namaKota, anggota, laporanKota: await daftarLaporan(me.id, 20, me.cabang) }
}

/** Aliran Air Hidup: penghitung 30 hari + laporan terbaru. */
export async function dataAliran(me: AnggotaAir): Promise<AliranData> {
  const today = hariIni()
  const [anggota, laporan] = await Promise.all([daftarAirAnggota(today), daftarLaporan(me.id, 50)])
  return {
    today,
    nasional: hitungNasional(anggota),
    laporan,
  }
}

/** Id anggota yang ditandai di satu laporan. */
export async function anggotaLaporan(idLaporan: number): Promise<number[]> {
  const rows = await db.$queryRaw<{ id_peserta: number }[]>`SELECT id_peserta FROM ww_peserta WHERE id_laporan = ${idLaporan}`
  return rows.map((r) => Number(r.id_peserta))
}

/** Laporan untuk diedit: hanya PIC kota pemilik laporan. null = bukan PIC kota itu / tidak ada. */
export async function dataEditLaporan(me: AnggotaAir, idLaporan: number): Promise<EditData | null> {
  if (me.userlevel !== PIC_USERLEVEL || !me.cabang || !Number.isInteger(idLaporan) || idLaporan <= 0) return null
  const [r] = await db.$queryRaw<{ id_laporan: number; id_cabang: number; namacabang: string; tanggal: string; isi: string; foto_url: string; foto_x: number; foto_y: number }[]>`
    SELECT l.id_laporan, l.id_cabang, c.namacabang, DATE_FORMAT(l.tanggal, '%Y-%m-%d') AS tanggal, l.isi, l.foto_url, l.foto_x, l.foto_y
    FROM ww_laporan l JOIN cabang c ON c.id_cabang = l.id_cabang
    WHERE l.id_laporan = ${idLaporan} AND l.id_cabang = ${me.cabang} LIMIT 1`
  if (!r) return null
  const today = hariIni()
  const ditandai = await anggotaLaporan(idLaporan)
  // Yang sudah ditandai tetap tampil walau kotanya kini pindah, supaya menyimpan ulang tidak diam-diam mencoretnya.
  const anggota = await daftarAirAnggota(today, { idCabang: me.cabang, tambahan: ditandai })
  return {
    today,
    namaKota: r.namacabang,
    anggota,
    laporan: { id: Number(r.id_laporan), tanggal: r.tanggal, anggota: ditandai, isi: r.isi, foto: r.foto_url, fotoX: Number(r.foto_x), fotoY: Number(r.foto_y) },
  }
}
