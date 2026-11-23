import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pushLaporanWw } from '@/lib/push/events'

// Susulan push "Kabar WW" untuk laporan yang naik sebelum fitur push ada. POST ?id= (default: laporan terakhir).
// Bearer PUSH_CRON_SECRET. Aman dipanggil ulang: kunci dedup `ww-laporan:{id}` mencegah kirim dobel.
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
  const idParam = Number(req.nextUrl.searchParams.get('id'))
  const row = Number.isInteger(idParam) && idParam > 0
    ? await db.ww_laporan.findUnique({ where: { id_laporan: idParam } })
    : await db.ww_laporan.findFirst({ orderBy: { id_laporan: 'desc' } })
  if (!row) return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 })
  const hasil = await pushLaporanWw({
    idLaporan: row.id_laporan,
    idKota: row.id_cabang,
    idPelapor: row.id_peserta,
    jumlah: row.jumlah,
    isi: row.isi,
    foto: row.foto_url || undefined,
  })
  return NextResponse.json({ ok: true, idLaporan: row.id_laporan, dikirim: hasil !== null, hasil })
}
