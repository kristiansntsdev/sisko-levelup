'use client'
import { SessionProvider } from 'next-auth/react'
import { PushBridge } from '@/components/pwa/push-bridge'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PushBridge />
      {children}
    </SessionProvider>
  )
}
