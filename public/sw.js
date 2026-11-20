/* LevelUP service worker: hanya Web Push + badge ikon. Tanpa fetch handler dan tanpa cache halaman. */
const BADGE_CACHE = 'push-badge'
const OPEN_CACHE = 'push-open'

async function bumpBadge() {
  if (!('setAppBadge' in self.navigator)) return
  try {
    const c = await caches.open(BADGE_CACHE)
    const r = await c.match('count')
    const n = (r ? parseInt(await r.text(), 10) || 0 : 0) + 1
    await c.put('count', new Response(String(n)))
    await self.navigator.setAppBadge(n)
  } catch {}
}

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (e) => {
  let d = {}
  try {
    d = e.data ? e.data.json() : {}
  } catch {
    d = { body: e.data ? e.data.text() : '' }
  }
  // iOS mencabut izin kalau ada push yang tidak ditampilkan: selalu showNotification.
  e.waitUntil(
    Promise.all([
      self.registration.showNotification(d.title || 'LevelUP', d),
      bumpBadge(),
      self.clients.matchAll({ type: 'window' }).then((list) => list.forEach((w) => w.postMessage({ type: 'push-received' }))),
    ]),
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const raw = (e.notification.data && e.notification.data.url) || '/dashboard'
  let url
  try {
    url = new URL(raw, self.location.origin)
    if (url.origin !== self.location.origin) url = new URL('/dashboard', self.location.origin)
  } catch {
    url = new URL('/dashboard', self.location.origin)
  }
  const target = url.pathname + url.search
  e.waitUntil(
    (async () => {
      // PWA terpasang bisa membuka start_url alih-alih URL ini: simpan tujuan, halaman mengambilnya saat tampil.
      const c = await caches.open(OPEN_CACHE)
      await c.put('target', new Response(target))
      const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const win = list.find((w) => new URL(w.url).origin === self.location.origin)
      if (!win) return self.clients.openWindow(target)
      win.postMessage({ type: 'push-open', url: target })
      return win.focus()
    })(),
  )
})
