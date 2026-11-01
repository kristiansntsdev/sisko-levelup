'use server'
import { del, put } from '@vercel/blob'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { convertProfilePhoto, MAX_UPLOAD_BYTES } from '@/lib/profile-photo'
import { setActor } from '@/lib/request-context'

const BLOB_PREFIX = 'peserta/foto/'

function isOurBlob(url: string) {
  try {
    const u = new URL(url)
    return u.hostname.endsWith('.blob.vercel-storage.com') && u.pathname.startsWith(`/${BLOB_PREFIX}`)
  } catch {
    return false // legacy rows hold a bare filename
  }
}

export type UpdateFotoResult = { ok: true; url: string } | { ok: false; error: string }

/** Always acts on the logged-in member; never takes a member id from the client. */
export async function updateFotoPeserta(formData: FormData): Promise<UpdateFotoResult> {
  const session = await auth()
  const idPeserta = session?.user?.idPeserta
  if (!idPeserta) return { ok: false, error: 'Silakan login ulang.' }
  setActor({ type: 'peserta', id: idPeserta, label: session?.user?.name ?? null })

  const file = formData.get('foto')
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Pilih foto dulu.' }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'Ukuran foto terlalu besar.' }

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN belum di-set.')

  let webp: Buffer
  try {
    webp = await convertProfilePhoto(Buffer.from(await file.arrayBuffer()))
  } catch {
    return { ok: false, error: 'File ini tidak bisa dibaca sebagai foto. Coba foto lain.' }
  }

  const current = await db.peserta.findUnique({ where: { id_peserta: idPeserta }, select: { foto: true } })
  if (!current) return { ok: false, error: 'Data anggota tidak ditemukan.' }

  // Random suffix makes the URL unguessable and safe to cache forever; a new photo always gets a new URL.
  const { url } = await put(`${BLOB_PREFIX}${idPeserta}.webp`, webp, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'image/webp',
    cacheControlMaxAge: 31536000,
    token,
  })

  try {
    await db.peserta.update({ where: { id_peserta: idPeserta }, data: { foto: url } })
  } catch (err) {
    await del(url, { token }).catch(() => {})
    throw err
  }

  // Keeps storage from growing. The new photo is already saved, so a failed cleanup must not fail the request.
  if (isOurBlob(current.foto)) {
    await del(current.foto, { token }).catch((err) => console.error('[updateFotoPeserta] old photo not deleted', err))
  }
  return { ok: true, url }
}
