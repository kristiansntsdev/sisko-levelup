import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export type SheetRow = { nama: string; isi: string }

export type KesaksianFeedbackSheetPayload = {
  generatedAt: string
  /** Terbaru dulu */
  kesaksian: SheetRow[]
  /** Terbaru dulu; isi = jawaban + baris "Pilihan: ..." kalau ada chip yang dipilih */
  feedback: SheetRow[]
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Secret sendiri (bukan INTERNAL_API_SECRET / MONITORING_SHEET_SECRET): tersimpan di Script Properties
// spreadsheet Kesaksian, yang bisa dibaca semua editornya, dan isinya data pribadi anggota.
function checkSecret(req: NextRequest): boolean {
  const secret = process.env.KESAKSIAN_SHEET_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return false
  return header.slice(7) === secret
}

/** Kesaksian + Feedback App untuk Apps Script (scripts/kesaksian-feedback-sheet.gs): nama penulis + isi. */
export async function GET(req: NextRequest) {
  if (!checkSecret(req)) return unauthorized()

  const [kesaksian, feedback] = await Promise.all([
    db.kesaksian.findMany({
      orderBy: { id_kesaksian: 'desc' },
      select: { id_peserta: true, isi: true },
    }),
    db.feedback_app.findMany({
      orderBy: { id_feedback: 'desc' },
      select: { id_peserta: true, pilihan: true, jawaban: true },
    }),
  ])

  const ids = [...new Set([...kesaksian, ...feedback].map((r) => Number(r.id_peserta)).filter(Number.isInteger))]
  const peserta = ids.length
    ? await db.peserta.findMany({ where: { id_peserta: { in: ids } }, select: { id_peserta: true, nama: true } })
    : []
  const namaOf = new Map(peserta.map((p) => [String(p.id_peserta), p.nama.trim()]))
  const nama = (id: string) => namaOf.get(String(Number(id))) || `Peserta #${id}`

  const payload: KesaksianFeedbackSheetPayload = {
    generatedAt: new Date().toISOString(),
    kesaksian: kesaksian.map((r) => ({ nama: nama(r.id_peserta), isi: r.isi })),
    feedback: feedback.map((r) => {
      const pilihan = r.pilihan.split(',').map((s) => s.trim()).filter(Boolean)
      return {
        nama: nama(r.id_peserta),
        isi: pilihan.length ? `${r.jawaban}\n\nPilihan: ${pilihan.join(', ')}` : r.jawaban,
      }
    }),
  }
  return NextResponse.json(payload)
}
