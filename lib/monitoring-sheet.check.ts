import assert from 'node:assert/strict'
import {
  buildMonitoringRow,
  groupByBulan,
  tanggalEventLabel,
  type MonitoringInput,
} from './monitoring-sheet'

const d = (s: string) => new Date(`${s}T00:00:00Z`)

assert.equal(tanggalEventLabel(d('2026-10-31'), d('2026-10-31')), '31 Oktober 2026')
assert.equal(tanggalEventLabel(d('2026-10-30'), d('2026-10-31')), '30–31 Oktober 2026')
assert.equal(tanggalEventLabel(d('2026-10-31'), d('2026-11-01')), '31 Oktober – 1 November 2026')
assert.equal(tanggalEventLabel(d('2026-12-31'), d('2027-01-01')), '31 Desember 2026 – 1 Januari 2027')

const base: MonitoringInput = {
  id_event: 1,
  nama_event: 'WW JFE',
  kota: 'Gresik',
  tglevent: d('2026-10-31'),
  tgleventselesai: d('2026-10-31'),
  created_at: null,
  suratpemberitahuan: ' https://drive.google.com/x ',
  flyerUrl: 'https://blob/x.png',
  jumlahAbsen: 0,
  lpj: null,
  dokumentasi: null,
}

// Event belum lewat, upload tidak tercatat → null (sheet pakai centang manual)
const before = buildMonitoringRow(base, new Date('2026-10-18T05:00:00Z'))
assert.equal(before.uploadTepatWaktu, null)
assert.equal(before.laporanTepatWaktu, false)
assert.equal(before.linkBeritaAcara, 'https://drive.google.com/x')
assert.equal(before.catatan, 'Waktu upload tidak tercatat')

// Upload 17 Okt 2026 01:00 WIB (16 Okt 18:00 UTC) → H-14 tepat, dihitung tanggal WIB bukan UTC
const pas = buildMonitoringRow({ ...base, created_at: new Date('2026-10-16T18:00:00Z') }, d('2026-10-18'))
assert.equal(pas.uploadTepatWaktu, true)
assert.equal(pas.catatan, 'Upload H-14')

const telat = buildMonitoringRow({ ...base, created_at: new Date('2026-10-20T03:00:00Z') }, d('2026-10-21'))
assert.equal(telat.uploadTepatWaktu, false)
assert.match(telat.catatan, /Upload H-11 \(kurang dari H-14\)/)

// Sesudah event, laporan belum ada
const after = buildMonitoringRow({ ...base, jumlahAbsen: 12 }, new Date('2026-11-05T05:00:00Z'))
assert.equal(after.absensi, true)
assert.match(after.catatan, /12 absen · Belum ada LPJ & dokumentasi \(batas 14 November 2026\)$/)

const lewat = buildMonitoringRow(
  { ...base, dokumentasi: { link: 'https://drive/dok', at: d('2026-11-02') } },
  new Date('2026-11-20T05:00:00Z'),
)
assert.equal(lewat.dokumentasi, true)
assert.equal(lewat.lpj, false)
assert.match(lewat.catatan, /Belum ada absensi · Lewat H\+14, belum ada LPJ$/)

// Laporan lengkap: tanggal terakhir yang dipakai
const lengkap = buildMonitoringRow(
  {
    ...base,
    lpj: { link: 'https://drive/lpj', at: new Date('2026-11-14T16:00:00Z') }, // 14 Nov 23:00 WIB
    dokumentasi: { link: 'https://drive/dok', at: d('2026-11-02') },
  },
  d('2026-12-01'),
)
assert.equal(lengkap.laporanTepatWaktu, true)
assert.match(lengkap.catatan, /Laporan H\+14$/)

const lengkapTelat = buildMonitoringRow(
  {
    ...base,
    lpj: { link: 'https://drive/lpj', at: new Date('2026-11-14T17:30:00Z') }, // 15 Nov 00:30 WIB
    dokumentasi: { link: 'https://drive/dok', at: d('2026-11-02') },
  },
  d('2026-12-01'),
)
assert.equal(lengkapTelat.laporanTepatWaktu, false)
assert.match(lengkapTelat.catatan, /Laporan H\+15 \(lewat H\+14\)$/)

// Laporan lengkap tapi data lama tanpa timestamp → null
const lama = buildMonitoringRow(
  { ...base, lpj: { link: 'x', at: null }, dokumentasi: { link: 'y', at: d('2026-11-02') } },
  d('2026-12-01'),
)
assert.equal(lama.laporanTepatWaktu, null)
assert.match(lama.catatan, /Waktu laporan tidak tercatat$/)

// Section per bulan
const sections = groupByBulan([
  { tglevent: d('2026-10-28'), row: before },
  { tglevent: d('2026-10-31'), row: before },
  { tglevent: d('2026-11-07'), row: before },
])
assert.deepEqual(
  sections.map((s) => [s.label, s.rows.length]),
  [
    ['OKTOBER (28–31 Oktober 2026)', 2],
    ['NOVEMBER (7 November 2026)', 1],
  ],
)

console.log('monitoring-sheet.check OK')
