/** Pengumuman push manual (halaman /pengumuman): pilih penerima (gabungan), kirim, catat. Hanya server. */
import { db } from '@/lib/db'
import { Prisma } from '@/lib/generated/client'
import { berlangganan, kirimKeIdSub, kirimPush, TTL_BIASA } from './send'
import { nomorInti, nomorSama, pesanAktif } from './target'
export { MAKS_ISI, MAKS_JUDUL } from './target'

/** Penerima gabungan (union, tanpa dobel). `semua` mengabaikan yang lain dan juga mencakup perangkat pengurus. */
export type TargetPengumuman = { semua: boolean; kota: string[]; anggota: number[]; nomor: string[] }

export const MAKS_KOTA = 60
export const MAKS_ANGGOTA = 100
export const MAKS_NOMOR = 50

export type HasilPengumuman = {
  /** id pengumuman: halaman /dashboard/pengumuman/{id}. */
  id: number
  /** Penerima unik yang cocok dengan target (anggota, bukan perangkat). */
  cocok: number
  perangkat: number
  terkirim: number
  gagal: number
  /** Anggota yang dipilih langsung / lewat nomor, dan apakah sudah punya perangkat. */
  anggota: { nama: string; punyaPerangkat: boolean }[]
  /** Nomor yang tidak cocok dengan anggota mana pun. */
  nomorTakDikenal: string[]
}

const kotaKey = (k: string) => String(Number(k))

/** url kosong = tap notifikasi membuka halaman pengumuman itu sendiri. */
type Isi = { judul: string; isi: string; url: string; image?: string }

export function halamanPengumuman(id: number): string {
  return `/dashboard/pengumuman/${id}`
}

/** Disimpan di pengumuman.target_json: siapa yang boleh melihat halaman pengumuman. */
type TargetTersimpan = { semua: boolean; kota: string[]; peserta: number[]; pengurus?: number[] }

/** Pengumuman pribadi otomatis saat notifikasi diaktifkan: tidak tampil di daftar admin. */
export const TIPE_AKTIVASI = 'aktivasi'

export type AnggotaOpsi = { id: number; label: string; punyaPerangkat: boolean }

function escLike(q: string): string {
  return q.replace(/[\\%_]/g, (c) => `\\${c}`)
}

/** Pencarian anggota untuk dropdown: "Nama - Nama kota". Minimal 2 huruf, maksimal 20 hasil. */
export async function cariAnggotaOpsi(q: string): Promise<AnggotaOpsi[]> {
  const kata = q.trim()
  if (kata.length < 2) return []
  const like = `%${escLike(kata)}%`
  const rows = await db.$queryRaw<{ id_peserta: number; nama: string; namacabang: string | null }[]>`
    SELECT p.id_peserta, p.nama, c.namacabang
    FROM peserta p LEFT JOIN cabang c ON c.id_cabang = CAST(p.kotalevelup AS UNSIGNED)
    WHERE p.nama LIKE ${like}
    ORDER BY p.nama ASC LIMIT 20`
  const subs = new Set((await berlangganan()).peserta)
  return rows.map((r) => ({
    id: Number(r.id_peserta),
    label: `${r.nama} - ${r.namacabang ?? 'Tanpa kota'}`,
    punyaPerangkat: subs.has(Number(r.id_peserta)),
  }))
}

type Penerima = {
  /** Peserta yang punya perangkat (dikirimi). */
  peserta: number[]
  pengurus: number[]
  /** Semua anggota yang cocok, punya perangkat atau tidak. */
  cocok: number
  /** Anggota yang dipilih langsung atau lewat nomor (untuk hak lihat halaman). */
  langsung: number[]
  anggota: { nama: string; punyaPerangkat: boolean }[]
  nomorTakDikenal: string[]
}

