import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pengumuman · LevelUP', robots: { index: false, follow: false } }

export default function PengumumanLayout({ children }: { children: React.ReactNode }) {
  return children
}
