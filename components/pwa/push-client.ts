'use client'
/** Helper Web Push di browser: service worker, langganan, deteksi perangkat. Tanpa React. */

export const SW_URL = '/sw.js'
export const BADGE_CACHE = 'push-badge'
export const OPEN_CACHE = 'push-open'

export function pushDidukung(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function deteksiPerangkat() {
  const ua = navigator.userAgent
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  // Hanya Safari yang punya "Tambah ke Layar Utama" dengan push di iOS; browser lain / in-app browser tidak bisa.
  const safari = ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line|WhatsApp/.test(ua)
  return { ios, standalone, safari }
}

export async function daftarkanSW(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register(SW_URL, { scope: '/', updateViaCache: 'none' })
  await navigator.serviceWorker.ready
  return reg
}

export async function ambilLangganan(): Promise<PushSubscription | null> {
  const reg = (await navigator.serviceWorker.getRegistration('/')) ?? (await daftarkanSW())
  return reg.pushManager.getSubscription()
}

export function b64uKeUint8(b64u: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (b64u.length % 4)) % 4)
  const raw = atob((b64u + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function resetBadge(): Promise<void> {
  try {
    const nav = navigator as Navigator & { clearAppBadge?: () => Promise<void> }
    await nav.clearAppBadge?.()
    if ('caches' in window) await (await caches.open(BADGE_CACHE)).put('count', new Response('0'))
  } catch {
    /* badge tidak wajib */
  }
}

/** Ambil sekali tujuan notifikasi yang diklik (disimpan SW), lalu hapus. */
export async function ambilTujuanPush(): Promise<string | null> {
  try {
    if (!('caches' in window)) return null
    const c = await caches.open(OPEN_CACHE)
    const r = await c.match('target')
    if (!r) return null
    await c.delete('target')
    const t = await r.text()
    return t.startsWith('/') && !t.startsWith('//') ? t : null
  } catch {
    return null
  }
}
