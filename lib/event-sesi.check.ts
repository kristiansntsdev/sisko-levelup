import { absenDuplicateWhere, hadirPenuh, isoDate, parseLocalDate, sesiWajibIds } from './event-sesi'

const sesi = [
  { id_sesi: 1, wajib: true },
  { id_sesi: 2, wajib: false },
  { id_sesi: 3, wajib: true },
]

const wajib = sesiWajibIds(sesi)
console.assert(wajib.length === 2 && wajib[0] === 1 && wajib[1] === 3, 'sesiWajibIds')

console.assert(hadirPenuh([1, 3], wajib), 'hadir penuh both wajib')
console.assert(hadirPenuh([1, 2, 3], wajib), 'hadir penuh with optional')
console.assert(!hadirPenuh([1], wajib), 'missing wajib')
console.assert(!hadirPenuh([1, 2], wajib), 'missing wajib 3')
console.assert(!hadirPenuh([], wajib), 'empty absen')

console.assert(hadirPenuh([2], []), 'no wajib + any absen = penuh')
console.assert(!hadirPenuh([], []), 'no wajib + no absen = not penuh')
console.assert(!hadirPenuh([null, undefined], []), 'null ids ignored when no wajib')

const withSesi = absenDuplicateWhere(10, 99, 5)
console.assert(
  'id_sesi' in withSesi &&
    (withSesi as { id_peserta_int: number; id_sesi: number }).id_sesi === 5 &&
    (withSesi as { id_peserta_int: number }).id_peserta_int === 10,
  'dup key with sesi',
)

const noSesi = absenDuplicateWhere(10, 99, null)
console.assert('OR' in noSesi && Array.isArray(noSesi.OR) && noSesi.OR.length === 2, 'dup key no sesi')

// Calendar date must survive JSON (server action) without WIB→UTC day shift
const roundtrip = isoDate(new Date(parseLocalDate('2026-09-18').toISOString()))
console.assert(roundtrip === '2026-09-18', `parseLocalDate/isoDate roundtrip got ${roundtrip}`)

console.log('event-sesi.check.ts: ok')
