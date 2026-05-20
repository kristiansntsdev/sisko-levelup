'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

async function getPengurusKota() {
  const cookieStore = await cookies()
  const pengurusId = cookieStore.get('pengurus_id')?.value
  if (!pengurusId) return null

  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { kotalevelup: true, divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'brim') return null
  return pengurus
}

export async function savePengaturanKota(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const pengurus = await getPengurusKota()
  if (!pengurus) return { error: 'Akses ditolak' }

  const logo = (formData.get('logo') as string) ?? ''
  const instagram = (formData.get('instagram') as string) ?? ''
  const tiktok = (formData.get('tiktok') as string) ?? ''
  const facebook = (formData.get('facebook') as string) ?? ''
  const youtube = (formData.get('youtube') as string) ?? ''
  const twitter = (formData.get('twitter') as string) ?? ''

  await db.pengaturan_kota.upsert({
    where: { kotalevelup: pengurus.kotalevelup },
    create: { kotalevelup: pengurus.kotalevelup, logo, instagram, tiktok, facebook, youtube, twitter },
    update: { logo, instagram, tiktok, facebook, youtube, twitter },
  })

  revalidatePath('/dashboard/kota/brim')
  revalidatePath('/dashboard/kota/brim/pamflet')
  return { success: true }
}

export async function getPengaturanKota(kotalevelup: string) {
  return db.pengaturan_kota.findUnique({ where: { kotalevelup } })
}
