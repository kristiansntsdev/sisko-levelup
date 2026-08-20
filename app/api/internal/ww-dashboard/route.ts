import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Body = {
  email?: string
  username?: string
  /** Negative WP idPeserta is -id_pengurus; positive = id_pengurus */
  idPengurus?: number
}

export type WwAttendancePoint = {
  id_event: number
  label: string
  nama_event: string
  tglevent: string
  hadir: number
}

export type WwDashboardPayload = {
  jumlahPertemuanBulanan: number
  idCabang: string
  namaCabang: string
  kehadiranPengurus: WwAttendancePoint[]
  kehadiranPeserta: WwAttendancePoint[]
}

type AbsenRow = {
  id_event: number
  nama_event: string
  tglevent: Date
  hadir_pengurus: bigint | number
  hadir_peserta: bigint | number
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

function fmtLabel(d: Date): string {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

async function resolveAlkCabang(body: Body): Promise<{ idCabang: string; namaCabang: string } | null> {
  if (body.idPengurus != null && Number.isFinite(body.idPengurus)) {
    const id = Math.abs(Math.trunc(body.idPengurus))
    const pengurus = await db.pengurus.findFirst({
      where: { id_pengurus: id, divisi: 'alk' },
      select: { kotalevelup: true },
    })
    if (pengurus) {
      const cabang = await db.cabang.findUnique({
        where: { id_cabang: Number(pengurus.kotalevelup) },
        select: { namacabang: true },
      })
      return {
        idCabang: pengurus.kotalevelup,
        namaCabang: cabang?.namacabang ?? pengurus.kotalevelup,
      }
    }
  }

  const username = body.username?.trim() || null
  const email = body.email?.trim().toLowerCase() || null

  if (username && !username.includes('@')) {
    const pengurus = await db.pengurus.findFirst({
      where: { username, divisi: 'alk' },
      select: { kotalevelup: true },
    })
    if (pengurus) {
      const cabang = await db.cabang.findUnique({
        where: { id_cabang: Number(pengurus.kotalevelup) },
        select: { namacabang: true },
      })
      return {
        idCabang: pengurus.kotalevelup,
        namaCabang: cabang?.namacabang ?? pengurus.kotalevelup,
      }
    }
  }

  const emailQuery = email || (username?.includes('@') ? username.toLowerCase() : null)
  if (!emailQuery) return null

  const authUser = await db.auth_users.findFirst({
    where: { email: emailQuery },
    select: {
      pengurus: { select: { kotalevelup: true, divisi: true } },
    },
  })
  if (authUser?.pengurus?.divisi === 'alk') {
    const kotalevelup = authUser.pengurus.kotalevelup
    const cabang = await db.cabang.findUnique({
      where: { id_cabang: Number(kotalevelup) },
      select: { namacabang: true },
    })
    return { idCabang: kotalevelup, namaCabang: cabang?.namacabang ?? kotalevelup }
  }

  // Synthetic verify-member emails: {username}@alk.sisko.internal
  const m = emailQuery.match(/^(.+)@alk\.sisko\.internal$/)
  if (m?.[1]) {
    const pengurus = await db.pengurus.findFirst({
      where: { username: m[1], divisi: 'alk' },
      select: { kotalevelup: true },
    })
    if (pengurus) {
      const cabang = await db.cabang.findUnique({
        where: { id_cabang: Number(pengurus.kotalevelup) },
        select: { namacabang: true },
      })
      return {
        idCabang: pengurus.kotalevelup,
        namaCabang: cabang?.namacabang ?? pengurus.kotalevelup,
      }
    }
  }

  // pengurus.username often stored as email
  const byUsernameEmail = await db.pengurus.findFirst({
    where: { username: emailQuery, divisi: 'alk' },
    select: { kotalevelup: true },
  })
  if (byUsernameEmail) {
    const cabang = await db.cabang.findUnique({
      where: { id_cabang: Number(byUsernameEmail.kotalevelup) },
      select: { namacabang: true },
    })
    return {
      idCabang: byUsernameEmail.kotalevelup,
      namaCabang: cabang?.namacabang ?? byUsernameEmail.kotalevelup,
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return unauthorized()

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const cabang = await resolveAlkCabang(body)
  if (!cabang) return notAlk()

  const { idCabang, namaCabang } = cabang

  const [jumlahPertemuanBulanan, absenRows] = await Promise.all([
    db.event.count({ where: { id_cabang: idCabang, wwtype: 'bulanan' } }),
    // ponytail: pengurus = Squad(2)+Core(3); peserta = Umum/guest(0)+Volunteer(1). Bukan tabel pengurus.
    db.$queryRaw<AbsenRow[]>`
      SELECT
        t.id_event,
        t.nama_event,
        t.tglevent,
        t.hadir_pengurus,
        t.hadir_peserta
      FROM (
        SELECT
          e.id_event,
          e.nama_event,
          e.tglevent,
          SUM(CASE WHEN p.userlevel IN ('2', '3') THEN 1 ELSE 0 END) AS hadir_pengurus,
          SUM(CASE WHEN p.userlevel IN ('0', '1') OR p.userlevel IS NULL OR p.userlevel = '' THEN 1 ELSE 0 END) AS hadir_peserta
        FROM event e
        LEFT JOIN absen a
          ON a.id_event_int = e.id_event
          OR a.id_event = CAST(e.id_event AS CHAR)
        LEFT JOIN peserta p
          ON p.id_peserta = COALESCE(a.id_peserta_int, CAST(NULLIF(a.id_peserta, '') AS UNSIGNED))
        WHERE e.id_cabang = ${idCabang}
          AND e.wwtype = 'bulanan'
        GROUP BY e.id_event, e.nama_event, e.tglevent
        ORDER BY e.tglevent DESC, e.id_event DESC
        LIMIT 24
      ) t
      ORDER BY t.tglevent ASC, t.id_event ASC
    `,
  ])

  const toPoint = (
    row: AbsenRow,
    key: 'hadir_pengurus' | 'hadir_peserta',
  ): WwAttendancePoint => ({
    id_event: row.id_event,
    label: fmtLabel(new Date(row.tglevent)),
    nama_event: row.nama_event,
    tglevent: new Date(row.tglevent).toISOString().slice(0, 10),
    hadir: Number(row[key]) || 0,
  })

  const payload: WwDashboardPayload = {
    jumlahPertemuanBulanan,
    idCabang,
    namaCabang,
    kehadiranPengurus: absenRows.map((r) => toPoint(r, 'hadir_pengurus')),
    kehadiranPeserta: absenRows.map((r) => toPoint(r, 'hadir_peserta')),
  }

  return NextResponse.json(payload)
}
