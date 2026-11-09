import { redirect } from 'next/navigation'
import { getPengurusFromCookie } from '@/lib/pengurus-session'
import { isNasionalBrim } from '@/lib/event-cabang'
import { setActor } from '@/lib/request-context'
import { BRIM_LEGACY } from '@/components/brim-v2/paths'

export type BrimPengurus = {
  id_pengurus: number
  nama: string
  username: string
}

/** Cookie + divisi=brim + Brim Nasional gate for /dashboard/v2/brim. Redirects on failure. */
export async function requireBrimNasionalPage(): Promise<BrimPengurus> {
  const pengurus = await getPengurusFromCookie()
  if (!pengurus || pengurus.divisi !== 'brim') redirect('/admin')
  if (!isNasionalBrim(pengurus.username)) redirect(BRIM_LEGACY)
  return { id_pengurus: pengurus.id_pengurus, nama: pengurus.nama, username: pengurus.username }
}

/** Same gate for server actions / route handlers: no redirect, and records the actor for the audit log. */
export async function brimNasionalActor(): Promise<BrimPengurus | null> {
  const pengurus = await getPengurusFromCookie()
  if (!pengurus || pengurus.divisi !== 'brim' || !isNasionalBrim(pengurus.username)) return null
  setActor({ type: 'pengurus', id: pengurus.id_pengurus, label: pengurus.username })
  return { id_pengurus: pengurus.id_pengurus, nama: pengurus.nama, username: pengurus.username }
}
