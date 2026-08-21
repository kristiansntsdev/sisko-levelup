import assert from 'node:assert/strict'
import { appendNotenasional, formatNasionalRejectLine } from './event-approval'

assert.equal(
  formatNasionalRejectLine('alk', ' flyer kurang jelas '),
  'ALK Nasional : flyer kurang jelas',
)
assert.equal(
  formatNasionalRejectLine('brim', 'logo salah'),
  'Brim Nasional: logo salah',
)

assert.equal(
  appendNotenasional('', 'alk', 'kurang target'),
  'ALK Nasional : kurang target',
)
assert.equal(
  appendNotenasional('ALK Nasional : kurang target', 'brim', 'warna off'),
  'ALK Nasional : kurang target\nBrim Nasional: warna off',
)

console.log('event-approval.check: ok')
