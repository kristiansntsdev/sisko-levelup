'use server'
import { del } from '@vercel/blob'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { brimNasionalActor } from '@/lib/brim-auth'
import {
  ARTIKEL_JUDUL_MAX,
  ARTIKEL_RINGKASAN_MAX,
  excerpt,
  slugify,
  stripHtml,
} from '@/lib/artikel'
import { artikelImageUrls, sanitizeArtikelHtml } from '@/lib/artikel-html'
import { ARTIKEL_IMG_MAX_BYTES, isArtikelBlob, putArtikelImage } from '@/lib/artikel-blob'
import { BRIM_ARTIKEL_BASE } from '@/components/brim-v2/paths'

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

const NOT_ALLOWED = { ok: false as const, error: 'Hanya Brim Nasional yang bisa mengelola artikel' }

function refresh(slug?: string) {
  revalidatePath('/')
  revalidatePath('/artikel')
  if (slug) revalidatePath(`/artikel/${slug}`)
  revalidatePath(BRIM_ARTIKEL_BASE, 'layout')
}

async function uniqueSlug(base: string, exceptId?: number): Promise<string> {
  let slug = base
  for (let i = 2; i < 100; i++) {
    const hit = await db.artikel.findUnique({ where: { slug }, select: { id_artikel: true } })
    if (!hit || hit.id_artikel === exceptId) return slug
    slug = `${base}-${i}`
  }
  return `${base}-${Date.now()}`
}

async function deleteBlobs(urls: string[]) {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return
  const ours = [...new Set(urls.filter(isArtikelBlob))]
  if (ours.length === 0) return
  await del(ours, { token }).catch((e) => console.error('[artikel] blob not deleted', e))
}

export type SaveArtikelInput = {
  id?: number
  judul: string
  ringkasan: string
  coverUrl: string
  isi: string
  publish: boolean
}

