'use server'
import { del } from '@vercel/blob'
import { revalidatePath } from 'next/cache'
import { ARTIKEL_IMG_MAX_BYTES, putArtikelImage } from '@/lib/artikel-blob'
import { db } from '@/lib/db'
import { UnreadablePhotoError } from '@/lib/profile-photo'
import { anggotaAir, dataBeranda, hariIni } from '@/lib/air-hidup-data'
import { laporanDari, PIC_USERLEVEL, validateLaporan, type AirBeranda } from '@/lib/air-hidup'
import { sessionPesertaId } from '@/lib/peserta-session'

/** Untuk Beranda: gagal baca (mis. tabel belum ada di jeda deploy → prod-migrate) = null, Beranda tetap jalan. */
export async function getAirBeranda(): Promise<AirBeranda | null> {
  try {
    return await dataBeranda()
  } catch (e) {
    console.error('getAirBeranda', e)
    return null
  }
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
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/pic')
    revalidatePath('/dashboard/air-hidup')
    return { ok: true, id: row.id_laporan }
  } catch (e) {
    console.error('kirimLaporanWw', e)
    return { ok: false, error: 'Gagal mengirim. Coba lagi.' }
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
    return { ok: true, amin: Number(r?.n ?? 0), aminSaya: hapus === 0 }
  } catch (e) {
    console.error('toggleAmin', e)
    return { ok: false }
  }
}
