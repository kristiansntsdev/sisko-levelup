import type { Metadata } from 'next'
import { Barlow_Semi_Condensed, Plus_Jakarta_Sans } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-proto',
  subsets: ['latin'],
  display: 'swap',
})

const barlow = Barlow_Semi_Condensed({
  variable: '--font-proto-card',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Prototype · LevelUP',
  description: 'Prototype PWA Anggota & ALK LevelUP',
  robots: { index: false, follow: false },
}

export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${jakarta.variable} ${barlow.variable} flex-1 flex flex-col`}>{children}</div>
}
