import assert from 'node:assert/strict'
import { addDays, airLevel, airStage, daysBetween, hariLabel, hitungNasional, kotaAir, perluPopup, urutKotaHaus, validateLaporan } from './air-hidup'

assert.equal(airStage(null), 'belum')
assert.equal(airStage(0), 'melimpah')
assert.equal(airStage(6), 'melimpah')
assert.equal(airStage(7), 'segar')
assert.equal(airStage(29), 'segar')
assert.equal(airStage(30), 'haus')
assert.equal(airStage(39), 'haus')
assert.equal(airStage(40), 'kering')
assert.equal(airStage(100), 'kering')

assert.equal(airLevel(0), 1)
assert.equal(airLevel(20), 0.5)
assert.equal(airLevel(40), 0)
assert.equal(airLevel(90), 0)
assert.equal(airLevel(null), 0)

assert.equal(perluPopup('haus'), true)
assert.equal(perluPopup('kering'), true)
assert.equal(perluPopup('belum'), false)
assert.equal(perluPopup('segar'), false)

assert.equal(daysBetween('2026-11-01', '2026-11-10'), 9)
assert.equal(daysBetween('2026-10-31', '2026-11-01'), 1)
assert.equal(addDays('2026-11-10', -31), '2026-10-10')

const k = kotaAir(12, 'LevelUP Medan', '2026-10-10', '2026-11-10')
assert.equal(k.hari, 31)
assert.equal(k.stage, 'haus')
assert.equal(kotaAir(1, 'X', null, '2026-11-10').stage, 'belum')
assert.equal(kotaAir(1, 'X', '2026-11-12', '2026-11-10').hari, 0, 'tanggal masa depan tidak negatif')

const urut = urutKotaHaus([
  { namaKota: 'B', hari: 2 },
  { namaKota: 'A', hari: 44 },
  { namaKota: 'C', hari: null },
])
assert.deepEqual(urut.map((x) => x.namaKota), ['C', 'A', 'B'], 'belum pernah dulu, lalu terhaus')

assert.equal(hariLabel(null), 'belum ada laporan')
assert.equal(hariLabel(0), 'hari ini')
assert.equal(hariLabel(1), 'kemarin')
assert.equal(hariLabel(12), '12 hari lalu')

const today = '2026-11-10'
assert.equal(validateLaporan({ tanggal: today, jumlah: 3, isi: 'Dipulihkan' }, today), null)
assert.ok(validateLaporan({ tanggal: '2026-11-11', jumlah: 3, isi: 'x' }, today), 'masa depan ditolak')
assert.ok(validateLaporan({ tanggal: today, jumlah: 0, isi: 'x' }, today), 'jumlah 0 ditolak')
assert.ok(validateLaporan({ tanggal: today, jumlah: 1.5, isi: 'x' }, today), 'jumlah desimal ditolak')
assert.ok(validateLaporan({ tanggal: today, jumlah: 3, isi: '   ' }, today), 'isi kosong ditolak')
assert.ok(validateLaporan({ tanggal: today, jumlah: 3, isi: 'a'.repeat(281) }, today), 'isi terlalu panjang')
assert.ok(validateLaporan({ tanggal: 'kemarin', jumlah: 3, isi: 'x' }, today), 'format tanggal salah')

const n = hitungNasional(
  [
    { idCabang: 1, tanggal: '2026-11-09', jumlah: 10 },
    { idCabang: 1, tanggal: '2026-11-01', jumlah: 5 },
    { idCabang: 2, tanggal: '2026-10-12', jumlah: 7 },
    { idCabang: 3, tanggal: '2026-10-11', jumlah: 99 },
  ],
  today,
)
assert.deepEqual(n, { orang: 22, kota: 2 }, 'hari ke-30 dan lebih tua tidak dihitung')

console.log('air-hidup.check: ok')
