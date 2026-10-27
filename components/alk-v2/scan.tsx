'use client'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { createAbsen, getPesertaPreview, getRecentAbsenForEvent, type RecentAbsenRow } from '@/lib/actions/absen'
import { getEventLocation, getEventSesi } from '@/lib/actions/event'
import type { EventSesiRow } from '@/lib/event-sesi'
import { decodeQR, type QRPayload } from '@/lib/qr'
import {
  Avatar,
  CARD,
  DateBlock,
  Empty,
  FLD,
  Field,
  Hero,
  Icon,
  PageHero,
  Sheet,
  SheetHead,
  Toast,
} from './ui'

export type ScanEvent = {
  id_event: number
  nama_event: string
  tglMs: number
  tglDisplay: string
  jamevent: string
  jamselesaievent: string
  jenisevent: string
  alamatevent: string
  radius: number
  hadir: number
}

type Preview = { payload: QRPayload; nama: string; gereja: string }
type LocStatus = 'idle' | 'checking' | 'inside' | 'outside' | 'unavailable'
type CamStatus = 'off' | 'loading' | 'on' | 'error' | 'unsupported'

function sesiLabel(s: EventSesiRow) {
  const jam = [s.jam_mulai, s.jam_selesai].filter(Boolean).join('–')
  return jam ? `${s.nama} (${jam})${s.wajib ? '' : ' · opsional'}` : `${s.nama}${s.wajib ? '' : ' · opsional'}`
}

