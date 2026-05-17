'use client'
import { useActionState } from 'react'
import Image from 'next/image'
import { Button, Input } from '@/components/ui'
import { loginPengurus } from './actions'

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(loginPengurus, null)

  return (
    <main className="min-h-screen bg-bg pb-safe flex flex-col">

      <nav className="w-full sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-sm mx-auto px-5 pt-4 pb-4">
          <Image src="/logoutama.png" alt="LevelUp" width={96} height={32} className="h-8 w-auto object-contain" />
        </div>
      </nav>

      <div className="flex-1 max-w-sm mx-auto w-full px-5 py-10 flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-bold text-fg">Masuk Admin</h1>
          <p className="text-sm text-muted mt-1">Login menggunakan akun pengurus</p>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <Input
            label="Username"
            name="username"
            placeholder="username"
            autoComplete="username"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          {state?.error && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-[12px] border border-red/30 bg-red-light text-red text-sm font-medium">
              <span className="shrink-0 mt-px">⚠️</span>
              <span>{state.error}</span>
            </div>
          )}

          <Button type="submit" fullWidth size="lg" loading={pending}>
            Masuk
          </Button>
        </form>

      </div>
    </main>
  )
}
