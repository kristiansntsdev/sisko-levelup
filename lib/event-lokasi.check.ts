import { lokasiNeedsSesi, parseLatLng } from './event-lokasi'

console.assert(lokasiNeedsSesi(2, 0), '2 lokasi tanpa sesi')
console.assert(!lokasiNeedsSesi(2, 1), '2 lokasi + sesi')
console.assert(!lokasiNeedsSesi(1, 0), '1 lokasi tanpa sesi ok')
console.assert(!lokasiNeedsSesi(0, 0), '0 lokasi ok')

const p = parseLatLng('-6.2,106.8')
console.assert(p?.lat === -6.2 && p?.lng === 106.8, 'parse ok')
console.assert(parseLatLng('-6.2, 106.8')?.lng === 106.8, 'parse spasi')
console.assert(parseLatLng('') === null, 'kosong')
console.assert(parseLatLng('abc,def') === null, 'bukan angka')
console.assert(parseLatLng('1') === null, 'satu nilai')
