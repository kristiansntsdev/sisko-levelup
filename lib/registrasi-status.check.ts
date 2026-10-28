import assert from 'node:assert/strict'
import {
  canAbsenNasionalTicket,
  needsNasionalTicketApproval,
  ticketStatusOnRequest,
} from './registrasi-status'

assert.equal(needsNasionalTicketApproval('nasional'), true)
assert.equal(needsNasionalTicketApproval('bulanan'), false)
assert.equal(needsNasionalTicketApproval('jfe'), false)
assert.equal(needsNasionalTicketApproval(null), false)

assert.equal(ticketStatusOnRequest('nasional'), 'pending')
assert.equal(ticketStatusOnRequest('bulanan'), 'confirmed')
assert.equal(ticketStatusOnRequest('jfe'), 'confirmed')

assert.equal(canAbsenNasionalTicket('pending'), false)
assert.equal(canAbsenNasionalTicket('cancelled'), false)
assert.equal(canAbsenNasionalTicket(null), false)
assert.equal(canAbsenNasionalTicket('confirmed'), true)
assert.equal(canAbsenNasionalTicket('absence'), true)
assert.equal(canAbsenNasionalTicket('attend'), true)

console.log('registrasi-status.check: ok')
