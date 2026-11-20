'use client'
import { useSyncExternalStore } from 'react'

/**
 * Waktu dalam zona HP / laptop pembaca (WIB, WITA, WIT, …). Render server + hidrasi pertama memakai WIB,
 * lalu langsung diganti format zona perangkat, tanpa hydration mismatch.
 */
const GAYA = {
  pendek: { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  panjang: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' },
} satisfies Record<string, Intl.DateTimeFormatOptions>

export type GayaWaktu = keyof typeof GAYA

export function formatWaktu(ms: number, gaya: GayaWaktu = 'pendek', timeZone?: string): string {
  return new Date(ms).toLocaleString('id-ID', { ...GAYA[gaya], ...(timeZone ? { timeZone } : {}) })
}

const tanpaLangganan = () => () => {}

export function Waktu({ ms, gaya = 'pendek', className }: { ms: number; gaya?: GayaWaktu; className?: string }) {
  const teks = useSyncExternalStore(
    tanpaLangganan,
    () => formatWaktu(ms, gaya),
    () => formatWaktu(ms, gaya, 'Asia/Jakarta'),
  )
  return (
    <time dateTime={new Date(ms).toISOString()} className={className}>
      {teks}
    </time>
  )
}
