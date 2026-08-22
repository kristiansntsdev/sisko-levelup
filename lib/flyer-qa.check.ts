import assert from 'node:assert/strict'
import {
  extractJsonObject,
  flyerQaReviewingStep,
  flyerQaTelegramFields,
  formatFlyerExpectedTanggal,
  FLYER_QA_REVIEWING_STEPS,
  needsFlyerReview,
  parseFlyerQa,
  parseFlyerQaReview,
  stringifyFlyerQa,
} from './flyer-qa'

assert.equal(needsFlyerReview('bulanan', 'https://blob.example/a.png'), true)
assert.equal(needsFlyerReview('jfe', 'https://blob.example/a.png'), false)
assert.equal(needsFlyerReview('bulanan', ''), false)
assert.equal(needsFlyerReview('bulanan', '  '), false)

assert.equal(formatFlyerExpectedTanggal(new Date(2026, 7, 22)), '22 Agustus 2026')

const fenced = '```json\n{"status":"REVISI","kota":"Ngawi","acara":"We Worship","file_url":"https://x","checklist":{"logo_levelup_kota":{"status":"ada","detail":"ok","posisi":"kanan_atas","teks":"LevelUP NGAWI"},"typo":{"status":"ada","detail":"US","posisi":null,"teks":null}},"sosial_media":[{"platform":"instagram","handle":"levelup.ngawi"}],"typo_list":[{"lokasi":"footer","tertulis":"Connect With US","usulan":"Connect With Us"}],"temuan":["Logo kiri atas"],"rekomendasi":["Pindah kanan atas"],"expected_match":{"acara":true,"tanggal":true,"waktu":null,"tempat":true,"pembicara":false}}\n```'
const extracted = extractJsonObject(fenced)
const review = parseFlyerQaReview(extracted)
assert.ok(review)
assert.equal(review.status, 'REVISI')
assert.equal(review.kota, 'Ngawi')
assert.equal(review.checklist.logo_levelup_kota.status, 'ada')
assert.equal(review.checklist.logo_pphtgd.status, 'tidak_jelas')
assert.equal(review.checklist.typo.status, 'ada')
assert.equal(review.sosial_media[0].handle, 'levelup.ngawi')
assert.equal(review.temuan[0], 'Logo kiri atas')
assert.equal(review.expected_match.waktu, null)
assert.equal(review.expected_match.pembicara, false)

const fields = flyerQaTelegramFields(review)
assert.equal(fields['QA flyer'], 'REVISI')
assert.ok(fields['Temuan']?.includes('Logo kiri atas'))
assert.ok(fields['Typo']?.includes('Connect With US'))

assert.equal(parseFlyerQa(''), null)
assert.equal(parseFlyerQa('not-json'), null)
const rec = parseFlyerQa(stringifyFlyerQa({
  state: 'done',
  agentId: 'bc-1',
  runId: 'run-1',
  review,
  diajukan: false,
  diajukanAt: null,
  error: null,
}))
assert.equal(rec?.state, 'done')
assert.equal(rec?.agentId, 'bc-1')
assert.equal(rec?.review?.status, 'REVISI')

assert.equal(parseFlyerQaReview({ status: 'NOPE' }), null)

assert.equal(flyerQaReviewingStep(0), FLYER_QA_REVIEWING_STEPS[0])
assert.equal(flyerQaReviewingStep(4_000), FLYER_QA_REVIEWING_STEPS[1])
assert.equal(flyerQaReviewingStep(8_000), 'Sedang membaca flyer…')
assert.equal(
  flyerQaReviewingStep(FLYER_QA_REVIEWING_STEPS.length * 4_000),
  FLYER_QA_REVIEWING_STEPS[0],
)

console.log('flyer-qa.check: ok')
