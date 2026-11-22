'use client'
// Demo helpers for Air Hidup: re-run a shim read whenever the localStorage store changes, and the demo route paths.
import { useEffect, useState, useSyncExternalStore } from 'react'
import { snapshot, subscribe } from './db'

export const AIR_BERANDA = '/demo-preview/dashboard'
export const AIR_FEED = '/demo-preview/dashboard/air-hidup'
export const AIR_PIC = '/demo-preview/dashboard/pic'
export const AIR_LAPOR = '/demo-preview/dashboard/pic/lapor'

/** Re-runs `load` whenever the demo store changes, the way revalidatePath re-renders the real page after a write. */
export function useAir<T>(load: () => Promise<T>): T | undefined {
  const db = useSyncExternalStore(subscribe, snapshot, () => null)
  const [value, setValue] = useState<T>()
  useEffect(() => {
    if (!db) return
    let live = true
    load().then((v) => live && setValue(v))
    return () => {
      live = false
    }
    // `load` is a module-level shim function; the store snapshot is the only real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db])
  return value
}