async function tentukanPenerima(target: TargetPengumuman): Promise<Penerima> {
  const subs = await berlangganan()
  const subPeserta = new Set(subs.peserta)
  const penerima = new Set<number>()
  const dicocokkan = new Set<number>()
  const langsung = new Map<number, { nama: string; punyaPerangkat: boolean }>()
  const nomorTakDikenal: string[] = []

  if (target.semua) {
    return {
      peserta: subs.peserta,
      pengurus: subs.pengurus,
      cocok: subs.peserta.length + subs.pengurus.length,
      langsung: [],
      anggota: [],
      nomorTakDikenal,
    }
  }
  if (target.kota.length && subs.peserta.length) {
    const set = new Set(target.kota.map(kotaKey))
    const rows = await db.peserta.findMany({ where: { id_peserta: { in: subs.peserta } }, select: { id_peserta: true, kotalevelup: true } })
    for (const r of rows) {
      if (!set.has(kotaKey(r.kotalevelup))) continue
      penerima.add(r.id_peserta)
      dicocokkan.add(r.id_peserta)
    }
  }
  if (target.anggota.length) {
    const rows = await db.peserta.findMany({ where: { id_peserta: { in: target.anggota } }, select: { id_peserta: true, nama: true } })
    for (const r of rows) {
      const ada = subPeserta.has(r.id_peserta)
      langsung.set(r.id_peserta, { nama: r.nama, punyaPerangkat: ada })
      dicocokkan.add(r.id_peserta)
      if (ada) penerima.add(r.id_peserta)
    }
  }
  for (const nomor of target.nomor) {
    const inti = nomorInti(nomor)
    if (!inti) {
      nomorTakDikenal.push(nomor)
      continue
    }
    // nowa teks bebas (spasi, strip, titik, +): samakan dulu di SQL, lalu cocokkan penuh di JS.
    const ujung = `%${inti.slice(-7)}%`
    const rows = await db.$queryRaw<{ id_peserta: number; nama: string; nowa: string }[]>`
      SELECT id_peserta, nama, nowa FROM peserta
      WHERE REPLACE(REPLACE(REPLACE(REPLACE(nowa, ' ', ''), '-', ''), '+', ''), '.', '') LIKE ${ujung}`
    const hit = rows.filter((r) => nomorSama(r.nowa, nomor))
    if (!hit.length) nomorTakDikenal.push(nomor)
    for (const r of hit) {
      const id = Number(r.id_peserta)
      const ada = subPeserta.has(id)
      langsung.set(id, { nama: r.nama, punyaPerangkat: ada })
      dicocokkan.add(id)
      if (ada) penerima.add(id)
    }
  }
  return {
    peserta: [...penerima],
    pengurus: [],
    cocok: dicocokkan.size,
    langsung: [...langsung.keys()],
    anggota: [...langsung.values()],
    nomorTakDikenal,
  }
}

/**
 * Simpan dulu (supaya punya id untuk halaman pengumuman), kirim push, lalu catat hasilnya.
 * Tap notifikasi membuka `url` kalau diisi, kalau tidak halaman pengumuman itu sendiri.
 */
export async function kirimPengumumanPush(isi: Isi, target: TargetPengumuman): Promise<HasilPengumuman> {
  const p = await tentukanPenerima(target)
  const { tipe, nilai } = ringkasTarget(target)
  const tersimpan: TargetTersimpan = { semua: target.semua, kota: target.kota.map(kotaKey), peserta: p.langsung }
  const id = await db.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO pengumuman (judul, isi, image_url, url, target_tipe, target_nilai, target_json, cocok)
      VALUES (${isi.judul}, ${isi.isi}, ${isi.image ?? ''}, ${isi.url}, ${tipe}, ${nilai}, ${JSON.stringify(tersimpan)}, ${p.cocok})`
    const r = await tx.$queryRaw<{ id: bigint | number }[]>`SELECT LAST_INSERT_ID() AS id`
    return Number(r[0]?.id)
  })

  const hasil = await kirimPush(
    { peserta: p.peserta, pengurus: p.pengurus },
    { title: isi.judul, body: isi.isi, url: isi.url || halamanPengumuman(id), image: isi.image, tag: `pengumuman-${id}`, renotify: true },
    { ttl: TTL_BIASA, urgency: 'high' },
  )
  await db.$executeRaw`
    UPDATE pengumuman SET perangkat = ${hasil.terkirim + hasil.gagal}, terkirim = ${hasil.terkirim}, gagal = ${hasil.gagal}
    WHERE id_pengumuman = ${id}`.catch((e: unknown) => console.error('[pengumuman] catat hasil gagal', e))

  return {
    id,
    cocok: p.cocok,
    perangkat: hasil.terkirim + hasil.gagal,
    terkirim: hasil.terkirim,
    gagal: hasil.gagal,
    anggota: p.anggota,
    nomorTakDikenal: p.nomorTakDikenal,
  }
}

function ringkasTarget(t: TargetPengumuman): { tipe: string; nilai: string } {
  if (t.semua) return { tipe: 'semua', nilai: '' }
  const bagian = [
    t.kota.length ? `${t.kota.length} kota` : '',
    t.anggota.length ? `${t.anggota.length} anggota` : '',
    t.nomor.length ? `${t.nomor.length} nomor` : '',
  ].filter(Boolean)
  return { tipe: 'pilihan', nilai: bagian.join(', ') }
}

/**
 * Notifikasi percobaan saat pengguna menekan Aktifkan, disimpan sebagai pengumuman pribadi: muncul di lonceng +
 * daftar pengumuman orang itu, dan tap notifikasinya membuka halamannya. Dikirim ke HP itu saja (idSub).
 * Anggota → target peserta; HP yang hanya membawa sesi pengurus → target pengurus.
 */
export async function kirimPengumumanAktivasi(a: { idSub: number; idPeserta: number | null; idPengurus: number | null; nama: string }): Promise<boolean> {
  const pesan = pesanAktif(a.nama)
  const tersimpan: TargetTersimpan = a.idPeserta
    ? { semua: false, kota: [], peserta: [a.idPeserta] }
    : { semua: false, kota: [], peserta: [], pengurus: a.idPengurus ? [a.idPengurus] : [] }
  const id = await db.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO pengumuman (judul, isi, image_url, url, target_tipe, target_nilai, target_json, cocok)
      VALUES (${pesan.title}, ${pesan.body}, '', '', ${TIPE_AKTIVASI}, '', ${JSON.stringify(tersimpan)}, 1)`
    const r = await tx.$queryRaw<{ id: bigint | number }[]>`SELECT LAST_INSERT_ID() AS id`
    return Number(r[0]?.id)
  })
  const hasil = await kirimKeIdSub(a.idSub, { ...pesan, url: halamanPengumuman(id), tag: 'notifikasi-aktif', renotify: true })
  await db.$executeRaw`
    UPDATE pengumuman SET perangkat = ${hasil.terkirim + hasil.gagal}, terkirim = ${hasil.terkirim}, gagal = ${hasil.gagal}
    WHERE id_pengumuman = ${id}`.catch((e: unknown) => console.error('[pengumuman] catat aktivasi gagal', e))
  return hasil.terkirim > 0
}

