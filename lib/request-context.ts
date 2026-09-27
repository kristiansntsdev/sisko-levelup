import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Identitas "siapa yang melakukan" untuk audit log (lib/audit-log.ts).
 * Diisi lewat setActor() di titik-titik yang sudah resolve cookie
 * pengurus_id / session peserta (requireXxx() dsb) — bukan dibaca ulang
 * dari sini, supaya modul ini tetap daun murni (tidak import next/headers
 * atau auth.ts) dan aman dipakai dari lib/db.ts tanpa circular import.
 */
export type Actor = {
  type: 'pengurus' | 'peserta' | 'system' | 'unknown'
  id: number | null
  label: string | null
  actionLabel?: string
}

const UNKNOWN_ACTOR: Actor = { type: 'unknown', id: null, label: null }

const als = new AsyncLocalStorage<Actor>()

/**
 * enterWith() (bukan run()) — dipanggil di tengah fungsi action yang sudah
 * berjalan, supaya tidak perlu membungkus ulang sisa badan fungsi dalam
 * callback. Berlaku untuk continuation saat ini dan semua yang di-await
 * setelahnya.
 */
export function setActor(actor: Actor): void {
  als.enterWith(actor)
}

export function setActionLabel(label: string): void {
  als.enterWith({ ...(als.getStore() ?? UNKNOWN_ACTOR), actionLabel: label })
}

export function getActor(): Actor {
  return als.getStore() ?? UNKNOWN_ACTOR
}
