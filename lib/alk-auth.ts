import { redirect } from 'next/navigation'
import { getPengurusFromCookie } from '@/lib/pengurus-session'
import { isNasionalAdmin, resolveEventCabang } from '@/lib/event-cabang'

export type AlkPengurus = {
  id_pengurus: number
  nama: string
  username: string
  divisi: string | null
  kotalevelup: string
  cabang: string
  isNasional: boolean
}

/** Cookie + divisi=alk gate for /dashboard/v2/kota/alk. Redirects on failure. */
export async function requireAlkPengurus(): Promise<AlkPengurus> {
  const pengurus = await getPengurusFromCookie()
  if (!pengurus || pengurus.divisi !== 'alk') redirect('/admin')
  const isNasional = isNasionalAdmin(pengurus.username)
  return {
    id_pengurus: pengurus.id_pengurus,
    nama: pengurus.nama,
    username: pengurus.username,
    divisi: pengurus.divisi,
    kotalevelup: pengurus.kotalevelup,
    cabang: resolveEventCabang(pengurus),
    isNasional,
  }
}
