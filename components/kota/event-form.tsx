'use client'
import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createEvent, updateEvent } from '@/lib/actions/event'
import type { EventDetailFull } from '@/lib/actions/event'

const TARGET_OPTIONS = ['Umum', 'Volunteer', 'Squad', 'Core', 'Leader', 'Tim Nasional']
const TARGET_VALUES: Record<string, string> = {
  Umum: '0', Volunteer: '1', Squad: '2', Core: '3', Leader: '4', 'Tim Nasional': '5',
}
const TARGET_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(TARGET_VALUES).map(([k, v]) => [v, k]),
)

const TARGET_PENGURUS_OPTIONS = ['Admin LK', 'BRIM']
const TARGET_PENGURUS_VALUES: Record<string, string> = { 'Admin LK': '1', BRIM: '2' }
const TARGET_PENGURUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(TARGET_PENGURUS_VALUES).map(([k, v]) => [v, k]),
)

const JENIS_OPTIONS = ['Offline', 'Online']

function parseTargetToLabels(stored: string, labelsMap: Record<string, string>): string[] {
  return stored.split(',').filter(Boolean).map((v) => labelsMap[v.trim()]).filter(Boolean)
}

function labelsToValues(labels: string[], valuesMap: Record<string, string>): string {
  return labels.map((l) => valuesMap[l]).filter(Boolean).join(',')
}