export type ItemPengumuman = {
  id: number
  judul: string
  isi: string
  gambar: string | null
  url: string
  semua: boolean
  target: string
  cocok: number
  perangkat: number
  terkirim: number
  gagal: number
  /** Epoch ms (waktu sebenarnya); ditampilkan di zona perangkat oleh <Waktu>. */
  waktuMs: number
}

export const PER_HALAMAN = 20

/**
 * created_at diisi DEFAULT CURRENT_TIMESTAMP = jam dinding zona server MySQL (WIB), tapi driver membacanya sebagai
 * UTC (meleset 7 jam). UNIX_TIMESTAMP() menafsirkan nilai itu dengan zona server, jadi hasilnya epoch yang benar.
 */
const epochMs = (ts: bigint | number | string | null) => Number(ts ?? 0) * 1000

/** Daftar pengumuman terbaru dulu. `siap: false` = tabel belum ada (sebelum prod-migrate). */
export async function daftarPengumuman(halaman: number): Promise<{ siap: boolean; items: ItemPengumuman[]; total: number }> {
  const page = Math.max(1, Math.floor(halaman) || 1)
  try {
    const offset = (page - 1) * PER_HALAMAN
    const [rows, count] = await Promise.all([
      db.$queryRaw<
        {
          id_pengumuman: number; judul: string; isi: string; image_url: string; url: string; target_tipe: string; target_nilai: string
          cocok: number; perangkat: number; terkirim: number; gagal: number; ts: bigint | number
        }[]
      >`SELECT id_pengumuman, judul, isi, image_url, url, target_tipe, target_nilai, cocok, perangkat, terkirim, gagal,
               UNIX_TIMESTAMP(created_at) AS ts
        FROM pengumuman WHERE target_tipe <> ${TIPE_AKTIVASI}
        ORDER BY id_pengumuman DESC LIMIT ${PER_HALAMAN} OFFSET ${offset}`,
      db.$queryRaw<{ n: bigint | number }[]>`SELECT COUNT(*) AS n FROM pengumuman WHERE target_tipe <> ${TIPE_AKTIVASI}`,
    ])
    return {
      siap: true,
      total: Number(count[0]?.n ?? 0),
      items: rows.map((r) => ({
        id: Number(r.id_pengumuman),
        judul: r.judul,
        isi: r.isi,
        gambar: r.image_url || null,
        url: r.url,
        semua: r.target_tipe === 'semua',
        target: r.target_tipe === 'semua' ? 'Semua anggota' : r.target_nilai || 'Pilihan',
        cocok: Number(r.cocok),
        perangkat: Number(r.perangkat),
        terkirim: Number(r.terkirim),
        gagal: Number(r.gagal),
        waktuMs: epochMs(r.ts),
      })),
    }
  } catch (err) {
    console.error('[pengumuman] daftar gagal', err)
    return { siap: false, items: [], total: 0 }
  }
}

