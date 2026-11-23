'use server'
import { del } from '@vercel/blob'
import { revalidatePath } from 'next/cache'
import { ARTIKEL_IMG_MAX_BYTES, putArtikelImage } from '@/lib/artikel-blob'
import { db } from '@/lib/db'
import { UnreadablePhotoError } from '@/lib/profile-photo'
import { anggotaAir, dataBeranda, hariIni } from '@/lib/air-hidup-data'
import { fokusDari, laporanDari, PIC_USERLEVEL, validateLaporan, type AirBeranda } from '@/lib/air-hidup'
import { sessionPesertaId } from '@/lib/peserta-session'
import { pushAminWw, pushLaporanWw } from '@/lib/push/events'

/** Untuk Beranda: gagal baca (mis. tabel belum ada di jeda deploy → prod-migrate) = null, Beranda tetap jalan. */
export async function getAirBeranda(): Promise<AirBeranda | null> {
  try {
    return await dataBeranda()
  } catch (e) {
    console.error('getAirBeranda', e)
    return null
  }
}

function revalidatePathAir() {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/pic')
  revalidatePath('/dashboard/air-hidup')
}

/** foto_x/foto_y tidak ada di model Prisma (lihat prod-migrate): ditulis raw. Gagal = fokus tetap tengah, laporan tetap tersimpan. */
async function simpanFokus(id: number, f: { x: number; y: number }) {
  await db.$executeRaw`UPDATE ww_laporan SET foto_x = ${f.x}, foto_y = ${f.y} WHERE id_laporan = ${id}`.catch((e: unknown) => console.error('simpanFokus', e))
}

export type KirimLaporanResult = { ok: true; id: number } | { ok: false; error: string }

/** Hanya PIC (userlevel 4), dan hanya untuk kotanya sendiri: level dan kota dibaca dari DB, tidak pernah dari client. */
export async function kirimLaporanWw(fd: FormData): Promise<KirimLaporanResult> {
  const me = await anggotaAir()
  if (!me) return { ok: false, error: 'Masuk dulu.' }
  if (me.userlevel !== PIC_USERLEVEL) return { ok: false, error: 'Hanya PIC yang bisa melapor.' }
  if (!me.cabang) return { ok: false, error: 'LevelUP Kota belum diisi.' }
  const input = laporanDari(fd)
  const err = validateLaporan(input, hariIni())
  if (err) return { ok: false, error: err }

  try {
    const kota = await db.cabang.findUnique({ where: { id_cabang: me.cabang }, select: { id_cabang: true } })
    if (!kota) return { ok: false, error: 'LevelUP Kota tidak valid.' }
    const tanggal = new Date(`${input.tanggal}T00:00:00Z`)
    const isi = input.isi.trim()
    // Tap dua kali / kirim ulang: laporan yang sama persis tidak dibuat dua kali.
    const kembar = await db.ww_laporan.findFirst({
      where: { id_peserta: me.id, id_cabang: me.cabang, tanggal, isi, jumlah: input.jumlah },
      select: { id_laporan: true },
    })
    if (kembar) return { ok: false, error: 'Laporan ini sudah terkirim.' }

    let foto = ''
    const file = fd.get('foto')
    if (file instanceof File && file.size > 0) {
      if (file.size > ARTIKEL_IMG_MAX_BYTES) return { ok: false, error: 'Ukuran foto terlalu besar.' }
      try {
        foto = await putArtikelImage(file, 'ww')
      } catch (e) {
        if (e instanceof UnreadablePhotoError) return { ok: false, error: 'File ini tidak bisa dibaca sebagai foto. Coba foto lain.' }
        throw e
      }
    }
    let row
    try {
      row = await db.ww_laporan.create({ data: { id_cabang: me.cabang, id_peserta: me.id, tanggal, jumlah: input.jumlah, isi, foto_url: foto } })
    } catch (e) {
      if (foto) await del(foto, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => {})
      throw e
    }
    if (foto) await simpanFokus(row.id_laporan, fokusDari(fd))
    revalidatePathAir()
    void pushLaporanWw({ idLaporan: row.id_laporan, idKota: me.cabang, idPelapor: me.id, jumlah: input.jumlah, isi, foto })
    return { ok: true, id: row.id_laporan }
  } catch (e) {
    console.error('kirimLaporanWw', e)
    return { ok: false, error: 'Gagal mengirim. Coba lagi.' }
  }
}

/**
 * Edit laporan WW: hanya PIC dari kota pemilik laporan (level + kota dibaca dari DB). Boleh ganti tanggal, jumlah, isi,
 * foto (ganti / hapus) dan titik fokus foto. Tidak mengirim push ulang.
 * FormData: seperti kirimLaporanWw + `foto_x`/`foto_y`; `hapusFoto=1` membuang foto lama.
 */
