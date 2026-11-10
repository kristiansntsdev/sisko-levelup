'use client'
import { useEffect, useRef, useState } from 'react'
import { attachPlaceSearch, ensureGoogleMaps } from '@/lib/google-maps'
import { parseLatLng } from '@/lib/event-lokasi'

type Pos = { lat: number; lng: number }
type MapsMarker = { setPosition: (p: Pos) => void; addListener: (e: string, cb: () => void) => void; getPosition: () => { lat: () => number; lng: () => number } | null }

/**
 * Alamat input + small map with a draggable pin for one lokasi scan.
 * Without an API key it falls back to a plain "lat,lng" field.
 */
export function LokasiPinMap({
  apiKey,
  longlat,
  alamat,
  onChange,
  inputCls,
  mapCls,
}: {
  apiKey: string
  longlat: string
  alamat: string
  onChange: (next: { longlat?: string; alamat?: string }) => void
  inputCls: string
  mapCls: string
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const alamatRef = useRef<HTMLInputElement>(null)
  const onChangeRef = useRef(onChange)
  const [initial] = useState(() => parseLatLng(longlat))

  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    if (!apiKey) return
    let cancelled = false
    let detach: (() => void) | undefined
    void (async () => {
      try {
        await ensureGoogleMaps(apiKey)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = (window as any).google.maps
        await Promise.all([g.importLibrary('maps'), g.importLibrary('places')])
        if (cancelled || !mapRef.current) return
        const start: Pos = initial ?? { lat: -7.5, lng: 110.0 }
        const map = new g.Map(mapRef.current, {
          center: start,
          zoom: initial ? 15 : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        const marker: MapsMarker = new g.Marker({ position: start, map, draggable: true })
        const put = (p: Pos) => onChangeRef.current({ longlat: `${p.lat},${p.lng}` })
        marker.addListener('dragend', () => {
          const pos = marker.getPosition()
          if (pos) put({ lat: pos.lat(), lng: pos.lng() })
        })
        map.addListener('click', (e: { latLng: { lat: () => number; lng: () => number } }) => {
          const p = { lat: e.latLng.lat(), lng: e.latLng.lng() }
          marker.setPosition(p)
          put(p)
        })
        if (alamatRef.current) {
          detach = attachPlaceSearch(alamatRef.current, ({ address, lat, lng }) => {
            const p = { lat, lng }
            map.setCenter(p)
            map.setZoom(15)
            marker.setPosition(p)
            put(p)
            onChangeRef.current({ alamat: address })
          })
        }
      } catch {
        /* script/timeout — leave the grey box */
      }
    })()
    return () => {
      cancelled = true
      detach?.()
    }
  }, [apiKey, initial])

  return (
    <div className="space-y-2">
      <input
        ref={alamatRef}
        type="text"
        value={alamat}
        onChange={(e) => onChange({ alamat: e.target.value })}
        className={inputCls}
        placeholder="Cari atau ketik alamat lokasi..."
        autoComplete="off"
      />
      {apiKey ? (
        <div ref={mapRef} className={mapCls} />
      ) : (
        <input
          type="text"
          value={longlat}
          onChange={(e) => onChange({ longlat: e.target.value })}
          className={inputCls}
          placeholder="Titik: lat,lng (mis. -6.2,106.8)"
        />
      )}
      <p className="text-[11px] font-mono opacity-70">
        {parseLatLng(longlat) ? longlat : 'Belum ada titik — klik peta atau drag pin'}
      </p>
    </div>
  )
}
