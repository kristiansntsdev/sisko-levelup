import { put } from '@vercel/blob'
import { convertProfilePhoto } from '@/lib/profile-photo'

export const ARTIKEL_IMG_MAX_BYTES = 4 * 1024 * 1024
const ARTIKEL_IMG_EDGE = 1600

export type ArtikelBlobKind = 'cover' | 'img'

/** Re-encodes to WebP (EXIF stripped) and stores under artikel/{kind}/. Throws UnreadablePhotoError for non-photos. */
export async function putArtikelImage(file: File, kind: ArtikelBlobKind): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN belum di-set.')
  const webp = await convertProfilePhoto(Buffer.from(await file.arrayBuffer()), ARTIKEL_IMG_EDGE)
  const { url } = await put(`artikel/${kind}/img.webp`, webp, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'image/webp',
    cacheControlMaxAge: 31536000,
    token,
  })
  return url
}

export function isArtikelBlob(url: string): boolean {
  try {
    const u = new URL(url)
    return u.hostname.endsWith('.blob.vercel-storage.com') && u.pathname.startsWith('/artikel/')
  } catch {
    return false
  }
}
