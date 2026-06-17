'use server'

import { db } from '@/lib/db'

const KOTA_LEVELUP_ID = '2'

export async function getKotaLogo(): Promise<string | null> {
  try {
    const row = await db.pengaturan_kota.findUnique({
      where: { kotalevelup: KOTA_LEVELUP_ID },
      select: { logo: true },
    })
    return row?.logo?.trim() || null
  } catch {
    return null
  }
}
