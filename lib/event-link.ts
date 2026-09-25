/** Entry point yang dituju QR / linkevent, dipilih dari jenis event. */

export function isOnlineEvent(jenisevent: string | null | undefined): boolean {
  return (jenisevent ?? '').trim().toLowerCase() === 'online'
}

/**
 * Event Online → halaman absen sekali-scan (`/absen/{id}`): login, registrasi,
 * dan absen jadi satu langkah. Offline tetap ke poster + tombol Join.
 */
export function eventEntryPath(idEvent: number, jenisevent: string | null | undefined): string {
  return isOnlineEvent(jenisevent) ? `/absen/${idEvent}` : `/join/${idEvent}`
}

// ponytail: assert-based self-check — QR salah arah = peserta gagal absen
if (process.env.NODE_ENV !== 'production') {
  console.assert(isOnlineEvent('Online'), 'Online terdeteksi')
  console.assert(isOnlineEvent(' online '), 'Online case/space insensitive')
  console.assert(!isOnlineEvent('Offline'), 'Offline bukan online')
  console.assert(!isOnlineEvent(null), 'null bukan online')
  console.assert(eventEntryPath(7, 'Online') === '/absen/7', 'online → /absen')
  console.assert(eventEntryPath(7, 'Offline') === '/join/7', 'offline → /join')
}
