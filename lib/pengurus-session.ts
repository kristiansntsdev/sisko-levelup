import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export function pengurusDest(divisi: string | null | undefined): string | null {
  if (divisi === 'alk') return '/dashboard/v2/kota/alk'
  if (divisi === 'brim') return '/dashboard/kota/brim'
  if (divisi === 'vol') return '/dashboard/kota/vol'
  return null
}

export async function setPengurusCookie(idPengurus: number) {
  const cookieStore = await cookies()
  cookieStore.set('pengurus_id', String(idPengurus), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 8,
  })
}

export async function clearPengurusCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('pengurus_id')
}

export async function getPengurusFromCookie() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('pengurus_id')?.value
  if (!raw) return null
  const id = Number(raw)
  if (!Number.isFinite(id)) return null
  return db.pengurus.findUnique({
    where: { id_pengurus: id },
    select: {
      id_pengurus: true,
      nama: true,
      username: true,
      divisi: true,
      kotalevelup: true,
    },
  })
}
