import assert from 'node:assert/strict'
import {
  eventActionButtons,
  eventFormTelegramFields,
  isTelegramButtonUrl,
  nasionalScopeLabel,
} from './telegram'

process.env.TELEGRAM_APP_URL = 'https://sisko-v2.vercel.app'

const detail = eventFormTelegramFields({
  cabangLabel: 'Jakarta',
  jenisevent: 'Offline',
  wwtype: 'bulanan',
  target: '1,2',
  targetpengurus: '1',
  targetjumlah: 100,
  tglevent: new Date(2026, 2, 2),
  tgleventselesai: new Date(2026, 2, 2),
  jamevent: '09:00',
  jamselesaievent: '12:00',
  alamatevent: 'Gedung A',
  radius: 500,
  danaevent: '1500000',
  id: 205,
})

assert.equal(detail['Cabang'], 'Jakarta')
assert.equal(detail['Jenis'], 'Offline')
assert.equal(detail['Tipe WW'], 'Bulanan')
assert.equal(detail['Target Peserta'], 'Volunteer, Squad')
assert.equal(detail['Target Pengurus'], 'Admin LK')
assert.equal(detail['Target Jumlah'], '100 orang')
assert.equal(detail['Jam'], '09:00 – 12:00')
assert.equal(detail['Alamat'], 'Gedung A')
assert.equal(detail['Radius'], '500 m')
assert.equal(detail['Dana'], 'Rp 1.500.000')
assert.equal(detail['ID'], 205)

const withMaps = eventFormTelegramFields({
  ...{
    cabangLabel: 'Jakarta',
    jenisevent: 'Offline',
    wwtype: 'bulanan',
    target: '1',
    targetpengurus: '',
    targetjumlah: 0,
    tglevent: new Date(2026, 2, 2),
    tgleventselesai: new Date(2026, 2, 2),
    jamevent: '09:00',
    jamselesaievent: '12:00',
    alamatevent: 'Gedung A',
    longlatevent: '-6.2,106.8',
    radius: 500,
    danaevent: '',
    id: 205,
  },
})
assert.equal(withMaps['Maps'], 'https://maps.google.com/?q=-6.2,106.8')

const buttons = eventActionButtons(205, { poster: 'flyer.jpg', longlatevent: '-6.2,106.8' })
assert.equal(buttons.length, 5)
assert.ok(buttons[0].url.endsWith('/dashboard/kota/alk/event/205'))
assert.ok(buttons[1].url.includes('/uploads/poster/flyer.jpg'))
assert.equal(buttons[2].url, 'https://maps.google.com/?q=-6.2,106.8')
assert.ok(buttons[3].url.endsWith('/alk/event/205/approve'))
assert.ok(buttons[4].url.endsWith('/brim/event/205/approve'))

assert.equal(nasionalScopeLabel(''), 'seluruh_kota')
assert.equal(isTelegramButtonUrl('http://localhost:3000/x'), false)
assert.equal(isTelegramButtonUrl('https://sisko-v2.vercel.app/x'), true)

console.log('telegram.check: ok')
