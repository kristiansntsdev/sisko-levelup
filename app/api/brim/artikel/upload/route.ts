import { NextRequest, NextResponse } from 'next/server'
import { brimNasionalActor } from '@/lib/brim-auth'
import { ARTIKEL_IMG_MAX_BYTES, putArtikelImage } from '@/lib/artikel-blob'

export const maxDuration = 60

/** Image upload for the Jodit editor: it needs a URL back, so this cannot be a server action. */
export async function POST(req: NextRequest) {
  const actor = await brimNasionalActor()
  if (!actor) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'Pilih gambar dulu.' }, { status: 400 })
  }
  if (file.size > ARTIKEL_IMG_MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'Gambar maksimal 4 MB.' }, { status: 413 })
  }
  try {
    const url = await putArtikelImage(file, 'img')
    return NextResponse.json({ ok: true, url })
  } catch (e) {
    if (e instanceof Error && e.message.includes('BLOB_READ_WRITE_TOKEN')) throw e
    return NextResponse.json({ ok: false, error: 'File ini tidak bisa dibaca sebagai gambar.' }, { status: 400 })
  }
}
