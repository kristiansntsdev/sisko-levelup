import assert from 'node:assert/strict'
import { formatTelegramMessage, nasionalScopeLabel } from './telegram'

const msg = formatTelegramMessage('[Event Nasional] Dibuat', {
  Nama: 'WW Online Agustus',
  Tipe: `Online / ${nasionalScopeLabel('1')}`,
  ID: 123,
})

assert.equal(
  msg,
  [
    '[Event Nasional] Dibuat',
    'Nama: WW Online Agustus',
    'Tipe: Online / khusus',
    'ID: 123',
  ].join('\n'),
)
assert.equal(nasionalScopeLabel(''), 'seluruh_kota')
assert.equal(nasionalScopeLabel('1'), 'khusus')

console.log('telegram.check: ok')
