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
    // ponytail: skip peserta.foto until upload flow exists (legacy = bare filename, broken on PWA)
    photo: undefined,
  }
}
