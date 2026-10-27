'use client'
import { useState, useEffect, useRef, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createEvent, updateEvent } from '@/lib/actions/event'
import { getWfeSerentakForDate, type WfeSerentakRow } from '@/lib/actions/wfe-serentak'
import type { EventDetailFull } from '@/lib/actions/event'
import type { event_wwtype } from '@/lib/generated/enums'
import {
  khususFromScope,
  scopeFromKhusus,
  type NasionalEventScope,
} from '@/lib/event-cabang'
import { parseLocalDate, type EventSesiInput } from '@/lib/event-sesi'
import {
  BTN_RED,
  FLD,
  Field,
  Hero,
  Note,
  SectionCard,
  TopBar,
  type IconName,
  type Tint,
} from '@/components/alk-v2/ui'

type SesiFormRow = EventSesiInput & { _key: string }

function newSesiRow(defaults?: Partial<EventSesiInput>): SesiFormRow {
  return {
    _key: crypto.randomUUID(),
    id_sesi: defaults?.id_sesi,
    nama: defaults?.nama ?? '',
    tanggal: defaults?.tanggal ?? '',
    jam_mulai: defaults?.jam_mulai ?? '',
    jam_selesai: defaults?.jam_selesai ?? '',
    wajib: defaults?.wajib ?? true,
  }
}

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

const GMAPS_SCRIPT_ID = 'gmaps-script'
// Shared across remounts — stale script.onload on an unmounted form was the grey-box race.
let gmapsReady: Promise<void> | null = null

