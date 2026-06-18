const ID_WEEKDAYS = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
]

const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function parseIsoDate(iso: string): Date | null {
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Format ISO date (YYYY-MM-DD) to "Sabtu tanggal 18 April 2026" */
export function fmtTownHallDate(iso: string): { hari: string; tanggal: string } {
  const d = parseIsoDate(iso)
  if (!d) return { hari: '—', tanggal: iso }
  return {
    hari: ID_WEEKDAYS[d.getDay()],
    tanggal: `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
  }
}

/** Format ISO date for letter header: "18 April 2026" */
export function fmtLetterDate(iso: string): string {
  const d = parseIsoDate(iso)
  if (!d) return iso
  return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
