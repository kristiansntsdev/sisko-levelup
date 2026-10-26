'use server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import {
  clearPengurusCookie,
  pengurusDest,
  setPengurusCookie,
} from '@/lib/pengurus-session'

export async function loginPengurus(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const username = (formData.get('username') as string)?.trim()
  const password = (formData.get('password') as string)?.trim()

  if (!username || !password) return { error: 'Username dan password wajib diisi.' }

  const pengurus = await db.pengurus.findFirst({
    where: { username, password },
  })

  if (!pengurus) return { error: 'Username atau password salah.' }

  const dest = pengurusDest(pengurus.divisi)
  if (!dest) return { error: 'Divisi tidak dikenali.' }

  await setPengurusCookie(pengurus.id_pengurus)
  redirect(dest)
}

export async function logoutPengurus() {
  await clearPengurusCookie()
  redirect('/admin')
}