/** Create or update. `publish` true = published (first time sets published_at), false = keep as draft / revert to draft. */
export async function saveArtikel(input: SaveArtikelInput): Promise<Result<{ id: number; slug: string }>> {
  const actor = await brimNasionalActor()
  if (!actor) return NOT_ALLOWED

  const judul = input.judul.trim()
  if (!judul) return { ok: false, error: 'Judul wajib diisi.' }
  if (judul.length > ARTIKEL_JUDUL_MAX) return { ok: false, error: `Judul maksimal ${ARTIKEL_JUDUL_MAX} karakter.` }

  const isi = sanitizeArtikelHtml(input.isi)
  if (!stripHtml(isi) && !/<(img|iframe)/i.test(isi)) return { ok: false, error: 'Isi artikel masih kosong.' }

  const ringkasan = (input.ringkasan.trim() || excerpt(isi)).slice(0, ARTIKEL_RINGKASAN_MAX)
  const coverUrl = input.coverUrl.trim()
  if (coverUrl && !/^https:\/\//.test(coverUrl)) return { ok: false, error: 'Cover harus berupa URL https.' }

  const status = input.publish ? 'published' : 'draft'

  if (input.id == null) {
    const slug = await uniqueSlug(slugify(judul))
    const row = await db.artikel.create({
      data: {
        slug, judul, ringkasan, cover_url: coverUrl, isi, status,
        published_at: input.publish ? new Date() : null,
        id_pengurus: actor.id_pengurus,
      },
    })
    refresh(slug)
    return { ok: true, id: row.id_artikel, slug }
  }

  const existing = await db.artikel.findUnique({ where: { id_artikel: input.id } })
  if (!existing) return { ok: false, error: 'Artikel tidak ditemukan.' }

  // Slug follows the title only until first publish: published links (shares, Google) must not break.
  const slug = existing.published_at ? existing.slug : await uniqueSlug(slugify(judul), existing.id_artikel)
  await db.artikel.update({
    where: { id_artikel: existing.id_artikel },
    data: {
      slug, judul, ringkasan, cover_url: coverUrl, isi, status,
      published_at: input.publish ? existing.published_at ?? new Date() : existing.published_at,
    },
  })
  if (existing.cover_url && existing.cover_url !== coverUrl) await deleteBlobs([existing.cover_url])
  refresh(slug)
  if (slug !== existing.slug) revalidatePath(`/artikel/${existing.slug}`)
  return { ok: true, id: existing.id_artikel, slug }
}

export async function setArtikelStatus(id: number, publish: boolean): Promise<Result> {
  const actor = await brimNasionalActor()
  if (!actor) return NOT_ALLOWED
  const existing = await db.artikel.findUnique({ where: { id_artikel: id } })
  if (!existing) return { ok: false, error: 'Artikel tidak ditemukan.' }
  await db.artikel.update({
    where: { id_artikel: id },
    data: { status: publish ? 'published' : 'draft', published_at: publish ? existing.published_at ?? new Date() : existing.published_at },
  })
  refresh(existing.slug)
  return { ok: true }
}

export async function deleteArtikel(id: number): Promise<Result> {
  const actor = await brimNasionalActor()
  if (!actor) return NOT_ALLOWED
  const existing = await db.artikel.findUnique({ where: { id_artikel: id } })
  if (!existing) return { ok: false, error: 'Artikel tidak ditemukan.' }
  await db.$transaction([
    db.artikel_komentar.deleteMany({ where: { id_artikel: id } }),
    db.artikel_view.deleteMany({ where: { id_artikel: id } }),
    db.artikel_like.deleteMany({ where: { id_artikel: id } }),
    db.artikel.delete({ where: { id_artikel: id } }),
  ])
  await deleteBlobs([existing.cover_url, ...artikelImageUrls(existing.isi)])
  refresh(existing.slug)
  return { ok: true }
}

/** Cover upload (the browser shrinks the photo first, see lib/shrink-photo.ts). */
export async function uploadArtikelCover(formData: FormData): Promise<Result<{ url: string }>> {
  const actor = await brimNasionalActor()
  if (!actor) return NOT_ALLOWED
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Pilih gambar dulu.' }
  if (file.size > ARTIKEL_IMG_MAX_BYTES) return { ok: false, error: 'Gambar maksimal 4 MB.' }
  try {
    return { ok: true, url: await putArtikelImage(file, 'cover') }
  } catch (e) {
    if (e instanceof Error && e.message.includes('BLOB_READ_WRITE_TOKEN')) throw e
    return { ok: false, error: 'File ini tidak bisa dibaca sebagai gambar.' }
  }
}

export async function setKomentarHidden(idKomentar: number, hidden: boolean): Promise<Result> {
  const actor = await brimNasionalActor()
  if (!actor) return NOT_ALLOWED
  const row = await db.artikel_komentar.findUnique({ where: { id_komentar: idKomentar }, select: { id_artikel: true } })
  if (!row) return { ok: false, error: 'Komentar tidak ditemukan.' }
  await db.artikel_komentar.update({ where: { id_komentar: idKomentar }, data: { hidden: hidden ? 1 : 0 } })
  const a = await db.artikel.findUnique({ where: { id_artikel: row.id_artikel }, select: { slug: true } })
  refresh(a?.slug)
  return { ok: true }
}

export async function deleteKomentar(idKomentar: number): Promise<Result> {
  const actor = await brimNasionalActor()
  if (!actor) return NOT_ALLOWED
  const row = await db.artikel_komentar.findUnique({ where: { id_komentar: idKomentar }, select: { id_artikel: true } })
  if (!row) return { ok: false, error: 'Komentar tidak ditemukan.' }
  await db.artikel_komentar.delete({ where: { id_komentar: idKomentar } })
  const a = await db.artikel.findUnique({ where: { id_artikel: row.id_artikel }, select: { slug: true } })
  refresh(a?.slug)
  return { ok: true }
}
