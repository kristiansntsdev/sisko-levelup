'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { simpanPush } from '@/lib/actions/push'
import { ambilLangganan, ambilTujuanPush, pushDidukung, resetBadge } from './push-client'

/**
 * Dipasang sekali di Providers. Saat app dibuka: sinkron perangkat ke sesi saat ini (izin sudah granted),
 * reset angka badge ikon, dan buka tujuan notifikasi yang diklik. Tanpa izin push: tidak melakukan apa-apa.
 */
export function PushBridge() {
  const router = useRouter()
  const pathname = usePathname()
  const aktif = !pathname.startsWith('/demo-preview')

  useEffect(() => {
    if (!aktif || !pushDidukung()) return
    let batal = false

    const bukaTujuan = async () => {
      const t = await ambilTujuanPush()
      if (t && !batal && t !== window.location.pathname + window.location.search) router.push(t)
    }
    const saatTampil = () => {
      // Izin bisa baru diberikan setelah halaman dibuka, jadi dicek tiap kali, bukan sekali di awal.
      if (document.visibilityState !== 'visible' || Notification.permission !== 'granted') return
      void resetBadge()
      void bukaTujuan()
    }
    const saatPesan = (e: MessageEvent) => {
      const type = (e.data as { type?: string } | null)?.type
      if (type === 'push-open') void bukaTujuan()
      else if (type === 'push-received' && document.visibilityState === 'visible') void resetBadge()
    }

    void (async () => {
      try {
        if (Notification.permission !== 'granted') return
        const sub = await ambilLangganan()
        if (sub && !batal) {
          const j = sub.toJSON()
          await simpanPush({
            endpoint: sub.endpoint,
            p256dh: j.keys?.p256dh ?? '',
            auth: j.keys?.auth ?? '',
            encoding: PushManager.supportedContentEncodings?.[0] || 'aes128gcm',
            userAgent: navigator.userAgent,
          })
        }
      } catch {
        /* sesi belum ada / offline: coba lagi pada pembukaan berikutnya */
      }
    })()

    saatTampil()
    document.addEventListener('visibilitychange', saatTampil)
    navigator.serviceWorker.addEventListener('message', saatPesan)
    return () => {
      batal = true
      document.removeEventListener('visibilitychange', saatTampil)
      navigator.serviceWorker.removeEventListener('message', saatPesan)
    }
  }, [aktif, router])

  return null
}
