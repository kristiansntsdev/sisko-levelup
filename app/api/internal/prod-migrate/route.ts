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

async function ensureEventColumn(name: string, ddl: string): Promise<boolean> {
  const cols = await db.$queryRaw<{ COLUMN_NAME: string }[]>`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'event'
      AND COLUMN_NAME = ${name}
  `
  const missing = cols.length === 0
  if (missing) await db.$executeRawUnsafe(ddl)
  return missing
}

/** Idempotent prod: event.approvebrimnas, event.image_url, event.flyer_qa, brimnasional divisi=brim. */
export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return unauthorized()

  const addedColumn = await ensureEventColumn(
    'approvebrimnas',
    'ALTER TABLE event ADD COLUMN approvebrimnas TEXT NULL',
  )
  const backfill = await db.$executeRaw(
    Prisma.sql`UPDATE event SET approvebrimnas = '0' WHERE approvebrimnas IS NULL OR approvebrimnas = ''`,
  )

  const addedImageUrl = await ensureEventColumn(
    'image_url',
    'ALTER TABLE event ADD COLUMN image_url TEXT NULL',
  )
  const imageBackfill = await db.$executeRaw(
    Prisma.sql`UPDATE event SET image_url = '' WHERE image_url IS NULL`,
  )

  const addedFlyerQa = await ensureEventColumn(
    'flyer_qa',
    'ALTER TABLE event ADD COLUMN flyer_qa LONGTEXT NULL',
  )
  const flyerQaBackfill = await db.$executeRaw(
    Prisma.sql`UPDATE event SET flyer_qa = '' WHERE flyer_qa IS NULL`,
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
    addedImageUrl,
    imageBackfill,
    addedFlyerQa,
    flyerQaBackfill,
    brimUpdated: brim.count,
    brim: row,
  })
}
