/** Shared path constants — no 'use client' so server actions can import. */
export const ALK_BASE = '/dashboard/v2/kota/alk'
export const ALK_EVENT_BASE = `${ALK_BASE}/event`

export function roleToDivisi(role: 'Admin LK' | 'BRIM'): string {
  return role === 'BRIM' ? 'brim' : 'alk'
}

export function divisiToRole(divisi: string | null): 'Admin LK' | 'BRIM' {
  return divisi === 'brim' ? 'BRIM' : 'Admin LK'
}
