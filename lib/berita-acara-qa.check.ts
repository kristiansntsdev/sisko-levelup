import assert from 'node:assert/strict'
import {
  BA_QA_REVIEWING_STEPS,
  beritaAcaraQaReviewingStep,
  beritaAcaraQaTelegramBanner,
  beritaAcaraQaTelegramFields,
  buildBeritaAcaraQaPayload,
  collectFormKosong,
  formSnapshotFromEvent,
  hariMenujuEvent,
  isoDate,
  needsBeritaAcaraReview,
  parseBeritaAcaraQa,
  parseBeritaAcaraQaReview,
  parseLatLng,
  stringifyBeritaAcaraQa,
} from './berita-acara-qa'

assert.equal(needsBeritaAcaraReview('https://docs.google.com/x'), true)
assert.equal(needsBeritaAcaraReview(''), false)
assert.equal(needsBeritaAcaraReview('  '), false)
assert.equal(needsBeritaAcaraReview('https://docs.google.com/x', 'nasional'), false)
assert.equal(needsBeritaAcaraReview('https://docs.google.com/x', 'bulanan'), true)

assert.deepEqual(parseLatLng('-7.4, 111.4'), { lat: -7.4, lng: 111.4 })
assert.equal(parseLatLng(''), null)
assert.equal(parseLatLng('7.4'), null)
assert.equal(parseLatLng('foo,bar'), null)

assert.equal(isoDate(new Date(2026, 7, 19)), '2026-08-19')
assert.equal(hariMenujuEvent(new Date(2026, 7, 19), new Date(2026, 7, 11)), 8)

const baseForm = formSnapshotFromEvent({
  nama_event: 'We Worship',
  jenisevent: 'Offline',
  wwtype: 'bulanan',
  target: '0',
  targetpengurus: '1',
  targetjumlah: 12,
  tglevent: new Date(2026, 7, 19),
  tgleventselesai: new Date(2026, 7, 19),
  jamevent: '09:00',
  jamselesaievent: '',
  alamatevent: 'GKI',
  longlatevent: '',
  radius: 500,
  danaevent: '0',
  suratpemberitahuan: 'https://docs.google.com/x',
  khusus: '',
  flyer_ada: true,
})
assert.equal(baseForm.lat, null)
assert.equal(baseForm.lng, null)
assert.deepEqual(collectFormKosong(baseForm).sort(), ['danaevent', 'jamselesaievent', 'longlatevent'])

const fullForm = formSnapshotFromEvent({
  ...baseForm,
  jamselesaievent: '12:00',
  longlatevent: '-7.4,111.4',
  danaevent: '1500000',
  flyer_ada: true,
  tglevent: new Date(2026, 7, 19),
  tgleventselesai: new Date(2026, 7, 19),
})
assert.deepEqual(fullForm.lat, -7.4)
assert.deepEqual(collectFormKosong(fullForm), [])

const noFlyer = { ...fullForm, flyer_ada: false }
assert.ok(collectFormKosong(noFlyer).includes('flyer'))

const onlineZeroRadius = { ...fullForm, jenisevent: 'Online', radius: 0 }
assert.ok(!collectFormKosong(onlineZeroRadius).includes('radius'))
const offlineZeroRadius = { ...fullForm, jenisevent: 'Offline', radius: 0 }
assert.ok(collectFormKosong(offlineZeroRadius).includes('radius'))

const payload = buildBeritaAcaraQaPayload({
  kota: 'LevelUP Ngawi',
  flyerUrl: 'https://blob.example/a.png',
  form: fullForm,
  tglevent: new Date(2026, 7, 19),
})
assert.equal(payload.surat_url, 'https://docs.google.com/x')
assert.equal(payload.kota, 'LevelUP Ngawi')
assert.equal(payload.form.wwtype, 'bulanan')
assert.ok(Array.isArray(payload.form_kosong))

const raw = {
  status: 'REVISI',
  kota: 'Ngawi',
  acara: 'We Worship',
  surat_url: 'https://docs.google.com/x',
  checklist: {
    h14: { status: 'mismatch', detail: 'H-8, wajib H-14' },
    form_lengkap: { status: 'tidak', detail: 'Kosong: longlatevent' },
    berita_acara: { status: 'ada', detail: 'Google Docs terbaca' },
    flyer: { status: 'ada', detail: 'image_url ada' },
    data_cocok: { status: 'mismatch', detail: 'Tanggal beda' },
    sop_wfe: { status: 'ada', detail: 'tidak berlaku' },
  },
  extracted: { acara: 'WW', tanggal: '25 Juli', waktu: '09:00', tempat: 'GKI', pembicara: null, dana: '1jt' },
  temuan: ['H-8'],
  rekomendasi: ['Ajukan H-14'],
  expected_match: { acara: true, tanggal: false, waktu: true, tempat: true, dana: null, longlatevent: false },
}
const review = parseBeritaAcaraQaReview(raw)
assert.ok(review)
assert.equal(review.status, 'REVISI')
assert.equal(review.checklist.h14.status, 'mismatch')
assert.equal(review.checklist.sop_wfe.detail, 'tidak berlaku')
assert.equal(review.expected_match.tanggal, false)
assert.equal(review.expected_match.dana, null)

assert.equal(beritaAcaraQaTelegramFields(review)['QA berita acara'], 'REVISI')
assert.equal(beritaAcaraQaTelegramBanner('REVISI'), '🚨🚨🚨 Butuh Revisi 🚨🚨🚨')
assert.equal(beritaAcaraQaTelegramBanner('PASS'), undefined)
assert.equal(beritaAcaraQaTelegramBanner('BLOKIR'), undefined)

assert.equal(parseBeritaAcaraQa(''), null)
const rec = parseBeritaAcaraQa(stringifyBeritaAcaraQa({
  state: 'done',
  agentId: 'bc-ba',
  runId: 'run-1',
  review,
  diajukan: false,
  diajukanAt: null,
  error: null,
}))
assert.equal(rec?.state, 'done')
assert.equal(rec?.agentId, 'bc-ba')
assert.equal(rec?.review?.status, 'REVISI')

assert.equal(parseBeritaAcaraQaReview({ status: 'NOPE' }), null)
assert.equal(beritaAcaraQaReviewingStep(0), BA_QA_REVIEWING_STEPS[0])
assert.equal(beritaAcaraQaReviewingStep(4_000), BA_QA_REVIEWING_STEPS[1])
assert.equal(
  beritaAcaraQaReviewingStep(BA_QA_REVIEWING_STEPS.length * 4_000),
  BA_QA_REVIEWING_STEPS[0],
)

console.log('berita-acara-qa.check: ok')
