'use client'
// Replaces lib/alk-auth (requireAlkPengurus) and the data fetching that the real Sekretariat server pages do.
import { useRouter } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { LABEL } from '@/components/pwa/paper-ui'
import { AlkShell } from './clone/alk-v2/shell'
import { snapshot, subscribe, type DemoDb } from './db'

export type AlkPengurus = { id_pengurus: number; nama: string; username: string; kotalevelup: string; cabang: string; namaCabang: string; isNasional: false }

function pengurusOf(db: DemoDb | null): AlkPengurus | null {
  const p = db?.pengurus.find((x) => x.id_pengurus === db.session.idPengurus && x.divisi === 'alk')
  if (!db || !p) return null
  return {
    id_pengurus: p.id_pengurus,
    nama: p.nama,
    username: p.username,
    kotalevelup: p.kotalevelup,
    cabang: p.kotalevelup,
    namaCabang: db.cabang.find((c) => String(c.id_cabang) === p.kotalevelup)?.namacabang ?? p.kotalevelup,
    isNasional: false,
  }
}

export function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className={`${LABEL} text-[12px] text-[#57534e]`}>Memuat...</p>
    </main>
  )
}

export function AlkGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const db = useSyncExternalStore(subscribe, snapshot, () => null)
  const ok = !!pengurusOf(db)
  useEffect(() => {
    if (db && !ok) router.replace('/demo-preview/login')
  }, [db, ok, router])
  if (!ok) return <Loading />
  return <AlkShell>{children}</AlkShell>
}

export function useAlk(): AlkPengurus | null {
  return pengurusOf(useSyncExternalStore(subscribe, snapshot, () => null))
}

/** Runs `load` once after mount (the real pages are server components rendered fresh on every visit). */
export function useLoad<T>(load: () => Promise<T>): T | undefined {
  const [value, setValue] = useState<T>()
  useEffect(() => {
    let live = true
    load().then((v) => live && setValue(v))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return value
}
