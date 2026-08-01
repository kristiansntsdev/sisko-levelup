import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import ExcelJS from 'exceljs'
import { db } from '@/lib/db'
import { Prisma } from '@/lib/generated/client'

const ID_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function fmtDate(d: Date) {
  return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

const numFmt = '#,##0'

function styleNum(cell: ExcelJS.Cell) {
  cell.numFmt = numFmt
  cell.alignment = { horizontal: 'right' }
}

function styleHeader(cell: ExcelJS.Cell) {
  cell.font = { bold: true }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  cell.border = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const pengurusId = cookieStore.get('pengurus_id')?.value
  if (!pengurusId) return new NextResponse('Unauthorized', { status: 401 })

  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { kotalevelup: true, divisi: true, nama: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const idCabang = Number(pengurus.kotalevelup)
  const sp = req.nextUrl.searchParams
  const from = sp.get('from') ?? ''
  const to = sp.get('to') ?? ''
  const type = sp.get('type') // masuk | keluar
  const eventId = sp.get('eventId') // all | number

  const where: Prisma.kas_kota_txnWhereInput = { id_cabang: idCabang }
  if (type === 'masuk' || type === 'keluar') where.tipe = type
  if (from || to) {
    where.tanggal = {}
    if (from) where.tanggal.gte = new Date(`${from}T00:00:00.000Z`)
    if (to) where.tanggal.lte = new Date(`${to}T23:59:59.999Z`)
  }

  const [txns, events, cabang] = await Promise.all([
    db.kas_kota_txn.findMany({ where, orderBy: { tanggal: 'asc' } }),
    db.event.findMany({
      where: { id_cabang: pengurus.kotalevelup },
      select: { id_event: true, nama_event: true },
    }),
    db.cabang.findUnique({ where: { id_cabang: idCabang }, select: { namacabang: true } }),
  ])

  const eventMap = new Map(events.map((e) => [e.id_event, e.nama_event]))

  let rows = txns
  if (eventId && eventId !== 'all') {
    const eventName = eventMap.get(Number(eventId))
    if (eventName) {
      rows = rows.filter(
        (t) => t.kategori === 'event' && (t.keterangan === eventName || t.keterangan.startsWith(`${eventName} - `))
      )
    }
  }

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Laporan Kas Kota')
  ws.columns = [
    { key: 'no', width: 6 },
    { key: 'tanggal', width: 16 },
    { key: 'keterangan', width: 45 },
    { key: 'kategori', width: 14 },
    { key: 'tipe', width: 14 },
    { key: 'jumlah', width: 18 },
  ]

  const selectedEventName = eventId && eventId !== 'all' ? eventMap.get(Number(eventId)) : null
  const title = selectedEventName
    ? `LAPORAN EVENT — ${selectedEventName}`
    : from && to
      ? `LAPORAN KAS KOTA ${from} s/d ${to}`
      : 'LAPORAN KAS KOTA'
  const subtitle = cabang?.namacabang ?? pengurus.kotalevelup

  const r1 = ws.addRow([title, '', '', '', '', ''])
  ws.mergeCells(`A${r1.number}:F${r1.number}`)
  r1.getCell(1).font = { bold: true, size: 12 }
  r1.getCell(1).alignment = { horizontal: 'center' }

  const r2 = ws.addRow([subtitle, '', '', '', '', ''])
  ws.mergeCells(`A${r2.number}:F${r2.number}`)
  r2.getCell(1).font = { bold: true, size: 11 }
  r2.getCell(1).alignment = { horizontal: 'center' }

  ws.addRow([])

  const hr = ws.addRow(['No', 'Tanggal', 'Keterangan', 'Kategori', 'Tipe', 'Jumlah'])
  hr.eachCell((c) => styleHeader(c))

  let totalMasuk = 0
  let totalKeluar = 0

  rows.forEach((t, i) => {
    const amount = Number(t.jumlah)
    if (t.tipe === 'masuk') totalMasuk += amount
    else totalKeluar += amount

    const row = ws.addRow([i + 1, fmtDate(t.tanggal), t.keterangan, t.kategori, t.tipe, amount])
    styleNum(row.getCell(6))
  })

  ws.addRow([])
  const masukRow = ws.addRow(['', '', '', '', 'TOTAL MASUK', totalMasuk])
  masukRow.font = { bold: true }
  styleNum(masukRow.getCell(6))

  const keluarRow = ws.addRow(['', '', '', '', 'TOTAL KELUAR', totalKeluar])
  keluarRow.font = { bold: true }
  styleNum(keluarRow.getCell(6))

  const saldo = totalMasuk - totalKeluar
  const saldoRow = ws.addRow(['', '', '', '', 'SALDO', saldo])
  saldoRow.font = { bold: true }
  styleNum(saldoRow.getCell(6))

  const buf = await wb.xlsx.writeBuffer()
  const slug = selectedEventName
    ? selectedEventName.replace(/\s+/g, '-').toLowerCase().slice(0, 40)
    : from && to
      ? `${from}_${to}`
      : 'semua'
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="laporan-kas-kota-${slug}.xlsx"`,
    },
  })
}