function fmtRp(raw: string): string {
  const n = parseInt(raw, 10)
  return raw && !isNaN(n) ? n.toLocaleString('id-ID') : ''
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

type FormState = {
  nama_event: string
  jenisevent: string
  target: string[]
  targetpengurus: string[]
  targetjumlah: string
  tglevent: string
  tgleventselesai: string
  jamevent: string
  jamselesaievent: string
  alamatevent: string
  radius: string
  suratpemberitahuan: string
}

interface EventFormProps {
  mode: 'create' | 'edit'
  idCabang: string
  mapsApiKey: string
  event?: EventDetailFull
  backUrl: string
}

export function EventForm({ mode, idCabang, mapsApiKey, event, backUrl }: EventFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const initialLatLng = (() => {
    if (!event?.longlatevent) return null
    const parts = event.longlatevent.split(',').map(Number)
    if (parts.length < 2 || parts.some(isNaN)) return null
    return { lat: parts[0], lng: parts[1] }
  })()

  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(initialLatLng)
  const [danaRaw, setDanaRaw] = useState(event?.danaevent.replace(/\D/g, '') ?? '')
  const [danaDisplay, setDanaDisplay] = useState(() => fmtRp(event?.danaevent.replace(/\D/g, '') ?? ''))

  const [form, setForm] = useState<FormState>({
    nama_event: event?.nama_event ?? '',
    jenisevent: event?.jenisevent ?? 'Offline',
    target: event?.target ? parseTargetToLabels(event.target, TARGET_LABELS) : [],
    targetpengurus: event?.targetpengurus ? parseTargetToLabels(event.targetpengurus, TARGET_PENGURUS_LABELS) : [],
    targetjumlah: event ? String(event.targetjumlah) : '',
    tglevent: event?.tglRaw ?? '',
    tgleventselesai: event?.tglSelesaiRaw ?? '',
    jamevent: event?.jamevent ?? '',
    jamselesaievent: event?.jamselesaievent ?? '',
    alamatevent: event?.alamatevent ?? '',
    radius: event ? String(event.radius) : '500',
    suratpemberitahuan: event?.suratpemberitahuan ?? '',
  })

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  function toggleList(key: 'target' | 'targetpengurus', val: string) {
    setForm((prev) => {
      const list = prev[key] as string[]
      return { ...prev, [key]: list.includes(val) ? list.filter((x) => x !== val) : [...list, val] }
    })
  }

  // Google Maps
  const mapRef = useRef<HTMLDivElement>(null)
  const alamatRef = useRef<HTMLInputElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const markerRef = useRef<unknown>(null)
  const mapsReadyRef = useRef(false)

  // Stable setter refs to avoid stale closures
  const setLatLngRef = useRef(setLatLng)
  setLatLngRef.current = setLatLng
  const setAlamatRef = useRef((s: string) => setForm((prev) => ({ ...prev, alamatevent: s })))
  setAlamatRef.current = (s: string) => setForm((prev) => ({ ...prev, alamatevent: s }))

  function initMap() {
    if (!mapRef.current || mapsReadyRef.current) return
    mapsReadyRef.current = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google.maps
    const center = initialLatLng ?? { lat: -7.5, lng: 110.0 }

    const map = new g.Map(mapRef.current, {
      center,
      zoom: initialLatLng ? 15 : 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
    mapInstanceRef.current = map

    const marker = new g.Marker({ position: center, map, draggable: true })
    markerRef.current = marker

    marker.addListener('dragend', () => {
      const pos = (marker as any).getPosition()
      if (pos) setLatLngRef.current({ lat: pos.lat(), lng: pos.lng() })
    })

    map.addListener('click', (e: any) => {
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
      ;(marker as any).setPosition(pos)
      setLatLngRef.current(pos)
    })

    if (alamatRef.current) {
      try {
        const ac = new g.places.Autocomplete(alamatRef.current, {
          fields: ['formatted_address', 'geometry'],
          componentRestrictions: { country: 'id' },
        })
        ac.addListener('place_changed', () => {
          const place = ac.getPlace()
          if (place.geometry?.location) {
            const newPos = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
            map.setCenter(newPos)
            map.setZoom(15)
            ;(marker as any).setPosition(newPos)
            setLatLngRef.current(newPos)
          }
          if (place.formatted_address) setAlamatRef.current(place.formatted_address)
        })
      } catch { /* Places API might be restricted */ }
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !mapsApiKey) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).google?.maps) { initMap(); return }
    const scriptId = 'gmaps-script'
    const existing = document.getElementById(scriptId)
    if (existing) {
      existing.addEventListener('load', initMap)
      return () => existing.removeEventListener('load', initMap)
    }
    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places`
    script.async = true
    script.onload = initMap
    document.head.appendChild(script)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.nama_event.trim()) return setError('Nama event wajib diisi.')
    if (!form.tglevent) return setError('Tanggal event wajib diisi.')

    startTransition(async () => {
      try {
        const payload = {
          nama_event: form.nama_event.trim(),
          jenisevent: form.jenisevent,
          target: labelsToValues(form.target, TARGET_VALUES),
          targetpengurus: labelsToValues(form.targetpengurus, TARGET_PENGURUS_VALUES),
          targetjumlah: parseInt(form.targetjumlah, 10) || 0,
          tglevent: parseLocalDate(form.tglevent),
          tgleventselesai: parseLocalDate(form.tgleventselesai || form.tglevent),
          jamevent: form.jamevent,
          jamselesaievent: form.jamselesaievent,
          alamatevent: form.alamatevent,
          longlatevent: latLng ? `${latLng.lat},${latLng.lng}` : '',
          radius: parseInt(form.radius, 10) || 0,
          danaevent: danaRaw,
          suratpemberitahuan: form.suratpemberitahuan,
        }

        if (mode === 'create') {
          const id = await createEvent({ ...payload, idCabang })
          router.push(`/dashboard/kota/alk/event/${id}`)
        } else {
          await updateEvent(event!.id_event, payload)
          router.push(`/dashboard/kota/alk/event/${event!.id_event}`)
        }
      } catch {
        setError('Gagal menyimpan. Coba lagi.')
      }
    })
  }

  const inputCls =
    'w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors'

  return (
    <main className="min-h-screen bg-bg pb-10">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-[480px] mx-auto px-5 pt-6 pb-4 flex items-center gap-3">
          <Link href={backUrl} className="text-sm text-muted hover:text-fg transition-colors shrink-0">
            ← Kembali
          </Link>
          <p className="text-[14px] font-semibold text-fg flex-1 text-center pr-14">
            {mode === 'create' ? 'Buat Event' : 'Edit Event'}
          </p>
        </div>
      </nav>

      <form onSubmit={handleSubmit} className="max-w-[480px] mx-auto px-4 pt-5 flex flex-col gap-4">

        {/* Info Dasar */}
        <FormSection title="Info Dasar">
          <FormField label="Nama Event">
            <input
              type="text"
              value={form.nama_event}
              onChange={(e) => setField('nama_event', e.target.value)}
              className={inputCls}
              placeholder="Nama event"
            />
          </FormField>

          <FormField label="Jenis Event">
            <select
              value={form.jenisevent}
              onChange={(e) => setField('jenisevent', e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              {JENIS_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </FormField>

          <FormField label="Target Peserta">
            <div className="flex flex-wrap gap-2 pt-0.5">
              {TARGET_OPTIONS.map((opt) => (
                <ToggleChip
                  key={opt}
                  label={opt}
                  active={form.target.includes(opt)}
                  onClick={() => toggleList('target', opt)}
                />
              ))}
            </div>
          </FormField>

          <FormField label="Target Pengurus">
            <div className="flex flex-wrap gap-2 pt-0.5">
              {TARGET_PENGURUS_OPTIONS.map((opt) => (
                <ToggleChip
                  key={opt}
                  label={opt}
                  active={form.targetpengurus.includes(opt)}
                  onClick={() => toggleList('targetpengurus', opt)}
                />
              ))}
            </div>
          </FormField>

          <FormField label="Target Jumlah Peserta">
            <input
              type="number"
              min={0}
              value={form.targetjumlah}
              onChange={(e) => setField('targetjumlah', e.target.value)}
              className={inputCls}
              placeholder="0"
            />
          </FormField>
        </FormSection>

        {/* Waktu */}
        <FormSection title="Waktu">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tanggal Mulai">
              <input
                type="date"
                value={form.tglevent}
                onChange={(e) => setField('tglevent', e.target.value)}
                className={inputCls}
              />
            </FormField>
            <FormField label="Tanggal Selesai">
              <input
                type="date"
                value={form.tgleventselesai}
                onChange={(e) => setField('tgleventselesai', e.target.value)}
                className={inputCls}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Jam Mulai">
              <input
                type="time"
                value={form.jamevent}
                onChange={(e) => setField('jamevent', e.target.value)}
                className={inputCls}
              />
            </FormField>
            <FormField label="Jam Selesai">
              <input
                type="time"
                value={form.jamselesaievent}
                onChange={(e) => setField('jamselesaievent', e.target.value)}
                className={inputCls}
              />
            </FormField>
          </div>
        </FormSection>

        {/* Lokasi */}
        <FormSection title="Lokasi">
          <FormField label="Alamat Event">
            <input
              ref={alamatRef}
              type="text"
              value={form.alamatevent}
              onChange={(e) => setField('alamatevent', e.target.value)}
              className={inputCls}
              placeholder="Cari atau ketik alamat..."
              autoComplete="off"
            />
          </FormField>

          <div>
            <p className="text-[12px] font-medium text-muted mb-1.5">
              Peta — klik atau drag pin untuk set lokasi
            </p>
            <div
              ref={mapRef}
              className="w-full rounded-[12px] overflow-hidden border border-border"
              style={{ height: '260px', background: 'var(--subtle)' }}
            >
              {!mapsApiKey && (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-[13px] text-muted">Maps API tidak tersedia.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="px-3 py-2.5 bg-bg border border-border rounded-input">
              <p className="text-[10px] text-muted mb-0.5">Latitude</p>
              <p className="text-[13px] text-fg font-mono">{latLng ? latLng.lat.toFixed(7) : '—'}</p>
            </div>
            <div className="px-3 py-2.5 bg-bg border border-border rounded-input">
              <p className="text-[10px] text-muted mb-0.5">Longitude</p>
              <p className="text-[13px] text-fg font-mono">{latLng ? latLng.lng.toFixed(7) : '—'}</p>
            </div>
          </div>

          <FormField label="Radius Absen (meter)">
            <input
              type="number"
              min={0}
              value={form.radius}
              onChange={(e) => setField('radius', e.target.value)}
              className={inputCls}
              placeholder="500"
            />
          </FormField>
        </FormSection>

        {/* Lainnya */}
        <FormSection title="Lainnya">
          <FormField label="Dana Event (Rp)">
            <input
              type="text"
              inputMode="numeric"
              value={danaDisplay}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '')
                setDanaRaw(raw)
                setDanaDisplay(raw)
              }}
              onBlur={() => setDanaDisplay(fmtRp(danaRaw))}
              onFocus={() => setDanaDisplay(danaRaw)}
              className={inputCls}
              placeholder="0"
            />
          </FormField>

          <FormField label="Link Surat Pemberitahuan">
            <input
              type="text"
              value={form.suratpemberitahuan}
              onChange={(e) => setField('suratpemberitahuan', e.target.value)}
              className={inputCls}
              placeholder="https://..."
            />
          </FormField>
        </FormSection>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-red-light rounded-[12px]">
            <p className="text-[13px] text-red font-medium">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 bg-accent text-white rounded-btn text-[16px] font-semibold disabled:opacity-60 transition-opacity"
        >
          {isPending ? 'Menyimpan...' : mode === 'create' ? 'Buat Event' : 'Simpan Perubahan'}
        </button>

      </form>
    </main>
  )
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[13px] font-semibold text-fg">{title}</p>
      </div>
      <div className="px-4 py-4 flex flex-col gap-4">{children}</div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-muted">{label}</label>
      {children}
    </div>
  )
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
        active
          ? 'bg-accent text-white border-accent'
          : 'bg-bg text-fg border-border hover:border-accent'
      }`}
    >
      {label}
    </button>
  )
}
