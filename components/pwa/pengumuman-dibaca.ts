'use client'
import { useCallback, useMemo, useSyncExternalStore } from 'react'

/**
 * Status "sudah dibaca" pengumuman, per HP per akun (localStorage), seperti pphtgd.
 * `siap` false saat render server / hidrasi pertama: anggap semua sudah dibaca supaya titik merah tidak berkedip.
 */
const EVT = 'levelup-pengumuman-dibaca'
const MAKS = 300
const kunciStorage = (pembaca: string) => `levelup-pengumuman-dibaca:${pembaca}`

function baca(k: string): string {
  try {
    return localStorage.getItem(k) ?? ''
  } catch {
    return ''
  }
}

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb)
  window.addEventListener(EVT, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(EVT, cb)
  }
}

export function useDibaca(pembaca: string | null) {
  const k = pembaca ? kunciStorage(pembaca) : null
  const raw = useSyncExternalStore(
    subscribe,
    () => (k ? baca(k) : ''),
    () => null,
  )
  const dibaca = useMemo(() => {
    if (!raw) return new Set<number>()
    try {
      return new Set<number>((JSON.parse(raw) as unknown[]).map(Number).filter(Number.isFinite))
    } catch {
      return new Set<number>()
    }
  }, [raw])

  const tandai = useCallback(
    (ids: number[]) => {
      if (!k || !ids.length) return
      const lama = baca(k)
      let set: number[] = []
      try {
        set = lama ? (JSON.parse(lama) as number[]) : []
      } catch {
        set = []
      }
      const gabung = [...new Set([...ids, ...set])].slice(0, MAKS)
      try {
        localStorage.setItem(k, JSON.stringify(gabung))
      } catch {
        return
      }
      window.dispatchEvent(new Event(EVT))
    },
    [k],
  )

  return { siap: raw !== null, dibaca, tandai }
}
