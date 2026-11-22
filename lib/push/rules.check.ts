// Jalankan: npx tsx lib/push/rules.check.ts
import assert from 'node:assert/strict'
import { endpointDiizinkan } from './endpoint'
import { nomorInti, nomorSama, pathAman, pesanAktif, platformDari } from './target'
import { daftarNama, dobBulanTanggal, ingatH0Aktif, jendelaBuka, pesertaLihatEvent, ultahHariIni, wibBesokIso } from './rules'

const d = (s: string) => new Date(s)

// ulang tahun
assert.deepEqual(dobBulanTanggal('1998-08-27'), { m: 8, d: 27 })
assert.deepEqual(dobBulanTanggal('27/8/1998'), { m: 8, d: 27 })
assert.deepEqual(dobBulanTanggal('27-08-1998'), { m: 8, d: 27 })
assert.equal(dobBulanTanggal(''), null)
assert.equal(dobBulanTanggal('besok'), null)
assert.equal(dobBulanTanggal('1998-13-01'), null)
// 27 Agu 2026 08:00 WIB = 01:00 UTC
assert.equal(ultahHariIni('1998-08-27', d('2026-08-27T01:00:00Z')), true)
// 26 Agu 2026 23:30 UTC = 27 Agu 06:30 WIB (WIB, bukan UTC)
assert.equal(ultahHariIni('1998-08-27', d('2026-08-26T23:30:00Z')), true)
assert.equal(ultahHariIni('1998-08-27', d('2026-08-28T01:00:00Z')), false)
// 29 Feb: 2026 bukan kabisat -> 28 Feb; 2028 kabisat -> 29 Feb saja
assert.equal(ultahHariIni('2000-02-29', d('2026-02-28T01:00:00Z')), true)
assert.equal(ultahHariIni('2000-02-29', d('2026-03-01T01:00:00Z')), false)
assert.equal(ultahHariIni('2000-02-29', d('2028-02-28T01:00:00Z')), false)
assert.equal(ultahHariIni('2000-02-29', d('2028-02-29T01:00:00Z')), true)

// audiens event
const tamu = { userlevel: '0', kotalevelup: '5' }
const core = { userlevel: '3', kotalevelup: '5' }
const pusat = { userlevel: '5', kotalevelup: '1' }
assert.equal(pesertaLihatEvent(tamu, { id_cabang: '5', wwtype: 'bulanan' }), true)
assert.equal(pesertaLihatEvent(tamu, { id_cabang: '6', wwtype: 'bulanan' }), false)
assert.equal(pesertaLihatEvent(tamu, { id_cabang: '0', wwtype: 'bulanan' }), true)
assert.equal(pesertaLihatEvent(tamu, { id_cabang: '0', wwtype: 'nasional' }), false)
assert.equal(pesertaLihatEvent(core, { id_cabang: '0', wwtype: 'nasional' }), true)
assert.equal(pesertaLihatEvent(pusat, { id_cabang: '9', wwtype: 'jfe' }), true)

// daftar nama
assert.equal(daftarNama(['A', 'B']), 'A, B')
assert.equal(daftarNama(Array.from({ length: 30 }, (_, i) => `N${i}`)).endsWith('+5 lainnya'), true)

// jendela WIB: 18:30 WIB = 11:30 UTC
assert.equal(jendelaBuka('ingat-h1', d('2026-08-27T11:30:00Z')), true)
assert.equal(jendelaBuka('ingat-h1', d('2026-08-27T14:30:00Z')), false) // 21:30 WIB
assert.equal(wibBesokIso(d('2026-08-27T18:00:00Z')), '2026-08-29') // 28 Agu 01:00 WIB -> besok 29

// hari-H: mulai 19:00 WIB = 12:00 UTC
const mulai = d('2026-08-27T12:00:00Z')
assert.equal(ingatH0Aktif(mulai, d('2026-08-27T10:30:00Z')), true)
assert.equal(ingatH0Aktif(mulai, d('2026-08-27T09:30:00Z')), false)
assert.equal(ingatH0Aktif(mulai, d('2026-08-27T12:00:00Z')), false)
assert.equal(ingatH0Aktif(null, d('2026-08-27T10:30:00Z')), false)

// endpoint push: hanya layanan browser dikenal
assert.equal(endpointDiizinkan('https://fcm.googleapis.com/fcm/send/abc'), true)
assert.equal(endpointDiizinkan('https://web.push.apple.com/QAbc'), true)
assert.equal(endpointDiizinkan('https://updates.push.services.mozilla.com/wpush/v2/x'), true)
assert.equal(endpointDiizinkan('https://wns2-par02p.notify.windows.com/?token=x'), true)
assert.equal(endpointDiizinkan('http://fcm.googleapis.com/x'), false)
assert.equal(endpointDiizinkan('https://evil.com/fcm.googleapis.com'), false)
assert.equal(endpointDiizinkan('https://fcm.googleapis.com.evil.com/x'), false)
assert.equal(endpointDiizinkan('https://127.0.0.1/x'), false)
assert.equal(endpointDiizinkan('https://user:p@fcm.googleapis.com/x'), false)
assert.equal(endpointDiizinkan(42), false)

// nomor HP
assert.equal(nomorInti('0812-3456-789'), '81234567' + '89')
assert.equal(nomorInti('+62 812 3456 789'), '8123456789')
assert.equal(nomorInti('628123456789'), '8123456789')
assert.equal(nomorInti('2'), null)
assert.equal(nomorSama('08123456789', '+62 812-3456-789'), true)
assert.equal(nomorSama('08123456789', '08123456780'), false)
assert.equal(nomorSama('', ''), false)
assert.equal(pathAman('/events'), '/events')
assert.equal(pathAman('//evil.com'), '/dashboard')
assert.equal(pathAman('https://evil.com'), '/dashboard')
assert.equal(pathAman(''), '/dashboard')

// platform perangkat
assert.equal(platformDari('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15'), 'iOS')
assert.equal(platformDari('Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 Chrome/131 Mobile'), 'Android')
assert.equal(platformDari('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131'), 'Desktop')
assert.equal(platformDari('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605'), 'Desktop')
assert.equal(platformDari(''), 'Lainnya')

// notifikasi percobaan
assert.equal(pesanAktif('Esra Londa').body, 'Selamat Fitur Notifikasi LevelUP telah berhasil diaktifkan, Semangat Melayani Selalu di LevelUP - Esra Londa')
assert.equal(pesanAktif('  ').body.endsWith('- Sahabat LevelUP'), true)
assert.ok(pesanAktif('Kristian Epa Froditus Santoso').body.length <= 180)

assert.equal(jendelaBuka('air', d('2026-08-27T01:59:00Z')), false) // 08:59 WIB
assert.equal(jendelaBuka('air', d('2026-08-27T02:00:00Z')), true) // 09:00 WIB
assert.equal(jendelaBuka('air', d('2026-08-27T05:00:00Z')), false) // 12:00 WIB

console.log('push rules ok')
