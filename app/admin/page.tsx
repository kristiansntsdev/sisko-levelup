'use client'
import { useActionState } from 'react'
import { Button, Input } from '@/components/ui'
import { loginPengurus } from './actions'

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(loginPengurus, null)

  return (
    <main className="min-h-screen bg-bg pb-safe flex flex-col">

      <nav className="w-full sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-sm mx-auto px-5 pt-4 pb-4">
          <span className="text-sm font-medium text-muted">Panel Admin</span>
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
            <p className="text-sm text-red font-medium">{state.error}</p>
          )}

          <Button type="submit" fullWidth size="lg" loading={pending}>
            Masuk
          </Button>
        </form>

      </div>
    </main>
  )
}
