/** Entry point yang dituju QR / linkevent. */

export function isOnlineEvent(jenisevent: string | null | undefined): boolean {
  return (jenisevent ?? '').trim().toLowerCase() === 'online'
}

/**
 * Semua event (Online juga) → View Event + Get Ticket (`/join/{id}`). Tiket
 * masuk My Tickets; event Online diabsen dari tombol Absen Event di tiket.
 * `/absen/{id}` (daftar + absen sekali scan) hanya untuk QR lama yang sudah tersebar.
 */
export function eventEntryPath(idEvent: number): string {
  return `/join/${idEvent}`
}

// ponytail: assert-based self-check — QR salah arah = peserta gagal dapat tiket
if (process.env.NODE_ENV !== 'production') {
  console.assert(isOnlineEvent('Online'), 'Online terdeteksi')
  console.assert(isOnlineEvent(' online '), 'Online case/space insensitive')
  console.assert(!isOnlineEvent('Offline'), 'Offline bukan online')
  console.assert(!isOnlineEvent(null), 'null bukan online')
  console.assert(eventEntryPath(7) === '/join/7', 'semua event → /join')
}