export async function perbaruiLaporanWw(idLaporan: number, fd: FormData): Promise<KirimLaporanResult> {
  const me = await anggotaAir()
  if (!me) return { ok: false, error: 'Masuk dulu.' }
  if (me.userlevel !== PIC_USERLEVEL || !me.cabang) return { ok: false, error: 'Hanya PIC yang bisa mengubah laporan.' }
  const id = Math.floor(Number(idLaporan))
  if (!Number.isFinite(id) || id <= 0) return { ok: false, error: 'Laporan tidak ditemukan.' }
  const input = laporanDari(fd)
  const err = validateLaporan(input, hariIni())
  if (err) return { ok: false, error: err }

  let fotoBaru = ''
  try {
    const lama = await db.ww_laporan.findFirst({ where: { id_laporan: id, id_cabang: me.cabang }, select: { foto_url: true } })
    if (!lama) return { ok: false, error: 'Laporan tidak ditemukan.' }
    const tanggal = new Date(`${input.tanggal}T00:00:00Z`)
    const isi = input.isi.trim()
    const kembar = await db.ww_laporan.findFirst({
      where: { id_cabang: me.cabang, tanggal, isi, jumlah: input.jumlah, id_laporan: { not: id } },
      select: { id_laporan: true },
    })
    if (kembar) return { ok: false, error: 'Laporan yang sama sudah ada.' }

    const file = fd.get('foto')
    if (file instanceof File && file.size > 0) {
      if (file.size > ARTIKEL_IMG_MAX_BYTES) return { ok: false, error: 'Ukuran foto terlalu besar.' }
      try {
        fotoBaru = await putArtikelImage(file, 'ww')
      } catch (e) {
        if (e instanceof UnreadablePhotoError) return { ok: false, error: 'File ini tidak bisa dibaca sebagai foto. Coba foto lain.' }
        throw e
      }
    }
    const buang = fd.get('hapusFoto') === '1'
    const fotoAkhir = fotoBaru || (buang ? '' : lama.foto_url)
    try {
      await db.ww_laporan.update({ where: { id_laporan: id }, data: { tanggal, jumlah: input.jumlah, isi, foto_url: fotoAkhir } })
    } catch (e) {
      if (fotoBaru) await del(fotoBaru, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => {})
      throw e
    }
    if (fotoAkhir) await simpanFokus(id, fokusDari(fd))
    else await simpanFokus(id, { x: 50, y: 50 })
    // Foto lama baru dihapus setelah simpan berhasil.
    if (lama.foto_url && lama.foto_url !== fotoAkhir) await del(lama.foto_url, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => {})
    revalidatePathAir()
    return { ok: true, id }
  } catch (e) {
    console.error('perbaruiLaporanWw', e)
    return { ok: false, error: 'Gagal menyimpan. Coba lagi.' }
  }
}

export type AminResult = { ok: true; amin: number; aminSaya: boolean } | { ok: false }

/** Amin / batal Amin. Id peserta selalu dari sesi; ditulis lewat raw SQL supaya tidak membanjiri app_log. */
export async function toggleAmin(idLaporan: number): Promise<AminResult> {
  const id = await sessionPesertaId()
  const lap = Math.floor(Number(idLaporan))
  if (!id || !Number.isFinite(lap) || lap <= 0) return { ok: false }
  try {
    const ada = await db.$queryRaw<{ n: number }[]>`SELECT 1 AS n FROM ww_laporan WHERE id_laporan = ${lap} LIMIT 1`
    if (!ada.length) return { ok: false }
    const hapus = await db.$executeRaw`DELETE FROM ww_amin WHERE id_laporan = ${lap} AND id_peserta = ${id}`
    if (hapus === 0) await db.$executeRaw`INSERT IGNORE INTO ww_amin (id_laporan, id_peserta) VALUES (${lap}, ${id})`
    const [r] = await db.$queryRaw<{ n: bigint | number }[]>`SELECT COUNT(*) AS n FROM ww_amin WHERE id_laporan = ${lap}`
    if (hapus === 0) {
      const p = await db.peserta.findUnique({ where: { id_peserta: id }, select: { nama: true } })
      void pushAminWw({ idLaporan: lap, idPemberi: id, namaPemberi: p?.nama ?? 'Seseorang' })
    }
    return { ok: true, amin: Number(r?.n ?? 0), aminSaya: hapus === 0 }
  } catch (e) {
    console.error('toggleAmin', e)
    return { ok: false }
  }
}