/** Anggota yang sudah dipilih lewat URL (?anggota=1,2): label "Nama - Nama kota" untuk chip. */
export async function anggotaOpsiByIds(ids: number[]): Promise<AnggotaOpsi[]> {
  const valid = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))].slice(0, MAKS_ANGGOTA)
  if (!valid.length) return []
  const [rows, subs] = await Promise.all([
    db.$queryRaw<{ id_peserta: number; nama: string; namacabang: string | null }[]>`
      SELECT p.id_peserta, p.nama, c.namacabang
      FROM peserta p LEFT JOIN cabang c ON c.id_cabang = CAST(p.kotalevelup AS UNSIGNED)
      WHERE p.id_peserta IN (${Prisma.join(valid)})`,
    berlangganan(),
  ])
  const set = new Set(subs.peserta)
  return rows.map((r) => ({ id: Number(r.id_peserta), label: `${r.nama} - ${r.namacabang ?? 'Tanpa kota'}`, punyaPerangkat: set.has(Number(r.id_peserta)) }))
}

// ───────────────────────── halaman anggota ─────────────────────────

/** Siapa yang membuka halaman: anggota (id + kota), pengurus, atau admin /pengumuman (boleh lihat semua). */
export type PembacaPengumuman = {
  idPeserta: number | null
  kota: string | null
  pengurus: boolean
  idPengurus: number | null
  admin: boolean
  /** Kunci status dibaca di HP: p{id peserta}, g{id pengurus}, atau admin. */
  kunci: string
}

export type PengumumanAnggota = {
  id: number
  judul: string
  isi: string
  gambar: string | null
  /** Tautan lanjutan yang diisi pengirim; null = tidak ada. */
  url: string | null
  /** Epoch ms; ditampilkan di zona perangkat oleh <Waktu>. */
  waktuMs: number
  /** Dikirim kurang dari 3 hari lalu. */
  baru: boolean
}

type RowAnggota = { id_pengumuman: number; judul: string; isi: string; image_url: string; url: string; target_tipe: string; target_json: string | null; ts: bigint | number }

function bolehLihat(r: RowAnggota, v: PembacaPengumuman): boolean {
  if (v.admin) return true
  let t: TargetTersimpan | null = null
  try {
    t = r.target_json ? (JSON.parse(r.target_json) as TargetTersimpan) : null
  } catch {
    t = null
  }
  if (r.target_tipe === 'semua' || t?.semua) return v.idPeserta != null || v.pengurus
  if (!t) return false
  if (v.idPeserta != null && (t.peserta.includes(v.idPeserta) || (v.kota != null && t.kota.includes(kotaKey(v.kota))))) return true
  return v.idPengurus != null && (t.pengurus ?? []).includes(v.idPengurus)
}

function keAnggota(r: RowAnggota): PengumumanAnggota {
  const ms = epochMs(r.ts)
  return {
    id: Number(r.id_pengumuman),
    judul: r.judul,
    isi: r.isi,
    gambar: r.image_url || null,
    url: r.url || null,
    waktuMs: ms,
    baru: Date.now() - ms < 3 * 24 * 60 * 60 * 1000,
  }
}

/** Pengumuman yang ditujukan ke pembaca ini, terbaru dulu. Gagal baca (mis. sebelum migrasi) = kosong. */
export async function pengumumanUntuk(v: PembacaPengumuman, limit = 30): Promise<PengumumanAnggota[]> {
  try {
    const rows = await db.$queryRaw<RowAnggota[]>`
      SELECT id_pengumuman, judul, isi, image_url, url, target_tipe, target_json, UNIX_TIMESTAMP(created_at) AS ts
      FROM pengumuman ORDER BY id_pengumuman DESC LIMIT 300`
    return rows.filter((r) => bolehLihat(r, v)).slice(0, limit).map(keAnggota)
  } catch (err) {
    console.error('[pengumuman] daftar anggota gagal', err)
    return []
  }
}

/** Satu pengumuman; null kalau tidak ada atau bukan untuk pembaca ini. */
export async function pengumumanDetail(id: number, v: PembacaPengumuman): Promise<PengumumanAnggota | null> {
  if (!Number.isInteger(id) || id <= 0) return null
  try {
    const rows = await db.$queryRaw<RowAnggota[]>`
      SELECT id_pengumuman, judul, isi, image_url, url, target_tipe, target_json, UNIX_TIMESTAMP(created_at) AS ts
      FROM pengumuman WHERE id_pengumuman = ${id} LIMIT 1`
    const r = rows[0]
    return r && bolehLihat(r, v) ? keAnggota(r) : null
  } catch (err) {
    console.error('[pengumuman] detail gagal', err)
    return null
  }
}
