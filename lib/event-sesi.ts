/** Multi-sesi absen helpers (Sekretariat nasional). */

export type EventSesiInput = {
  id_sesi?: number
  nama: string
  tanggal: string // YYYY-MM-DD
  jam_mulai: string
  jam_selesai: string
  wajib: boolean
}

export type EventSesiRow = {
  id_sesi: number
  id_event: number
  nama: string
  tanggal: string // YYYY-MM-DD
  jam_mulai: string
  jam_selesai: string
  wajib: boolean
  urutan: number
}

/** Sesi IDs that count toward "hadir lengkap". */
export function sesiWajibIds(sesi: { id_sesi: number; wajib: boolean }[]): number[] {
  return sesi.filter((s) => s.wajib).map((s) => s.id_sesi)
}

/**
 * Hadir lengkap = absen di setiap sesi wajib.
 * Jika tidak ada sesi wajib, setiap peserta yang punya ≥1 absen dianggap lengkap.
 */
export function hadirPenuh(
  absenSesiIds: Iterable<number | null | undefined>,
  wajibIds: number[],
): boolean {
  if (wajibIds.length === 0) {
    for (const id of absenSesiIds) {
      if (id != null) return true
    }
    return false
  }
  const have = new Set<number>()
  for (const id of absenSesiIds) {
    if (id != null) have.add(id)
  }
  return wajibIds.every((id) => have.has(id))
}

/** Duplicate key for app-level uniqueness check. */
export function absenDuplicateWhere(
  idPeserta: number,
  idEvent: number,
  idSesi: number | null | undefined,
):
  | { id_peserta_int: number; id_sesi: number }
  | {
      OR: [
        { id_peserta: string; id_event: string; id_sesi: null },
        { id_peserta_int: number; id_event_int: number; id_sesi: null },
      ]
    } {
  if (idSesi != null) {
    return { id_peserta_int: idPeserta, id_sesi: idSesi }
  }
  return {
    OR: [
      { id_peserta: String(idPeserta), id_event: String(idEvent), id_sesi: null },
      { id_peserta_int: idPeserta, id_event_int: idEvent, id_sesi: null },
    ],
  }
}

/** Calendar YYYY-MM-DD from a @db.Date (UTC midnight). Never use toISOString().slice(0,10). */
export function isoDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse form YYYY-MM-DD as UTC midnight so server-action JSON does not shift WIB→UTC day. */
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function toEventSesiRow(r: {
  id_sesi: number
  id_event: number
  nama: string
  tanggal: Date
  jam_mulai: string
  jam_selesai: string
  wajib: boolean
  urutan: number
}): EventSesiRow {
  return {
    id_sesi: r.id_sesi,
    id_event: r.id_event,
    nama: r.nama,
    tanggal: isoDate(r.tanggal),
    jam_mulai: r.jam_mulai,
    jam_selesai: r.jam_selesai,
    wajib: r.wajib,
    urutan: r.urutan,
  }
}
