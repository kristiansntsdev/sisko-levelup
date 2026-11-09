'use server'
import { createHash, randomUUID } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { db } from '@/lib/db'
import { wibToday } from '@/lib/wib'
import { KOMENTAR_ISI_MAX, KOMENTAR_JEDA_DETIK, KOMENTAR_NAMA_MAX } from '@/lib/artikel'
import type { KomentarItem } from '@/lib/artikel-data'

const VISITOR_COOKIE = 'lup_vid'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Anonymous visitor id (httpOnly cookie, 1 year). Not an identity: clearing cookies gives a new one. */
async function visitorId(create: boolean): Promise<string | null> {
  const store = await cookies()
  const cur = store.get(VISITOR_COOKIE)?.value
  if (cur && UUID_RE.test(cur)) return cur
  if (!create) return null
  const id = randomUUID()
  store.set(VISITOR_COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 })
  return id
}

async function ipHash(): Promise<string> {
  const h = await headers()
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'unknown').trim()
  return createHash('sha256').update(`${ip}:${process.env.AUTH_SECRET ?? ''}`).digest('hex').slice(0, 16)
}

async function isPublished(id: number): Promise<boolean> {
  const a = await db.artikel.findUnique({ where: { id_artikel: id }, select: { status: true } })
  return a?.status === 'published'
}

/**
 * +1 view for today (WIB). Raw SQL on purpose: the audit-log extension skips raw queries, so anonymous
 * traffic does not flood app_log. The client dedupes per browser per day.
 */
export async function catatViewArtikel(id: number): Promise<void> {
  try {
    if (!Number.isInteger(id) || !(await isPublished(id))) return
    const tanggal = wibToday()
    await db.$executeRaw`
      INSERT INTO artikel_view (id_artikel, tanggal, views) VALUES (${id}, ${tanggal}, 1)
      ON DUPLICATE KEY UPDATE views = views + 1
    `
  } catch (e) {
    console.error('catatViewArtikel', e)
  }
}

export type LikeResult = { ok: true; liked: boolean; count: number } | { ok: false; error: string }

export async function toggleLikeArtikel(id: number): Promise<LikeResult> {
  try {
    if (!Number.isInteger(id) || !(await isPublished(id))) return { ok: false, error: 'Artikel tidak ditemukan.' }
    const visitor = await visitorId(true)
    if (!visitor) return { ok: false, error: 'Tidak bisa memberi like.' }
    const inserted = await db.$executeRaw`INSERT IGNORE INTO artikel_like (id_artikel, visitor) VALUES (${id}, ${visitor})`
    let liked = true
    if (inserted === 0) {
      await db.$executeRaw`DELETE FROM artikel_like WHERE id_artikel = ${id} AND visitor = ${visitor}`
      liked = false
    }
    const count = await db.artikel_like.count({ where: { id_artikel: id } })
    return { ok: true, liked, count }
  } catch (e) {
    console.error('toggleLikeArtikel', e)
    return { ok: false, error: 'Gagal memproses like. Coba lagi.' }
  }
}

export type KomentarResult = { ok: true; item: KomentarItem } | { ok: false; error: string }

export async function kirimKomentarArtikel(input: { id: number; nama: string; isi: string; website?: string }): Promise<KomentarResult> {
  try {
    // Honeypot: real people never see this field. Answer like success-less silence.
    if (input.website) return { ok: false, error: 'Komentar tidak bisa dikirim.' }
    if (!Number.isInteger(input.id) || !(await isPublished(input.id))) return { ok: false, error: 'Artikel tidak ditemukan.' }

    const nama = input.nama.replace(/\s+/g, ' ').trim()
    const isi = input.isi.trim()
    if (!nama) return { ok: false, error: 'Nama wajib diisi.' }
    if (nama.length > KOMENTAR_NAMA_MAX) return { ok: false, error: `Nama maksimal ${KOMENTAR_NAMA_MAX} karakter.` }
    if (!isi) return { ok: false, error: 'Tulis dulu komentarmu.' }
    if (isi.length > KOMENTAR_ISI_MAX) return { ok: false, error: `Komentar maksimal ${KOMENTAR_ISI_MAX} karakter.` }

    const visitor = await visitorId(true)
    if (!visitor) return { ok: false, error: 'Tidak bisa mengirim komentar.' }
    const ip = await ipHash()

    const since = new Date(Date.now() - KOMENTAR_JEDA_DETIK * 1000)
    const recent = await db.artikel_komentar.findFirst({
      where: { created_at: { gte: since }, OR: [{ visitor }, { ip_hash: ip }] },
      select: { id_komentar: true },
    })
    if (recent) return { ok: false, error: `Tunggu ${KOMENTAR_JEDA_DETIK} detik sebelum komentar lagi.` }

    const row = await db.artikel_komentar.create({
      data: { id_artikel: input.id, nama, isi, visitor, ip_hash: ip },
    })
    return { ok: true, item: { id: row.id_komentar, nama: row.nama, isi: row.isi, createdAt: row.created_at.toISOString(), hidden: false } }
  } catch (e) {
    console.error('kirimKomentarArtikel', e)
    return { ok: false, error: 'Gagal mengirim komentar. Coba lagi.' }
  }
}
