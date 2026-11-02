import type { Metadata } from 'next'
import { DemoBar } from '@/components/demo-preview/demo-bar'

// Client-only demo of the whole LevelUP app: every screen is the real one, data lives in the visitor's localStorage.
export const metadata: Metadata = {
  title: 'Demo · LevelUP',
  description: 'Coba semua alur LevelUP tanpa akun asli — data tersimpan di browser ini saja',
  robots: { index: false, follow: false },
}

export default function DemoPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DemoBar />
    </>
  )
}
