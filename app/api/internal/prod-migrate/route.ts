import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@/lib/generated/client'

export const maxDuration = 60

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

/** One-shot prod: event.approvebrimnas + brimnasional divisi=brim. Idempotent. */
export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return unauthorized()

  const cols = await db.$queryRaw<{ COLUMN_NAME: string }[]>`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'event'
      AND COLUMN_NAME = 'approvebrimnas'
  `
  const addedColumn = cols.length === 0
  if (addedColumn) {
    await db.$executeRawUnsafe('ALTER TABLE event ADD COLUMN approvebrimnas TEXT NULL')
  }

  const backfill = await db.$executeRaw(
    Prisma.sql`UPDATE event SET approvebrimnas = '0' WHERE approvebrimnas IS NULL OR approvebrimnas = ''`,
  )
  const brim = await db.pengurus.updateMany({
    where: { username: 'brimnasional@gmail.com' },
    data: { divisi: 'brim' },
  })
  const row = await db.pengurus.findFirst({
    where: { username: 'brimnasional@gmail.com' },
    select: { id_pengurus: true, username: true, divisi: true },
  })

  return NextResponse.json({
    ok: true,
    addedColumn,
    backfill,
    brimUpdated: brim.count,
    brim: row,
  })
}