function monDay(tglMs: number) {
  if (!tglMs) return { d: '—', m: '—' }
  const d = new Date(tglMs)
  return {
    d: String(d.getUTCDate()).padStart(2, '0'),
    m: d.toLocaleDateString('id-ID', { month: 'short', timeZone: 'UTC' }).replace('.', '').toUpperCase().slice(0, 3),
  }
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function EventPickSheet({
  events,
  value,
  onPick,
  onClose,
}: {
  events: ScanEvent[]
  value: number
  onPick: (id: number) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const list = needle
    ? events.filter((x) =>
        `#${x.id_event} ${x.nama_event} ${x.alamatevent} ${x.tglDisplay}`.toLowerCase().includes(needle),
      )
    : events

  return (
    <>
      <SheetHead title="Pilih Event" sub="Cari nama, nomor, atau tanggal" />
      <label className={`flex items-center gap-2.5 ${CARD} px-3.5 py-3 mb-3`}>
        <Icon name="search" className="w-5 h-5 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Cari event..."
          enterKeyHint="search"
          autoFocus
          className="flex-1 min-w-0 outline-none text-[15px] bg-transparent"
        />
      </label>
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {list.length === 0 && <Empty>Tidak ada event cocok</Empty>}
        {list.map((x) => {
          const on = x.id_event === value
          const { d, m } = monDay(x.tglMs)
          return (
            <button
              key={x.id_event}
              type="button"
              onClick={() => {
                onPick(x.id_event)
                onClose()
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition ${
                on ? 'ring-2 ring-[#c9232c] bg-[#fbeceb]/60' : 'ring-1 ring-[#efe3cc] bg-white'
              }`}
            >
              <DateBlock d={d} m={m} tone="red" />
              <span className="flex-1 min-w-0">
                <span className={`block font-bold text-[14.5px] truncate ${on ? 'text-[#c9232c]' : 'text-[#3b1417]'}`}>
                  {x.nama_event}
                </span>
                <span className="block text-[12px] text-slate-500 truncate">
                  #{x.id_event} · {x.jamevent}–{x.jamselesaievent}
                </span>
              </span>
              {on && <Icon name="check" className="w-5 h-5 text-[#c9232c]" sw={2.6} />}
            </button>
          )
        })}
      </div>
    </>
  )
}

export function ScanClient({ events, initialEventId }: { events: ScanEvent[]; initialEventId?: number }) {
  const [eventId, setEventId] = useState(
    () => initialEventId && events.some((e) => e.id_event === initialEventId)
      ? initialEventId
      : events[0]?.id_event ?? 0,
  )
  const e = events.find((x) => x.id_event === eventId) ?? events[0]
  const [pickOpen, setPickOpen] = useState(false)
  const [sesiList, setSesiList] = useState<EventSesiRow[]>([])
  const [sesiId, setSesiId] = useState<number | null>(null)
  const [recent, setRecent] = useState<RecentAbsenRow[]>([])
  const [hadir, setHadir] = useState(e?.hadir ?? 0)

  const [cam, setCam] = useState<CamStatus>('off')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [loc, setLoc] = useState<LocStatus>('idle')
  const [locDist, setLocDist] = useState<number | null>(null)
  const [confirming, startConfirm] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef(0)
  const watchIdRef = useRef(-1)

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const resetScan = useCallback(() => {
    setPreview(null)
    setError('')
    setDone(null)
  }, [])

  // Load sesi + recent when event changes
  useEffect(() => {
    if (!e) return
    let stop = false
    setHadir(e.hadir)
    resetScan()
    void getEventSesi(e.id_event).then((rows) => {
      if (stop) return
      setSesiList(rows)
      setSesiId(rows[0]?.id_sesi ?? null)
    })
    void getRecentAbsenForEvent(e.id_event).then((rows) => {
      if (!stop) setRecent(rows)
    })
    return () => {
      stop = true
    }
  }, [e, resetScan])

  // Geolocation
  useEffect(() => {
    if (!e || e.jenisevent === 'Online' || !('geolocation' in navigator)) {
      setLoc('idle')
      return
    }
    let evLat = 0
    let evLon = 0
    let evRadius = e.radius
    setLoc('checking')
    void getEventLocation(e.id_event).then((locRow) => {
      if (!locRow?.longlatevent || locRow.radius <= 0) {
        setLoc('idle')
        return
      }
      const parts = locRow.longlatevent.split(',').map(Number)
      if (parts.length < 2 || parts.some(isNaN)) {
        setLoc('idle')
        return
      }
      ;[evLat, evLon] = parts
      evRadius = locRow.radius
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const dist = haversineM(pos.coords.latitude, pos.coords.longitude, evLat, evLon)
          setLocDist(Math.round(dist))
          setLoc(dist <= evRadius ? 'inside' : 'outside')
        },
        () => setLoc('unavailable'),
        { enableHighAccuracy: true, timeout: 10000 },
      )
    })
    return () => {
      if (watchIdRef.current !== -1) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [e])

  useEffect(() => () => stopCamera(), [stopCamera])

  const onQr = useCallback(
    async (raw: string) => {
      stopCamera()
      setCam('off')
      const payload = decodeQR(raw)
      if (!payload) {
        setError('QR tidak valid.')
        return
      }
      if (e && payload.ev !== String(e.id_event)) {
        setError(`QR ini untuk event lain (event #${payload.ev}), bukan event #${e.id_event}.`)
        return
      }
      const peserta = await getPesertaPreview(Number(payload.p))
      setPreview({
        payload,
        nama: peserta?.nama ?? `Peserta #${payload.p}`,
        gereja: peserta?.gereja ?? '',
      })
    },
    [e, stopCamera],
  )

  async function startCamera() {
    resetScan()
    if (!('BarcodeDetector' in window)) {
      setCam('unsupported')
      return
    }
    setCam('loading')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
      setCam('on')
      // @ts-expect-error BarcodeDetector
      const detector = new BarcodeDetector({ formats: ['qr_code'] })
      let stopped = false
      const tick = async () => {
        if (stopped || !videoRef.current) return
        try {
          const results = await detector.detect(videoRef.current)
          if (results.length > 0) {
            stopped = true
            await onQr(results[0].rawValue)
            return
          }
        } catch {
          /* frame noise */
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setCam('error')
      setError(
        msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')
          ? 'Izin kamera ditolak. Aktifkan di pengaturan browser.'
          : 'Tidak dapat mengakses kamera.',
      )
    }
  }

  function confirm() {
    if (!preview || !e) return
    if (sesiList.length > 0 && sesiId == null) {
      setError('Pilih sesi absen dulu.')
      return
    }
    if (loc === 'outside') {
      setError('Anda diluar lokasi event, tidak bisa absen.')
      return
    }
    startConfirm(async () => {
      const res = await createAbsen(preview.payload, sesiList.length > 0 ? sesiId : null)
      if (res.success) {
        setDone(res.nama || preview.nama)
        setPreview(null)
        setHadir((n) => n + 1)
        const rows = await getRecentAbsenForEvent(e.id_event)
        setRecent(rows)
        setToast('Kehadiran tercatat')
        setTimeout(() => setToast(null), 2000)
        return
      }
      if (res.reason === 'already_scanned') setError('Peserta ini sudah diabsen di sesi ini.')
      else if (res.reason === 'sesi_required') setError('Pilih sesi absen dulu.')
      else if (res.reason === 'sesi_invalid') setError('Sesi tidak valid. Pilih ulang sesi.')
      else if (res.reason === 'unauthorized') setError('Sesi login habis, login ulang.')
      else setError('Gagal menyimpan absen. Coba lagi.')
    })
  }

  if (!e) {
    return <section><PageHero title="Scan Absensi" sub="Belum ada event yang bisa diabsen" /></section>
  }

  const { d, m } = monDay(e.tglMs)
  const selectedSesi = sesiList.find((s) => s.id_sesi === sesiId) ?? null
  const online = e.jenisevent === 'Online'

  return (
    <section>
      <Hero className="pt-6 md:pt-4 pb-36 text-center" decor="-left-6 top-10 w-40">
        <h2 className="font-extrabold text-[22px]">Scan Absensi</h2>
        <p className="text-[13px] text-white/90 mt-2 font-semibold">
          {e.nama_event} · <span className="text-[#f1dc9a]">{hadir} hadir</span>
        </p>
      </Hero>

      <div className="px-5 -mt-28 relative space-y-4 pb-4">
        <div className="bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.35)] p-4">
          <div className="space-y-3">
            <Field label="Event">
              <button
                type="button"
                onClick={() => setPickOpen(true)}
                className={`${FLD} flex items-center gap-2 text-left`}
              >
                <span className="flex-1 truncate">
                  #{e.id_event} · {e.nama_event} ({+d} {m.charAt(0) + m.slice(1).toLowerCase()})
                </span>
                <Icon name="chevron" className="w-5 h-5 text-slate-400 shrink-0" sw={2} />
              </button>
            </Field>

            {sesiList.length > 0 && (
              <Field label="Sesi absen">
                <select
                  value={sesiId ?? ''}
                  onChange={(ev) => {
                    setSesiId(Number(ev.target.value) || null)
                    resetScan()
                  }}
                  className={FLD}
                >
                  {sesiList.map((s) => (
                    <option key={s.id_sesi} value={s.id_sesi}>
                      {sesiLabel(s)}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <p
              className={`flex items-center gap-1.5 text-[12px] font-semibold ${
                online ? 'text-slate-500' : loc === 'outside' ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              <Icon name={online ? 'monitor' : 'pin'} className="w-4 h-4" />
              {online
                ? 'Event online — tanpa cek lokasi'
                : loc === 'outside'
                  ? `Di luar radius${locDist != null ? ` (${locDist} m)` : ''} — batas ${e.radius} m`
                  : loc === 'inside' && locDist != null
                    ? `Dalam radius event (${locDist} m dari titik, batas ${e.radius} m)`
                    : loc === 'checking'
                      ? 'Mengecek lokasi…'
                      : e.radius > 0
                        ? `Radius event ${e.radius} m`
                        : 'Lokasi tidak dikonfigurasi'}
            </p>

            {preview ? (
              <div className="rounded-2xl ring-1 ring-slate-200 p-4 space-y-3">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider">Peserta ditemukan</p>
                  <p className="text-[18px] font-bold text-slate-800">{preview.nama}</p>
                  {preview.gereja && <p className="text-[13px] text-slate-500">{preview.gereja}</p>}
                </div>
                <p className="flex items-center gap-1.5 text-[12px] text-emerald-600 font-semibold">
                  <Icon name="check" className="w-4 h-4" sw={2.6} />
                  Event #{e.id_event} sesuai
                </p>
                {selectedSesi && (
                  <p className="text-[12.5px] text-slate-500">
                    Sesi: <b className="text-slate-800">{selectedSesi.nama}</b>
                  </p>
                )}
                {error && <p className="text-[13px] text-rose-600 font-semibold">{error}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetScan()
                      void startCamera()
                    }}
                    className="py-3 rounded-xl ring-1 ring-slate-200 text-slate-700 font-bold text-[14px]"
                  >
                    Scan Ulang
                  </button>
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={confirming || (sesiList.length > 0 && sesiId == null) || loc === 'outside'}
                    className="py-3 rounded-xl bg-[#c9232c] text-white font-bold text-[14px] disabled:opacity-50"
                  >
                    {confirming ? 'Menyimpan…' : 'Absen Peserta'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#1a0d0f]">
                  <video
                    ref={videoRef}
                    className={`absolute inset-0 w-full h-full object-cover ${cam === 'on' ? '' : 'opacity-0'}`}
                    muted
                    playsInline
                    autoPlay
                  />
                  {cam === 'off' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-white/80">
                      <Icon name="camera" className="w-10 h-10 text-[#e6cd7e]" />
                      <p className="text-[13px] mt-3">Scan QR di tiket peserta</p>
                      <button
                        type="button"
                        onClick={() => void startCamera()}
                        className="mt-4 px-5 py-2.5 rounded-full bg-[#c9232c] text-white font-bold text-[14px]"
                      >
                        Nyalakan Kamera
                      </button>
                    </div>
                  )}
                  {cam === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/70 text-[13px]">
                      Memulai kamera…
                    </div>
                  )}
                  {(cam === 'error' || cam === 'unsupported') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                      <p className="text-[13px] text-rose-200">
                        {cam === 'unsupported'
                          ? 'Browser tidak mendukung scan QR. Gunakan Chrome atau Safari terbaru.'
                          : error}
                      </p>
                      <button
                        type="button"
                        onClick={() => void startCamera()}
                        className="mt-4 px-5 py-2.5 rounded-full bg-[#c9232c] text-white font-bold text-[14px]"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  )}
                  {cam === 'on' && (
                    <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
                      <div className="absolute left-[12%] right-[12%] top-[40%] h-0.5 bg-linear-to-r from-transparent via-[#e6cd7e] to-transparent shadow-[0_0_12px_#e6cd7e]" />
                      <p className="relative text-[12px] text-white/60">Arahkan kamera ke QR Code tiket</p>
                    </div>
                  )}
                  <span className="pointer-events-none absolute top-4 left-4 w-9 h-9 border-t-4 border-l-4 border-[#e6cd7e] rounded-tl-xl" />
                  <span className="pointer-events-none absolute top-4 right-4 w-9 h-9 border-t-4 border-r-4 border-[#e6cd7e] rounded-tr-xl" />
                  <span className="pointer-events-none absolute bottom-4 left-4 w-9 h-9 border-b-4 border-l-4 border-[#e6cd7e] rounded-bl-xl" />
                  <span className="pointer-events-none absolute bottom-4 right-4 w-9 h-9 border-b-4 border-r-4 border-[#e6cd7e] rounded-br-xl" />
                </div>
                {error && cam !== 'error' && (
                  <p className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-3 py-2.5 text-[13px] text-rose-700 font-medium">
                    {error}
                  </p>
                )}
                {cam === 'on' && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera()
                        setCam('off')
                      }}
                      className="px-4 py-2 rounded-full ring-1 ring-slate-200 bg-white text-[13px] font-semibold text-slate-600"
                    >
                      Stop Kamera
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {done && (
          <div className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <Icon name="check" className="w-6 h-6" sw={2.4} />
            </span>
            <p className="text-[13.5px] text-emerald-800">
              <b>{done}</b>
              <br />
              tercatat hadir{selectedSesi ? ` · ${selectedSesi.nama}` : ''}
            </p>
          </div>
        )}

        {sesiList.length > 0 && (
          <div className="flex gap-2 overflow-x-auto -mx-5 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sesiList.map((s) => (
              <button
                key={s.id_sesi}
                type="button"
                onClick={() => {
                  setSesiId(s.id_sesi)
                  resetScan()
                }}
                className={`shrink-0 rounded-xl px-3 py-2 text-[12px] ring-1 ${
                  s.id_sesi === sesiId
                    ? 'bg-[#fbeceb] ring-[#f3d3d3] text-[#c9232c]'
                    : 'bg-white ring-slate-200 text-slate-600'
                }`}
              >
                {s.nama}
              </button>
            ))}
          </div>
        )}

        <div>
          <p className="font-bold text-[#3b1417] mb-2 px-1">Baru saja tercatat</p>
          {recent.length ? (
            <div className={`${CARD} divide-y divide-slate-100`}>
              {recent.map((a) => (
                <div key={a.id_absen} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    <Avatar g={a.gender} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-slate-800 truncate">{a.nama}</p>
                    <p className="text-[12px] text-slate-500 truncate">
                      {a.gereja}
                      {a.id_sesi != null ? ` · ${sesiList.find((s) => s.id_sesi === a.id_sesi)?.nama ?? ''}` : ''}
                    </p>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-400">{a.time}</span>
                  <Icon name="check" className="w-5 h-5 text-emerald-500" sw={2.4} />
                </div>
              ))}
            </div>
          ) : (
            <Empty>Belum ada presensi</Empty>
          )}
        </div>
      </div>

      <Sheet open={pickOpen} onClose={() => setPickOpen(false)}>
        <EventPickSheet
          events={events}
          value={e.id_event}
          onPick={(id) => setEventId(id)}
          onClose={() => setPickOpen(false)}
        />
      </Sheet>
      <Toast msg={toast} />
    </section>
  )
}
