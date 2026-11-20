import { NextRequest, NextResponse } from 'next/server'
import { jalankanPushJobs } from '@/lib/push/jobs'

// Dipanggil sidecar `cron` di docker-compose tiap 15 menit. Secret sendiri (bukan INTERNAL_API_SECRET, yang juga
// membuka prod-migrate). ?dry=1 hanya menghitung penerima: tanpa klaim, tanpa kirim.
export const dynamic = 'force-dynamic'

function checkSecret(req: NextRequest): boolean {
  const secret = process.env.PUSH_CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return false
  return header.slice(7) === secret
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dry = req.nextUrl.searchParams.get('dry') === '1'
  const hasil = await jalankanPushJobs(new Date(), dry)
  return NextResponse.json({ ok: true, dry, ...hasil })
}
