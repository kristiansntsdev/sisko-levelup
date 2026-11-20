'use server'
import { pembacaSaatIni } from '@/lib/push/pembaca'
import { pengumumanUntuk, type PengumumanAnggota } from '@/lib/push/pengumuman'

/** Pengumuman untuk yang sedang login (lonceng Beranda). Hanya yang ditujukan ke sesi ini; null = belum login. */
export async function getPengumumanSaya(): Promise<{ pembaca: string; items: PengumumanAnggota[] } | null> {
  const pembaca = await pembacaSaatIni()
  if (!pembaca) return null
  return { pembaca: pembaca.kunci, items: await pengumumanUntuk(pembaca, 20) }
}
