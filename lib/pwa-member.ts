/** userlevel string → display labels (0 Tamu · 1 Volunteer · 2 Squad · 3 Core · 4 PIC · 5 LevelUP Pusat) */
export const USERLEVEL_LABEL: Record<string, string> = {
  '0': 'Tamu',
  '1': 'Volunteer',
  '2': 'Squad',
  '3': 'Core',
  '4': 'PIC',
  '5': 'LevelUP Pusat',
}

export const USERLEVEL_TIER: Record<string, string> = {
  '0': 'TAMU',
  '1': 'VOLUNTEER',
  '2': 'SQUAD',
  '3': 'CORE',
  '4': 'PIC',
  '5': 'LEVELUP PUSAT',
}

export const LEVEL_STEPS: [string, string][] = [
  ['0', 'Tamu'],
  ['1', 'Volunteer'],
  ['2', 'Squad'],
  ['3', 'Core'],
]

export type MemberCardData = {
  no: string
  name: string
  gender: string
  pob: string
  dob: string
  church: string
  city: string
  tier: string
  photo?: string
}

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

/** peserta.tgllahir is free text: ISO from the date input, d/m/yyyy in legacy rows. Null when it is neither. */
export function parseDob(raw: string): { short: string; long: string } | null {
  const s = raw.trim()
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  const legacy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  const [y, mo, d] = iso ? [iso[1], iso[2], iso[3]] : legacy ? [legacy[3], legacy[2], legacy[1]] : []
  if (!y || !mo || !d) return null
  const month = Number(mo)
  const day = Number(d)
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const dd = d.padStart(2, '0')
  return { short: `${dd}.${mo.padStart(2, '0')}.${y}`, long: `${dd} ${BULAN[month - 1]} ${y}` }
}

export function memberCardFromPeserta(p: {
  usercode: string
  nama: string
  gender: string
  tempatlahir: string
  tgllahir: string
  gereja: string
  kotaName: string
  userlevel: string
  foto: string
}): MemberCardData {
  return {
    no: p.usercode || '—',
    name: p.nama,
    gender: p.gender === 'P' || p.gender === 'Perempuan' ? 'P' : 'L',
    pob: p.tempatlahir || '—',
    dob: p.tgllahir || '—',
    church: p.gereja || '—',
    city: p.kotaName || '—',
    tier: USERLEVEL_TIER[p.userlevel] ?? 'TAMU',
    // Uploaded photos are full Blob URLs. Legacy rows hold a bare filename that doesn't resolve here.
    photo: p.foto.startsWith('https://') ? p.foto : undefined,
  }
}
