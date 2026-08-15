import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Body = {
  email?: string
  username?: string
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function checkSecret(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return false
  return header.slice(7) === secret
}

function toMember(peserta: {
  id_peserta: number
  email: string
  nama: string
  usercode: string
}) {
  return {
    email: peserta.email.toLowerCase(),
    name: peserta.nama || peserta.email,
    idPeserta: peserta.id_peserta,
    usercode: peserta.usercode || null,
  }
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return unauthorized()

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const username = body.username?.trim()

  if (!email && !username) {
    return NextResponse.json({ error: 'email or username required' }, { status: 400 })
  }

  // Prefer email lookup when provided or when username looks like an email
  const emailQuery = email || (username?.includes('@') ? username.toLowerCase() : null)

  if (emailQuery) {
    const authUser = await db.auth_users.findFirst({
      where: { email: emailQuery },
      select: {
        email: true,
        name: true,
        id_peserta: true,
        peserta: {
          select: { id_peserta: true, email: true, nama: true, usercode: true },
        },
      },
    })

    if (authUser?.peserta?.email) {
      return NextResponse.json(toMember(authUser.peserta))
    }

    const peserta = await db.peserta.findFirst({
      where: { email: emailQuery },
      select: { id_peserta: true, email: true, nama: true, usercode: true },
    })

    if (peserta?.email) {
      return NextResponse.json(toMember(peserta))
    }

    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // username = usercode (or exact email fallback without @ already handled)
  const peserta = await db.peserta.findFirst({
    where: {
      OR: [{ usercode: username! }, { email: username!.toLowerCase() }],
    },
    select: { id_peserta: true, email: true, nama: true, usercode: true },
  })

  if (!peserta?.email) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  return NextResponse.json(toMember(peserta))
}
