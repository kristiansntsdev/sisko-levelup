import assert from 'node:assert/strict'
import { resolveEventPosterUrl } from './event-poster'

const POSTER_BASE = 'https://sisko.levelupgen.com/uploads/poster/'

assert.equal(
  resolveEventPosterUrl('flyer.jpg', 'https://blob.example/a.png'),
  `${POSTER_BASE}flyer.jpg`,
)
assert.equal(
  resolveEventPosterUrl('https://cdn.example/p.jpg', 'https://blob.example/a.png'),
  'https://cdn.example/p.jpg',
)
assert.equal(
  resolveEventPosterUrl('', 'https://blob.example/a.png'),
  'https://blob.example/a.png',
)
assert.equal(resolveEventPosterUrl('  ', '  https://blob.example/a.png  '), 'https://blob.example/a.png')
assert.equal(resolveEventPosterUrl('', ''), '')
assert.equal(resolveEventPosterUrl(null, null), '')
assert.equal(resolveEventPosterUrl(undefined, undefined), '')

console.log('event-poster.check: ok')
