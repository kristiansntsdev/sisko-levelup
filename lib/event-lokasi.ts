/** Multi-lokasi scan helpers (Sekretariat nasional). */

export type EventLokasiInput = {
  id_lokasi?: number
  nama: string
  alamat: string
  /** "lat,lng" */
  longlat: string
  radius: number
}

export type EventLokasiRow = {
  id_lokasi: number
  id_event: number
  nama: string
  alamat: string
  longlat: string
  radius: number
  urutan: number
}

export function toEventLokasiRow(r: {
  id_lokasi: number
  id_event: number
  nama: string
  alamat: string
  longlat: string
  radius: number
  urutan: number
}): EventLokasiRow {
  return {
    id_lokasi: r.id_lokasi,
    id_event: r.id_event,
    nama: r.nama,
    alamat: r.alamat,
    longlat: r.longlat,
    radius: r.radius,
    urutan: r.urutan,
  }
}

/** "lat,lng" -> point, or null when malformed. */
export function parseLatLng(s: string | null | undefined): { lat: number; lng: number } | null {
  if (!s) return null
  const parts = s.split(',').map((x) => Number(x.trim()))
  if (parts.length < 2 || parts.some((n) => !Number.isFinite(n))) return null
  return { lat: parts[0], lng: parts[1] }
}

/** Two or more lokasi need at least one sesi, otherwise nothing can be locked to a lokasi. */
export function lokasiNeedsSesi(lokasiCount: number, sesiCount: number): boolean {
  return lokasiCount >= 2 && sesiCount === 0
}
