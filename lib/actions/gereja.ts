'use server'
import { db } from '@/lib/db'

export async function searchGereja(query: string) {
  const rows = await db.gereja.findMany({
    where: query ? { nama_gereja: { contains: query } } : undefined,
    select: { id_gereja: true, nama_gereja: true, kabupaten: true },
    orderBy: { nama_gereja: 'asc' },
    take: 20,
  })
  return rows
}
