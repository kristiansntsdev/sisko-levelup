'use client'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'

  return (
    <main className="max-w-sm mx-auto min-h-screen bg-bg flex flex-col items-center justify-center px-6 gap-8">
      <div className="text-center">
        <img src="/logoutama.png" alt="LevelUp" className="h-14 mx-auto mb-6 object-contain" />
        <h1 className="text-xl font-semibold text-fg">Masuk ke Sisko</h1>
        <p className="text-sm text-muted mt-1">Gunakan akun Google kamu untuk melanjutkan</p>
      </div>

      <div className="w-full">
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          onClick={() => signIn('google', { callbackUrl })}
        >
          <span className="flex items-center justify-center gap-2">
            <GoogleIcon />
            Login By Google
          </span>
        </Button>
      </div>

      <button
        onClick={() => router.back()}
        className="text-sm text-muted hover:text-fg transition-colors"
      >
        ← Kembali
      </button>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}
