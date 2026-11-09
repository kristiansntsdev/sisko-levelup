import assert from 'node:assert/strict'
import { excerpt, slugify } from './artikel'
import { artikelImageUrls, sanitizeArtikelHtml } from './artikel-html'

assert.equal(slugify('Revival Dimulai dari Anak Muda!'), 'revival-dimulai-dari-anak-muda')
assert.equal(slugify('  Café & Doa  '), 'cafe-dan-doa')
assert.equal(slugify('!!!'), 'artikel')

const dirty =
  '<p onclick="x()">Halo <script>alert(1)</script><a href="javascript:alert(1)">klik</a> ' +
  '<a href="https://a.id" target="_blank">ok</a></p>' +
  '<img src="data:image/png;base64,AAAA"><img src="https://x.blob.vercel-storage.com/a.webp" onerror="x()">' +
  '<iframe src="https://evil.com/embed/1"></iframe>' +
  '<iframe src="https://www.youtube.com/embed/abc"></iframe>' +
  '<p style="text-align:center;position:fixed">rata</p>'
const clean = sanitizeArtikelHtml(dirty)
assert.ok(!clean.includes('<script'), 'script dibuang')
assert.ok(!clean.includes('onclick') && !clean.includes('onerror'), 'event handler dibuang')
assert.ok(!clean.includes('javascript:'), 'javascript: dibuang')
assert.ok(!clean.includes('data:image'), 'data: image dibuang')
assert.ok(!clean.includes('evil.com'), 'iframe non-YouTube dibuang')
assert.ok(clean.includes('youtube.com/embed/abc'), 'YouTube dipertahankan')
assert.ok(clean.includes('x.blob.vercel-storage.com/a.webp'), 'gambar https dipertahankan')
assert.ok(clean.includes('rel="noopener noreferrer"'), 'rel ditambahkan')
assert.ok(clean.includes('text-align:center') && !clean.includes('position'), 'style dibatasi')
assert.deepEqual(artikelImageUrls(clean), ['https://x.blob.vercel-storage.com/a.webp'])

assert.equal(excerpt('<p>Halo <b>dunia</b></p>'), 'Halo dunia')
assert.ok(excerpt('<p>' + 'kata '.repeat(200) + '</p>', 50).length <= 50)

console.log('artikel.check ok')
