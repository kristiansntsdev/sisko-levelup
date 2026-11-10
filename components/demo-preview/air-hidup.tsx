'use client'
// Demo containers for Air Hidup: read the localStorage store + session and feed the real components in components/air-hidup.
import { useEffect, useState, useSyncExternalStore } from 'react'
import { AirBerandaPanel, AirPopup, popupText } from '@/components/air-hidup/beranda-panel'
import { KabarTerbaru } from '@/components/air-hidup/feed'
import { PaperToast } from '@/components/pwa/paper-ui'
import type { AirStage, KotaAir } from '@/lib/air-hidup'
import { snapshot, subscribe } from './db'
import { getAirHidupFeed, getAirKotaSaya, tandaiPopup, toggleAmin } from './shim/actions/air-hidup'

export const AIR_FEED = '/demo-preview/dashboard/air-hidup'
export const AIR_PIC = '/demo-preview/dashboard/pic'
export const AIR_LAPOR = '/demo-preview/dashboard/pic/lapor'
export const AIR_LANDING = '/demo-preview/landing'

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

type Mine = { kota: KotaAir; isPic: boolean; popup: AirStage | null }

/** Panel + pop-up in the demo Beranda. Renders nothing for Tamu, Volunteer and Squad (Kabar Terbaru is separate: AirKabarDemo). */
export function AirBerandaDemo() {
  const mine = useAir<Mine | null>(getAirKotaSaya)
  const [toast, setToast] = useState<string | null>(null)
  if (!mine) return null

  async function ajak() {
    const text = popupText(mine!.kota.namaKota)
    try {
      await navigator.clipboard.writeText(text)
      setToast('Pesan disalin. Kirim ke PIC-mu lewat WhatsApp.')
    } catch {
      setToast('Salin manual: ' + text)
    }
    setTimeout(() => setToast(null), 3200)
    await tandaiPopup(mine!.popup!)
  }

  return (
    <>
      <AirBerandaPanel kota={mine.kota} isPic={mine.isPic} feedHref={AIR_FEED} picHref={AIR_PIC} />
      {mine.popup && <AirPopup kota={mine.kota} isPic={mine.isPic} laporHref={AIR_LAPOR} onClose={() => tandaiPopup(mine.popup!)} onAjak={ajak} />}
      <PaperToast msg={toast} />
    </>
  )
}

/** Kabar Terbaru in the demo Beranda: every member, whatever the level, can read and hit Amin. */
export function AirKabarDemo() {
  const feed = useAir(getAirHidupFeed)
  if (!feed) return null
  return <KabarTerbaru laporan={feed.laporan.slice(0, 3)} onAmin={(id) => void toggleAmin(id)} action={{ href: AIR_FEED, label: 'Semua' }} />
}