function ensureGoogleMaps(apiKey: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).google?.maps?.importLibrary) return Promise.resolve()
  if (gmapsReady) return gmapsReady

  gmapsReady = new Promise<void>((resolve, reject) => {
    const settle = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).google?.maps?.importLibrary) {
        resolve()
        return
      }
      // loading=async: onload can fire before importLibrary is attached
      const t0 = Date.now()
      const id = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).google?.maps?.importLibrary) {
          clearInterval(id)
          resolve()
        } else if (Date.now() - t0 > 15_000) {
          clearInterval(id)
          gmapsReady = null
          reject(new Error('Google Maps load timeout'))
        }
      }, 50)
    }

    const existing = document.getElementById(GMAPS_SCRIPT_ID)
    if (existing) {
      settle()
      return
    }
    const script = document.createElement('script')
    script.id = GMAPS_SCRIPT_ID
    // loading=async = Google bootstrap; constructors only after importLibrary
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`
    script.async = true
    script.onload = settle
    script.onerror = () => {
      gmapsReady = null
      reject(new Error('Google Maps script failed'))
    }
    document.head.appendChild(script)
  })

  return gmapsReady
}

const WWTYPE_OPTIONS_BASE: { value: event_wwtype; label: string }[] = [
  { value: 'bulanan', label: 'Bulanan' },
  { value: 'jfe', label: 'JFE' },
]
const WWTYPE_OPTION_NASIONAL: { value: event_wwtype; label: string } = {
  value: 'nasional',
  label: 'Nasional',
}

/** Force HH:mm 24h (strips AM/PM if pasted from locale UI). */
function normalizeJam24(raw: string): string {
  const s = raw.trim()
  const m = s.match(/^(\d{1,2})[:.](\d{2})(?:\s*(AM|PM))?$/i)
  if (!m) return s
  let h = Number(m[1])
  const min = m[2]
  const ap = m[3]?.toUpperCase()
  if (ap === 'PM' && h < 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  if (h > 23 || Number(min) > 59) return s
  return `${String(h).padStart(2, '0')}:${min}`
}

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

type FormState = {
  nama_event: string
  jenisevent: string
  wwtype: event_wwtype
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
  /** Prefix for post-save redirect, e.g. `/dashboard/v2/kota/alk/event` */
  eventBasePath?: string
  /** Sekretariat nasional: show seluruh kota / khusus scope inputs */
  isNasional?: boolean
  /** Sekretariat PWA v2 chrome (Hero / SectionCard / FLD) */
  variant?: 'legacy' | 'v2'
}

export function EventForm({
  mode,
  idCabang,
  mapsApiKey,
  event,
  backUrl,
  eventBasePath = '/dashboard/kota/alk/event',
  isNasional = false,
  variant = 'legacy',
}: EventFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [nasionalScope, setNasionalScope] = useState<NasionalEventScope>(
    event ? scopeFromKhusus(event.khusus) : 'seluruh_kota',
  )

  const initialLatLng = (() => {
    if (!event?.longlatevent) return null
    const parts = event.longlatevent.split(',').map(Number)
    if (parts.length < 2 || parts.some(isNaN)) return null
    return { lat: parts[0], lng: parts[1] }
  })()

  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(initialLatLng)
  const [danaRaw, setDanaRaw] = useState(event?.danaevent.replace(/\D/g, '') ?? '')
  const [danaDisplay, setDanaDisplay] = useState(() => fmtRp(event?.danaevent.replace(/\D/g, '') ?? ''))
  const [flyer, setFlyer] = useState<File | null>(null)
  const [flyerPreview, setFlyerPreview] = useState('')
  const [jfeTemplate, setJfeTemplate] = useState<WfeSerentakRow | null>(null)
  const [sesi, setSesi] = useState<SesiFormRow[]>(() =>
    isNasional
      ? (event?.sesi ?? []).map((s) =>
          newSesiRow({
            id_sesi: s.id_sesi,
            nama: s.nama,
            tanggal: s.tanggal,
            jam_mulai: s.jam_mulai,
            jam_selesai: s.jam_selesai,
            wajib: s.wajib,
          }),
        )
      : [],
  )

  const [form, setForm] = useState<FormState>({
    nama_event: event?.nama_event ?? '',
    jenisevent: event?.jenisevent ?? 'Offline',
    wwtype: event?.wwtype ?? 'bulanan',
    target: event?.target ? parseTargetToLabels(event.target, TARGET_LABELS) : [],
    targetpengurus: event?.targetpengurus ? parseTargetToLabels(event.targetpengurus, TARGET_PENGURUS_LABELS) : [],
    targetjumlah: event ? String(event.targetjumlah) : '',
    tglevent: event?.tglRaw ?? '',
    tgleventselesai: event?.tglSelesaiRaw ?? '',
    jamevent: normalizeJam24(event?.jamevent ?? ''),
    jamselesaievent: normalizeJam24(event?.jamselesaievent ?? ''),
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

  const isOnline = form.jenisevent === 'Online'

  function initMap() {
    if (!mapRef.current || mapsReadyRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google?.maps
    // loading=async: namespace ada dulu, constructor Map baru setelah importLibrary
    if (!g?.importLibrary) return

    mapsReadyRef.current = true
    void (async () => {
      try {
        await Promise.all([g.importLibrary('maps'), g.importLibrary('places')])
      } catch {
        mapsReadyRef.current = false
        return
      }
      if (!mapRef.current) {
        mapsReadyRef.current = false
        return
      }

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
        const pos = (marker as { getPosition: () => { lat: () => number; lng: () => number } | null }).getPosition()
        if (pos) setLatLngRef.current({ lat: pos.lat(), lng: pos.lng() })
      })

      map.addListener('click', (e: { latLng: { lat: () => number; lng: () => number } }) => {
        const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
        ;(marker as { setPosition: (p: { lat: number; lng: number }) => void }).setPosition(pos)
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
              const newPos = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              }
              map.setCenter(newPos)
              map.setZoom(15)
              ;(marker as { setPosition: (p: { lat: number; lng: number }) => void }).setPosition(newPos)
              setLatLngRef.current(newPos)
            }
            if (place.formatted_address) setAlamatRef.current(place.formatted_address)
          })
        } catch { /* Places API might be restricted */ }
      }
    })()
  }

  useEffect(() => {
    if (isOnline) {
      mapsReadyRef.current = false
      mapInstanceRef.current = null
      markerRef.current = null
      return
    }
    if (!mapsApiKey) return
    let cancelled = false
    void ensureGoogleMaps(mapsApiKey)
      .then(() => {
        if (!cancelled) initMap()
      })
      .catch(() => {
        /* script/timeout — leave grey box; remount retries via gmapsReady reset */
      })
    return () => {
      cancelled = true
    }
  }, [isOnline, mapsApiKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (flyerPreview) URL.revokeObjectURL(flyerPreview)
    }
  }, [flyerPreview])

  useEffect(() => {
    if (form.wwtype !== 'jfe' || !form.tglevent) {
      setJfeTemplate(null)
      return
    }
    let stop = false
    void getWfeSerentakForDate(form.tglevent).then((row) => {
      if (!stop) setJfeTemplate(row)
    })
    return () => { stop = true }
  }, [form.wwtype, form.tglevent])

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
          wwtype: form.wwtype,
          target: labelsToValues(form.target, TARGET_VALUES),
          targetpengurus: labelsToValues(form.targetpengurus, TARGET_PENGURUS_VALUES),
          targetjumlah: parseInt(form.targetjumlah, 10) || 0,
          tglevent: parseLocalDate(form.tglevent),
          tgleventselesai: parseLocalDate(form.tgleventselesai || form.tglevent),
          jamevent: normalizeJam24(form.jamevent),
          jamselesaievent: normalizeJam24(form.jamselesaievent),
          alamatevent: form.alamatevent,
          longlatevent: form.jenisevent === 'Online' ? '' : (latLng ? `${latLng.lat},${latLng.lng}` : ''),
          radius: form.jenisevent === 'Online' ? 0 : parseInt(form.radius, 10) || 0,
          danaevent: danaRaw,
          suratpemberitahuan: form.suratpemberitahuan,
          khusus: isNasional ? khususFromScope(nasionalScope) : '',
          ...(isNasional
            ? {
                sesi: sesi
                  .filter((s) => s.nama.trim())
                  .map(({ _key: _, ...rest }) => ({
                    ...rest,
                    tanggal: rest.tanggal || form.tglevent,
                    jam_mulai: normalizeJam24(rest.jam_mulai),
                    jam_selesai: normalizeJam24(rest.jam_selesai),
                  })),
              }
            : {}),
        }

        if (mode === 'create') {
          const id = await createEvent({ ...payload, idCabang }, flyer)
          router.push(`${eventBasePath}/${id}`)
        } else {
          await updateEvent(event!.id_event, payload, flyer)
          router.push(`${eventBasePath}/${event!.id_event}`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal menyimpan. Coba lagi.')
      }
    })
  }

  const v2 = variant === 'v2'
  const inputCls = v2
    ? FLD
    : 'w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors'
  const dateCls = v2 ? `${FLD} block appearance-none min-h-12` : inputCls

  const willReview =
    form.wwtype !== 'nasional' &&
    Boolean(
      form.suratpemberitahuan.trim() ||
        (form.wwtype === 'bulanan' && flyer) ||
        (form.wwtype === 'jfe' && Boolean(jfeTemplate) && Boolean(flyer || event?.posterUrl)),
    )
  const submitLabel = isPending
    ? flyer
      ? 'Mengunggah flyer...'
      : 'Menyimpan...'
    : willReview
      ? 'Simpan & Review'
      : mode === 'create'
        ? 'Buat Event'
        : 'Simpan Perubahan'

  const title = mode === 'create' ? 'Buat Event' : 'Edit Event'

  const nasionalScopeField = isNasional ? (
    <FormField v2={v2} label="Tipe Event Nasional" group>
      <div className="space-y-2">
        {(
          [
            { value: 'seluruh_kota', label: 'Event Seluruh Kota', hint: 'Event nasional untuk semua kota' },
            { value: 'khusus', label: 'Event Khusus', hint: 'Event khusus nasional (mis. WW Online)' },
          ] as const
        ).map((opt) => {
          const active = nasionalScope === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setNasionalScope(opt.value)}
              className={
                v2
                  ? `w-full text-left px-3.5 py-3 rounded-xl ring-1 transition ${
                      active ? 'ring-2 ring-[#c9232c] bg-[#fbeceb]/60' : 'ring-slate-200 bg-white'
                    }`
                  : `text-left px-3.5 py-3 rounded-[12px] border-[1.5px] transition-colors ${
                      active ? 'border-accent bg-accent-light' : 'border-border bg-surface'
                    }`
              }
            >
              <p
                className={`text-[14px] font-semibold ${
                  active ? (v2 ? 'text-[#c9232c]' : 'text-accent-dark') : v2 ? 'text-slate-800' : 'text-fg'
                }`}
              >
                {opt.label}
              </p>
              <p className={`text-[12px] mt-0.5 ${v2 ? 'text-slate-500' : 'text-muted'}`}>{opt.hint}</p>
            </button>
          )
        })}
      </div>
    </FormField>
  ) : null

  const formBody = (
    <>
      <FormSection
        v2={v2}
        icon="calendar"
        tint="red"
        title="Info Dasar"
        sub="Tipe, target, dan kuota"
        lift
      >
        {nasionalScopeField}

        <FormField v2={v2} label="Nama Event">
          <input
            type="text"
            value={form.nama_event}
            onChange={(e) => setField('nama_event', e.target.value)}
            className={inputCls}
            placeholder="Nama event"
          />
        </FormField>

        <FormField v2={v2} label="Jenis Event">
          <select
            value={form.jenisevent}
            onChange={(e) => setField('jenisevent', e.target.value)}
            className={`${inputCls} appearance-none`}
          >
            {JENIS_OPTIONS.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </FormField>

        <FormField v2={v2} label={isNasional ? 'Tipe' : 'Tipe WW'}>
          <select
            value={form.wwtype}
            onChange={(e) => setField('wwtype', e.target.value as event_wwtype)}
            className={`${inputCls} appearance-none`}
          >
            {(isNasional
              ? [...WWTYPE_OPTIONS_BASE, WWTYPE_OPTION_NASIONAL]
              : WWTYPE_OPTIONS_BASE
            ).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField v2={v2} label="Target Peserta" group>
          <div className="flex flex-wrap gap-2">
            {TARGET_OPTIONS.map((opt) => (
              <ToggleChip
                key={opt}
                v2={v2}
                label={opt}
                active={form.target.includes(opt)}
                onClick={() => toggleList('target', opt)}
              />
            ))}
          </div>
        </FormField>

        <FormField v2={v2} label="Target Pengurus" group>
          <div className="flex flex-wrap gap-2">
            {TARGET_PENGURUS_OPTIONS.map((opt) => (
              <ToggleChip
                key={opt}
                v2={v2}
                label={opt}
                active={form.targetpengurus.includes(opt)}
                onClick={() => toggleList('targetpengurus', opt)}
              />
            ))}
          </div>
        </FormField>

        <FormField v2={v2} label="Target Jumlah Peserta">
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

      <FormSection v2={v2} icon="clock" tint="gold" title="Waktu" sub="Jam dalam format 24 jam (WIB)">
        <div className="grid grid-cols-2 gap-3">
          <FormField v2={v2} label="Tanggal Mulai">
            <input
              type="date"
              value={form.tglevent}
              onChange={(e) => setField('tglevent', e.target.value)}
              className={dateCls}
            />
          </FormField>
          <FormField v2={v2} label="Tanggal Selesai">
            <input
              type="date"
              value={form.tgleventselesai}
              onChange={(e) => setField('tgleventselesai', e.target.value)}
              className={dateCls}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField v2={v2} label="Jam Mulai">
            <input
              type="text"
              inputMode="numeric"
              placeholder="09:00"
              pattern="^([01]\d|2[0-3]):[0-5]\d$"
              title="Format 24 jam, contoh 09:00 atau 21:30"
              value={form.jamevent}
              onChange={(e) => setField('jamevent', e.target.value)}
              onBlur={(e) => setField('jamevent', normalizeJam24(e.target.value))}
              className={inputCls}
            />
          </FormField>
          <FormField v2={v2} label="Jam Selesai">
            <input
              type="text"
              inputMode="numeric"
              placeholder="21:00"
              pattern="^([01]\d|2[0-3]):[0-5]\d$"
              title="Format 24 jam, contoh 09:00 atau 21:30"
              value={form.jamselesaievent}
              onChange={(e) => setField('jamselesaievent', e.target.value)}
              onBlur={(e) => setField('jamselesaievent', normalizeJam24(e.target.value))}
              className={inputCls}
            />
          </FormField>
        </div>
      </FormSection>

      {isNasional && (
        <FormSection
          v2={v2}
          icon="qr"
          tint="red"
          title="Sesi Absen"
          sub="Absensi per sesi (Sekretariat)"
        >
          <p className={`text-[12px] -mt-1 ${v2 ? 'text-slate-500' : 'text-muted'}`}>
            Opsional. Kosong = absen sekali per event. Toggle wajib off untuk sesi paralel.
          </p>
          {sesi.length === 0 ? (
            <p className={`text-[13px] text-center py-2 ${v2 ? 'text-slate-400' : 'text-muted'}`}>
              Belum ada sesi.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {sesi.map((row, idx) => (
                <div
                  key={row._key}
                  className={
                    v2
                      ? 'rounded-xl ring-1 ring-slate-200 bg-slate-50/60 p-3 space-y-2.5'
                      : 'border border-border rounded-[12px] p-3 flex flex-col gap-2.5 bg-bg'
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[12px] font-semibold ${v2 ? 'text-slate-500' : 'text-muted'}`}>
                      Sesi {idx + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSesi((prev) => prev.filter((s) => s._key !== row._key))}
                      className={`text-[18px] leading-none ${v2 ? 'text-slate-400 hover:text-rose-600' : 'text-muted hover:text-red'}`}
                      aria-label="Hapus sesi"
                    >
                      ×
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Nama sesi"
                    value={row.nama}
                    onChange={(e) =>
                      setSesi((prev) =>
                        prev.map((s) => (s._key === row._key ? { ...s, nama: e.target.value } : s)),
                      )
                    }
                    className={inputCls}
                  />
                  <input
                    type="date"
                    value={row.tanggal || form.tglevent}
                    onChange={(e) =>
                      setSesi((prev) =>
                        prev.map((s) => (s._key === row._key ? { ...s, tanggal: e.target.value } : s)),
                      )
                    }
                    className={dateCls}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Jam mulai"
                      value={row.jam_mulai}
                      onChange={(e) =>
                        setSesi((prev) =>
                          prev.map((s) =>
                            s._key === row._key ? { ...s, jam_mulai: e.target.value } : s,
                          ),
                        )
                      }
                      onBlur={(e) =>
                        setSesi((prev) =>
                          prev.map((s) =>
                            s._key === row._key
                              ? { ...s, jam_mulai: normalizeJam24(e.target.value) }
                              : s,
                          ),
                        )
                      }
                      className={inputCls}
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Jam selesai"
                      value={row.jam_selesai}
                      onChange={(e) =>
                        setSesi((prev) =>
                          prev.map((s) =>
                            s._key === row._key ? { ...s, jam_selesai: e.target.value } : s,
                          ),
                        )
                      }
                      onBlur={(e) =>
                        setSesi((prev) =>
                          prev.map((s) =>
                            s._key === row._key
                              ? { ...s, jam_selesai: normalizeJam24(e.target.value) }
                              : s,
                          ),
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <label
                    className={`flex items-center gap-2 text-[13px] cursor-pointer select-none ${v2 ? 'text-slate-700' : 'text-fg'}`}
                  >
                    <input
                      type="checkbox"
                      checked={row.wajib}
                      onChange={(e) =>
                        setSesi((prev) =>
                          prev.map((s) =>
                            s._key === row._key ? { ...s, wajib: e.target.checked } : s,
                          ),
                        )
                      }
                      className={`size-4 ${v2 ? 'accent-[#c9232c]' : 'accent-[var(--accent)]'}`}
                    />
                    Wajib (hitung kehadiran lengkap)
                  </label>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() =>
              setSesi((prev) => [
                ...prev,
                newSesiRow({ tanggal: form.tgleventselesai || form.tglevent }),
              ])
            }
            className={
              v2
                ? 'w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-[13px] font-semibold text-slate-600 hover:border-[#c9232c] hover:text-[#c9232c] transition'
                : 'w-full py-2.5 rounded-input border border-dashed border-border text-[13px] font-semibold text-fg2 hover:border-accent hover:text-accent transition-colors'
            }
          >
            + Tambah sesi
          </button>
        </FormSection>
      )}

      <FormSection
        v2={v2}
        icon="pin"
        tint="gold"
        title="Lokasi"
        sub={isOnline ? 'Event online — tanpa peta & radius' : 'Titik peta untuk cek radius absen'}
      >
        <FormField v2={v2} label="Alamat Event">
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

        {!isOnline && (
          <>
            <div>
              <p className={`text-[12px] font-semibold mb-1.5 ${v2 ? 'text-slate-600' : 'text-muted font-medium'}`}>
                Peta — klik atau drag pin untuk set lokasi
              </p>
              <div
                ref={mapRef}
                className={
                  v2
                    ? 'w-full h-[260px] rounded-xl overflow-hidden ring-1 ring-slate-200 bg-slate-100'
                    : 'w-full rounded-[12px] overflow-hidden border border-border'
                }
                style={v2 ? undefined : { height: '260px', background: 'var(--subtle)' }}
              >
                {!mapsApiKey && (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className={`text-[13px] ${v2 ? 'text-slate-400' : 'text-muted'}`}>
                      Maps API tidak tersedia.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['lat', 'lng'] as const).map((k) => (
                <div
                  key={k}
                  className={
                    v2
                      ? 'px-3 py-2.5 bg-slate-50 rounded-xl ring-1 ring-slate-200'
                      : 'px-3 py-2.5 bg-bg border border-border rounded-input'
                  }
                >
                  <p className={`text-[10px] ${v2 ? 'text-slate-400' : 'text-muted mb-0.5'}`}>
                    {k === 'lat' ? 'Latitude' : 'Longitude'}
                  </p>
                  <p className={`text-[13px] font-mono ${v2 ? 'text-slate-800' : 'text-fg'}`}>
                    {latLng ? latLng[k].toFixed(7) : '—'}
                  </p>
                </div>
              ))}
            </div>

            <FormField v2={v2} label="Radius Absen (meter)">
              <input
                type="number"
                min={0}
                value={form.radius}
                onChange={(e) => setField('radius', e.target.value)}
                className={inputCls}
                placeholder="500"
              />
            </FormField>
          </>
        )}
      </FormSection>

      <FormSection
        v2={v2}
        icon="receipt"
        tint="red"
        title="Lainnya"
        sub="Dana, surat pemberitahuan, dan flyer"
      >
        <FormField v2={v2} label="Dana Event (Rp)">
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

        <FormField v2={v2} label="Link Surat Pemberitahuan">
          <input
            type="text"
            value={form.suratpemberitahuan}
            onChange={(e) => setField('suratpemberitahuan', e.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
        </FormField>

        <FormField v2={v2} label={mode === 'edit' ? 'Upload ulang poster' : 'Flyer Event'}>
          {form.wwtype === 'jfe' && jfeTemplate && (
            <div
              className={`mb-3 overflow-hidden ${v2 ? 'rounded-xl ring-1 ring-slate-200' : 'rounded-[12px] border border-border'}`}
            >
              <p className={`px-3 py-2 text-[12px] ${v2 ? 'text-slate-500' : 'text-muted'}`}>
                Flyer pusat WW JFE / WFE. Sesuaikan hanya: foto pembicara, tanggal, tempat, tema, logo
                kota.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={jfeTemplate.image_url} alt="Flyer pusat WW JFE" className="w-full object-cover" />
            </div>
          )}
          {form.wwtype === 'jfe' && !jfeTemplate && form.tglevent && (
            <p className={`text-[12px] mb-2 ${v2 ? 'text-slate-500' : 'text-muted'}`}>
              Belum ada flyer pusat Brim untuk bulan tanggal ini.
            </p>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              // Vercel rejects request bodies > 4.5 MB before the server action runs ("Failed to fetch")
              if (file && file.size > 4 * 1024 * 1024) {
                e.target.value = ''
                setFlyer(null)
                setFlyerPreview('')
                setError(
                  `Flyer maksimal 4 MB (file ini ${(file.size / 1024 / 1024).toFixed(1)} MB). Kompres dulu lalu upload ulang.`,
                )
                return
              }
              setError('')
              setFlyer(file)
              setFlyerPreview(file ? URL.createObjectURL(file) : '')
            }}
            className={
              v2
                ? 'text-[13px] text-slate-700 file:mr-3 file:px-3 file:py-1.5 file:rounded-full file:border-0 file:bg-[#c9232c] file:text-white file:text-[13px] file:font-semibold'
                : 'text-[13px] text-fg file:mr-3 file:px-3 file:py-1.5 file:rounded-full file:border-0 file:bg-accent file:text-white file:text-[13px] file:font-medium'
            }
          />
          {(flyerPreview || event?.posterUrl) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={flyerPreview || event!.posterUrl}
              alt="Preview flyer"
              className={`mt-2 w-full object-cover ${v2 ? 'rounded-xl ring-1 ring-slate-200' : 'rounded-[12px] border border-border'}`}
            />
          )}
        </FormField>
      </FormSection>

      {error && (
        <div
          className={
            v2
              ? 'px-4 py-3 rounded-xl bg-rose-50 text-[13px] text-rose-700 font-medium'
              : 'px-4 py-3 bg-red-light rounded-[12px]'
          }
        >
          {v2 ? error : <p className="text-[13px] text-red font-medium">{error}</p>}
        </div>
      )}

      {v2 && willReview && (
        <Note>
          Ada flyer / link surat — event langsung masuk <b>review pusat</b> (QA flyer & berita acara).
        </Note>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={
          v2
            ? `w-full py-4 text-[16px] ${BTN_RED}`
            : 'w-full py-4 bg-accent text-white rounded-btn text-[16px] font-semibold disabled:opacity-60 transition-opacity'
        }
      >
        {submitLabel}
      </button>
    </>
  )

  if (v2) {
    return (
      <section className="pb-10">
        <Hero className="pt-4 md:pt-2 pb-20" decor="-right-6 top-10 w-40">
          <TopBar title={title} back={() => router.push(backUrl)} />
          <p className="text-center text-[13px] text-white/80 mt-1">
            Sekretariat · {mode === 'create' ? 'buat event baru' : 'ubah data event'}
          </p>
        </Hero>
        <form onSubmit={handleSubmit} className="px-5 -mt-12 relative space-y-4">
          {formBody}
        </form>
      </section>
    )
  }

  return (
    <main className="min-h-screen bg-bg pb-10">
      <nav className="sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-[480px] mx-auto px-5 pt-6 pb-4 flex items-center gap-3">
          <Link href={backUrl} className="text-sm text-muted hover:text-fg transition-colors shrink-0">
            ← Kembali
          </Link>
          <p className="text-[14px] font-semibold text-fg flex-1 text-center pr-14">{title}</p>
        </div>
      </nav>
      <form onSubmit={handleSubmit} className="max-w-[480px] mx-auto px-4 pt-5 flex flex-col gap-4">
        {formBody}
      </form>
    </main>
  )
}

function FormSection({
  v2,
  icon,
  tint,
  title,
  sub,
  lift,
  children,
}: {
  v2: boolean
  icon?: IconName
  tint?: Tint
  title: string
  sub?: string
  lift?: boolean
  children: ReactNode
}) {
  if (v2 && icon && tint && sub) {
    return (
      <SectionCard icon={icon} tint={tint} title={title} sub={sub} lift={lift}>
        {children}
      </SectionCard>
    )
  }
  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[13px] font-semibold text-fg">{title}</p>
      </div>
      <div className="px-4 py-4 flex flex-col gap-4">{children}</div>
    </div>
  )
}

function FormField({
  v2,
  label,
  group,
  children,
}: {
  v2: boolean
  label: string
  group?: boolean
  children: ReactNode
}) {
  if (v2) {
    if (group) {
      return (
        <div>
          <p className="text-[12px] font-semibold text-slate-600 mb-1.5">{label}</p>
          {children}
        </div>
      )
    }
    return <Field label={label}>{children}</Field>
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-muted">{label}</label>
      {children}
    </div>
  )
}

function ToggleChip({
  v2,
  label,
  active,
  onClick,
}: {
  v2: boolean
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        v2
          ? `px-3 py-1.5 rounded-full text-[13px] font-semibold ring-1 transition ${
              active
                ? 'bg-[#c9232c] text-white ring-[#c9232c]'
                : 'bg-slate-50 text-slate-600 ring-slate-200'
            }`
          : `px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
              active
                ? 'bg-accent text-white border-accent'
                : 'bg-bg text-fg border-border hover:border-accent'
            }`
      }
    >
      {label}
    </button>
  )
}
