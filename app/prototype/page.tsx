import { PrototypeApp } from '@/components/prototype/prototype-app'
import { isScreen } from '@/components/prototype/screens'

// Clickable UI prototype (PWA Anggota + ALK) — dummy data, no auth. ?s=<screen> opens a screen directly
export default async function PrototypePage({ searchParams }: { searchParams: Promise<{ s?: string | string[] }> }) {
  const { s } = await searchParams
  return <PrototypeApp initial={isScreen(s) ? s : 'login'} />
}
