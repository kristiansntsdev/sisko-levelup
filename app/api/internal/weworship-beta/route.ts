import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { BETA_WEWORSHIP } from '@/lib/beta'

// Dipanggil fe-admin-weworship sebelum membuat sesi /prototype (Google, login email, daftar): selama beta hanya
// anggota yang ada di beta_akses (fitur 'weworship') yang boleh masuk. Email dicocokkan ke peserta.email dan
// email Google di auth_users. Jawaban hanya { allowed }, tidak pernah data anggota.
// Secret sendiri (bukan INTERNAL_API_SECRET, yang juga membuka prod-migrate).
function checkSecret(req: NextRequest): boolean {
  const secret = process.env.WEWORSHIP_BETA_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return false
  return header.slice(7) === secret
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { email?: unknown } | null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || email.length > 255) return NextResponse.json({ error: 'email wajib' }, { status: 400 })

  const beta = await db.beta_akses.findMany({ where: { fitur: BETA_WEWORSHIP }, select: { id_peserta: true } })
  if (beta.length === 0) return NextResponse.json({ allowed: false })

  const hit = await db.peserta.findFirst({
    where: {
      id_peserta: { in: beta.map((b) => b.id_peserta) },
      OR: [{ email }, { auth_users: { some: { email } } }],
    },
    select: { id_peserta: true },
  })
  return NextResponse.json({ allowed: Boolean(hit) })
}
