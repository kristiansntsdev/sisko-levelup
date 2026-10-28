/** Event nasional (wwtype) — Get Ticket butuh approve Sekretariat Nasional. */
export function needsNasionalTicketApproval(wwtype: string | null | undefined): boolean {
  return wwtype === 'nasional'
}

/**
 * Status baru saat Get Ticket / re-ajukan.
 * Live ticket (confirmed/attend/absence/pending) tidak diubah di sini — caller keep.
 */
export function ticketStatusOnRequest(wwtype: string | null | undefined): 'pending' | 'confirmed' {
  return needsNasionalTicketApproval(wwtype) ? 'pending' : 'confirmed'
}

/** Absen/scan event nasional hanya setelah tiket confirmed (atau absence auto). */
export function canAbsenNasionalTicket(
  status: string | null | undefined,
): boolean {
  return status === 'confirmed' || status === 'absence' || status === 'attend'
}
