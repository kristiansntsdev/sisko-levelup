import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Body = {
  email?: string
  username?: string
  /** When set, must match pengurus.password (plaintext, same as /admin login) */
  password?: string
}

type MemberPayload = {
  email: string
  name: string
  idPeserta: number
  usercode: string | null
}

type AlkPengurus = {
  id_pengurus: number
  nama: string
  username: string
  password: string
  email: string
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

function notAlk() {
  return NextResponse.json({ error: 'Akses hanya untuk pengurus ALK' }, { status: 403 })
}

function toMember(pengurus: {
  id_pengurus: number
  nama: string
  username: string
  email: string
}): MemberPayload {
  return {
    email: pengurus.email.toLowerCase(),
    name: pengurus.nama,
    // ponytail: negative id — no peserta table lookup; never collides with peserta autoincrement
    idPeserta: -pengurus.id_pengurus,
    usercode: pengurus.username,
  }
}

async function findPengurusByUsername(username: string): Promise<AlkPengurus | null> {
  const pengurus = await db.pengurus.findFirst({
    where: { username, divisi: 'alk' },
    select: {
      id_pengurus: true,
      nama: true,
      username: true,
      password: true,
      auth_users: {
        take: 1,
        select: { email: true, name: true },
        orderBy: { created_at: 'desc' },
      },
    },
  })
  if (!pengurus) return null

  // ALK usernames are often the email itself (e.g. adminlkngawi@gmail.com)
  const email =
    pengurus.auth_users[0]?.email?.toLowerCase() ||
    (pengurus.username.includes('@')
      ? pengurus.username.toLowerCase()
      : `${pengurus.username}@alk.sisko.internal`)

  return {
    id_pengurus: pengurus.id_pengurus,
    nama: pengurus.auth_users[0]?.name || pengurus.nama,
    username: pengurus.username,
    password: pengurus.password,
    email,
  }
}

/** Resolve ALK pengurus only — never plain peserta. */
async function findAlkPengurus(emailQuery: string | null, username: string | null) {
  // 1) pengurus.username — includes email-as-username (common for ALK admins)
  const loginId = username || emailQuery
  if (loginId) {
    const byUsername = await findPengurusByUsername(loginId)
    if (byUsername) return byUsername
  }

  if (!emailQuery) return null

  // 2) auth_users.email → linked pengurus ALK
  const authUser = await db.auth_users.findFirst({
    where: { email: emailQuery },
    select: {
      email: true,
      name: true,
      pengurus: {
        select: {
          id_pengurus: true,
          nama: true,
          username: true,
          password: true,
          divisi: true,
        },
      },
    },
  })

  if (!authUser?.pengurus || authUser.pengurus.divisi !== 'alk' || !authUser.email) {
    return null
  }

  return {
    id_pengurus: authUser.pengurus.id_pengurus,
    nama: authUser.name || authUser.pengurus.nama,
    username: authUser.pengurus.username,
    password: authUser.pengurus.password,
    email: authUser.email,
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
  const username = body.username?.trim() || null
  const password = body.password

  if (!email && !username) {
    return NextResponse.json({ error: 'email or username required' }, { status: 400 })
  }

  const emailQuery = email || (username?.includes('@') ? username.toLowerCase() : null)
  const pengurus = await findAlkPengurus(emailQuery, username)

  if (!pengurus) return notAlk()

  // Credential login: password must match pengurus row (same as /admin)
  if (password !== undefined) {
    if (!password || password !== pengurus.password) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }
  }

  return NextResponse.json(
    toMember({
      id_pengurus: pengurus.id_pengurus,
      nama: pengurus.nama,
      username: pengurus.username,
      email: pengurus.email,
    }),
  )
}
