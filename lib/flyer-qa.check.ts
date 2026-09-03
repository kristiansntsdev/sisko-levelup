import assert from 'node:assert/strict'
import {
  extractJsonObject,
  flyerQaReviewingStep,
  flyerQaTelegramBanner,
  flyerQaTelegramFields,
  formatFlyerExpectedTanggal,
  FLYER_QA_REVIEWING_STEPS,
  needsFlyerReview,
  needsWfeFlyerReview,
  skipsAiQa,
  parseFlyerQa,
  parseFlyerQaReview,
  stringifyFlyerQa,
} from './flyer-qa'

assert.equal(needsFlyerReview('bulanan', 'https://blob.example/a.png'), true)
assert.equal(needsFlyerReview('jfe', 'https://blob.example/a.png'), false)
assert.equal(needsFlyerReview('nasional', 'https://blob.example/a.png'), false)
assert.equal(needsFlyerReview('bulanan', ''), false)
assert.equal(needsWfeFlyerReview('jfe', 'https://blob.example/a.png', 'https://blob.example/t.png'), true)
assert.equal(needsWfeFlyerReview('jfe', 'https://blob.example/a.png', ''), false)
assert.equal(needsWfeFlyerReview('bulanan', 'https://blob.example/a.png', 'https://blob.example/t.png'), false)
assert.equal(needsWfeFlyerReview('nasional', 'https://blob.example/a.png', 'https://blob.example/t.png'), false)
assert.equal(skipsAiQa('nasional'), true)
assert.equal(skipsAiQa('bulanan'), false)

assert.equal(formatFlyerExpectedTanggal(new Date(2026, 7, 22)), '22 Agustus 2026')

const fenced = '```json\n{"mode":"jfe","status":"REVISI","kota":"Ngawi","nama_kegiatan":"We Worship","file_url":"https://x","template_url":"https://t","dimensi":{"width":1080,"height":1350,"rasio":"4:5","sesuai_standar":true,"detail":"ok"},"checklist":{"logo_pphtgd_kiri_atas":{"status":"ada","detail":"ok","posisi":"kiri_atas","teks":null},"logo_levelup_kanan_atas":{"status":"ada","detail":"ok","posisi":"kanan_atas","teks":"LevelUP NGAWI"},"nama_kegiatan":{"status":"ada","detail":"","posisi":"tengah","teks":"WE WORSHIP"},"tanggal_kegiatan":{"status":"mismatch","detail":"beda","posisi":null,"teks":"25 Juli"},"tempat_alamat_kegiatan":{"status":"ada","detail":"","posisi":null,"teks":"GKI"},"waktu_kegiatan":{"status":"ada","detail":"","posisi":null,"teks":"09:00"},"layout_pusat":{"status":"ada","detail":"sama","posisi":null,"teks":null},"elemen_tetap":{"status":"mismatch","detail":"chrome diubah","posisi":null,"teks":null},"typo":{"status":"bersih","detail":"","posisi":null,"teks":null}},"typo_list":[],"temuan":["Chrome beda"],"rekomendasi":["Ikuti flyer pusat"],"expected_match":{"nama_kegiatan":true,"tanggal":false,"waktu":true,"tempat":true}}\n```'
const extracted = extractJsonObject(fenced)
const review = parseFlyerQaReview(extracted)
assert.ok(review)
assert.equal(review.status, 'REVISI')
assert.equal(review.mode, 'jfe')
assert.equal(review.nama_kegiatan, 'We Worship')
assert.equal(review.checklist.logo_pphtgd_kiri_atas.posisi, 'kiri_atas')
assert.equal(review.checklist.layout_pusat.status, 'ada')
assert.equal(review.checklist.elemen_tetap.status, 'mismatch')
assert.equal(review.dimensi?.sesuai_standar, true)
assert.equal(review.expected_match.tanggal, false)
assert.equal(review.temuan[0], 'Chrome beda')

const bulanan = parseFlyerQaReview({
  status: 'PASS',
  kota: 'Ngawi',
  nama_kegiatan: 'WW',
  file_url: 'https://x',
  checklist: {
    logo_pphtgd_kiri_atas: { status: 'ada', detail: '', posisi: 'kiri_atas', teks: null },
    logo_levelup_kanan_atas: { status: 'ada', detail: '', posisi: 'kanan_atas', teks: 'LevelUP NGAWI' },
    nama_kegiatan: { status: 'ada', detail: '', posisi: 'tengah', teks: 'WW' },
    tanggal_kegiatan: { status: 'ada', detail: '', posisi: null, teks: '22 Agustus' },
    tempat_alamat_kegiatan: { status: 'ada', detail: '', posisi: null, teks: 'GKI' },
    waktu_kegiatan: { status: 'ada', detail: '', posisi: null, teks: '09:00' },
    typo: { status: 'bersih', detail: '', posisi: null, teks: null },
  },
  typo_list: [],
  temuan: [],
  rekomendasi: [],
  expected_match: { nama_kegiatan: true, tanggal: true, waktu: true, tempat: true },
})
assert.ok(bulanan)
assert.equal(bulanan.mode, 'bulanan')
assert.equal(bulanan.checklist.layout_pusat.detail, 'tidak berlaku')

const fields = flyerQaTelegramFields(review)
assert.equal(fields['QA flyer'], 'REVISI')
assert.equal(flyerQaTelegramBanner('REVISI'), '🚨🚨🚨 Butuh Revisi 🚨🚨🚨')
assert.equal(flyerQaTelegramBanner('PASS'), undefined)

assert.equal(parseFlyerQa(''), null)
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
assert.equal(rec?.review?.mode, 'jfe')

assert.equal(parseFlyerQaReview({ status: 'NOPE' }), null)
assert.equal(flyerQaReviewingStep(0), FLYER_QA_REVIEWING_STEPS[0])
assert.equal(flyerQaReviewingStep(4_000), FLYER_QA_REVIEWING_STEPS[1])

console.log('flyer-qa.check: ok')
