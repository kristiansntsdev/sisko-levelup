import assert from 'node:assert/strict'
import { addDays, AIR_ISI_MAX, AIR_ISI_PRATINJAU, airLevel, airStage, daysBetween, hariLabel, airAnggota, hitungNasional, perluPopup, perluPush, pratinjauIsi, statusAir, terakhirMinum, urutAnggotaHaus, validateLaporan } from './air-hidup'

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

const k = statusAir('2026-10-10', '2026-11-10')
assert.equal(k.hari, 31)
assert.equal(k.stage, 'haus')
assert.equal(statusAir(null, '2026-11-10').stage, 'belum')
assert.equal(statusAir('2026-11-12', '2026-11-10').hari, 0, 'tanggal masa depan tidak negatif')

// mulai = air penuh di hari kota masuk sistem, laporan yang lebih baru menggantikannya
const m = statusAir(null, '2026-11-10', '2026-11-01')
assert.equal(m.hari, 9)
assert.equal(m.hariLapor, null, 'belum ada laporan sungguhan')
assert.equal(m.stage, 'segar')
const m2 = statusAir('2026-11-05', '2026-11-10', '2026-11-01')
assert.equal(m2.sejak, '2026-11-05', 'laporan lebih baru dari mulai')
assert.equal(m2.hariLapor, 5)
const m3 = statusAir('2026-09-01', '2026-11-10', '2026-11-01')
assert.equal(m3.sejak, '2026-11-01', 'mulai lebih baru dari laporan lama')
assert.equal(statusAir(null, '2026-11-10', '2026-12-01').hari, 0, 'mulai di masa depan tidak negatif')
assert.equal(perluPush({ hari: 29 }), false)
assert.equal(perluPush({ hari: 30 }), true)
assert.equal(perluPush({ hari: 69 }), true)
assert.equal(perluPush({ hari: 70 }), false)
assert.equal(perluPush({ hari: null }), false)

assert.equal(hariLabel(null), 'belum ada laporan')
assert.equal(hariLabel(0), 'hari ini')
assert.equal(hariLabel(1), 'kemarin')
assert.equal(hariLabel(12), '12 hari lalu')

const today = '2026-11-10'
assert.equal(validateLaporan({ tanggal: today, anggota: [1, 2, 3], isi: 'Dipulihkan' }, today), null)
assert.ok(validateLaporan({ tanggal: '2026-11-11', anggota: [1], isi: 'x' }, today), 'masa depan ditolak')
assert.ok(validateLaporan({ tanggal: today, anggota: [], isi: 'x' }, today), 'tanpa anggota ditolak')
assert.ok(validateLaporan({ tanggal: today, anggota: [1, 1], isi: 'x' }, today), 'anggota kembar ditolak')
assert.ok(validateLaporan({ tanggal: today, anggota: [1], isi: '   ' }, today), 'isi kosong ditolak')
assert.equal(validateLaporan({ tanggal: today, anggota: [1], isi: 'a'.repeat(AIR_ISI_MAX) }, today), null)
assert.ok(validateLaporan({ tanggal: today, anggota: [1], isi: 'a'.repeat(AIR_ISI_MAX + 1) }, today), 'isi terlalu panjang')
assert.deepEqual(pratinjauIsi('  pendek  '), { teks: 'pendek', terpotong: false })
assert.equal(pratinjauIsi('a'.repeat(AIR_ISI_PRATINJAU)).terpotong, false)
const panjang = pratinjauIsi('kata '.repeat(200))
assert.ok(panjang.terpotong && panjang.teks.length <= AIR_ISI_PRATINJAU + 1 && panjang.teks.endsWith('…'), 'pratinjau dipotong di batas kata')
assert.ok(validateLaporan({ tanggal: 'kemarin', anggota: [1], isi: 'x' }, today), 'format tanggal salah')

// terakhir minum = yang paling baru antara absen WW Online dan penandaan laporan
assert.equal(terakhirMinum('2026-11-01', '2026-11-05'), '2026-11-05')
assert.equal(terakhirMinum(null, '2026-11-05'), '2026-11-05')
assert.equal(terakhirMinum(null, null), null)

const agt = (id: number, nama: string, idCabang: number | null, terakhir: string | null, mulai: string | null = null) =>
  airAnggota({ id, nama, idCabang, namaKota: idCabang ? `Kota ${idCabang}` : null, terakhir, mulai }, today)
const ani = agt(1, 'Ani', 1, '2026-11-09') // hari 1
const budi = agt(2, 'Budi', 1, '2026-10-01') // hari 40 = kering
const cici = agt(3, 'Cici', 1, null) // belum
const dedi = agt(4, 'Dedi', 2, '2026-10-12') // hari 29
assert.equal(ani.stage, 'melimpah')
assert.equal(budi.stage, 'kering')
assert.equal(cici.stage, 'belum')
assert.deepEqual(urutAnggotaHaus([ani, budi, cici]).map((a) => a.nama), ['Cici', 'Budi', 'Ani'], 'belum pernah dulu, lalu terhaus')

// nasional: anggota yang minum dalam 30 hari terakhir (hari ke-30 dan lebih tua tidak dihitung) + kota mereka
assert.deepEqual(hitungNasional([ani, budi, cici, dedi, agt(5, 'Eka', null, '2026-11-09')]), { orang: 3, kota: 2 }, 'Ani, Dedi, Eka (tanpa kota tidak dihitung sebagai kota)')

console.log('air-hidup.check: ok')
