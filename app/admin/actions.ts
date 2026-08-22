'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

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

  const divisi = pengurus.divisi
  const dest =
    divisi === 'alk' ? '/dashboard/kota/alk'
    : divisi === 'brim' ? '/dashboard/kota/brim'
    : divisi === 'vol' ? '/dashboard/kota/vol'
    : null
  if (!dest) return { error: 'Divisi tidak dikenali.' }

  const cookieStore = await cookies()
  cookieStore.set('pengurus_id', String(pengurus.id_pengurus), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  redirect(dest)
}

export async function logoutPengurus() {
  const cookieStore = await cookies()
  cookieStore.delete('pengurus_id')
  redirect('/admin')
}
