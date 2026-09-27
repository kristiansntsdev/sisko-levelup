'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LOGS_COOKIE, makeSessionCookieValue } from '@/lib/logs-auth'

export async function loginLogs(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const password = (formData.get('password') as string)?.trim()

  if (!process.env.LOG_PASSWORD) return { error: 'LOG_PASSWORD belum di-set di server.' }
  if (!password) return { error: 'Password wajib diisi.' }
  if (password !== process.env.LOG_PASSWORD) return { error: 'Password salah.' }

  const value = makeSessionCookieValue()
  if (!value) return { error: 'LOG_PASSWORD belum di-set di server.' }

  const cookieStore = await cookies()
  cookieStore.set(LOGS_COOKIE, value, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 8,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  redirect('/logs')
}

export async function logoutLogs() {
  const cookieStore = await cookies()
  cookieStore.delete(LOGS_COOKIE)
  redirect('/logs/login')
}
