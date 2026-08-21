/** Sekretariat nasional events use cabang 0 (not a kota branch). */
export const NASIONAL_EVENT_CABANG = '0'
export const NASIONAL_KHUSUS_VALUE = '1'

const NASIONAL_ADMIN_USERNAMES = new Set(['sekretariatnasional@gmail.com'])

export function isNasionalAdmin(username: string): boolean {
  return NASIONAL_ADMIN_USERNAMES.has(username.trim().toLowerCase())
}

export function resolveEventCabang(pengurus: {
  username: string
  kotalevelup: string
}): string {
  if (isNasionalAdmin(pengurus.username)) return NASIONAL_EVENT_CABANG
  return pengurus.kotalevelup
}

export type NasionalEventScope = 'seluruh_kota' | 'khusus'

export function khususFromScope(scope: NasionalEventScope): string {
  return scope === 'khusus' ? NASIONAL_KHUSUS_VALUE : ''
}

export function scopeFromKhusus(khusus: string): NasionalEventScope {
  return khusus === NASIONAL_KHUSUS_VALUE ? 'khusus' : 'seluruh_kota'
}
