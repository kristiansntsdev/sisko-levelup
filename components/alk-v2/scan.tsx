'use client'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { createAbsen, getPesertaPreview, getRecentAbsenForEvent, type RecentAbsenRow } from '@/lib/actions/absen'
import { getEventLocation, getEventSesi } from '@/lib/actions/event'
import type { EventSesiRow } from '@/lib/event-sesi'
import { decodeQR, type QRPayload } from '@/lib/qr'
import { ANTON, BTN, BTN_OUTLINE, BTN_SHELL, ERROR, LABEL, MONO, PANEL, PaperHeader, PaperMain, PRESS, ROWS, SectionHead, Strip } from '@/components/pwa/paper-ui'
import { DateBlock, Empty, FLD, Field, Icon, PersonChip, Sheet, SheetHead, Toast } from './ui'

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
type Flash = { ok: boolean; title: string; sub?: string }

const RECENT_NORMAL = 5
const RECENT_FS = 40
const FLASH_MS = 1000

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
      <label className="flex items-center gap-2.5 rounded-full bg-[#efe8da]/50 ring-1 ring-[#161616]/15 px-4 py-3 mb-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#161616] transition">
        <Icon name="search" className="w-5 h-5 shrink-0 text-[#c21f24]" sw={2.2} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Cari event..."
          enterKeyHint="search"
          autoFocus
          className="flex-1 min-w-0 outline-none text-[16px] text-[#161616] bg-transparent placeholder:text-[#57534e]/75"
        />
      </label>
      <div className="space-y-2 max-h-[50vh] overflow-y-auto px-0.5 py-0.5">
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
                on ? 'ring-2 ring-[#161616] bg-[#ffd83d]/25' : 'ring-1 ring-[#161616]/15 bg-white'
              }`}
            >
              <DateBlock d={d} m={m} tone="red" />
              <span className="flex-1 min-w-0">
                <span className={`${ANTON} block text-[16px] tracking-[.01em] text-[#161616] truncate`}>{x.nama_event}</span>
                <span className={`${MONO} block text-[11px] text-[#44403c] truncate mt-0.5`}>
                  #{x.id_event} · {x.jamevent}–{x.jamselesaievent}
                </span>
              </span>
              {on && <Icon name="check" className="w-5 h-5 shrink-0 text-[#161616]" sw={2.6} />}
            </button>
          )
        })}
      </div>
    </>
  )
}

function CamCorners() {
  return (
    <>
      <span className="pointer-events-none absolute top-4 left-4 w-9 h-9 border-t-4 border-l-4 border-[#ffd83d] rounded-tl-xl" />
      <span className="pointer-events-none absolute top-4 right-4 w-9 h-9 border-t-4 border-r-4 border-[#ffd83d] rounded-tr-xl" />
      <span className="pointer-events-none absolute bottom-4 left-4 w-9 h-9 border-b-4 border-l-4 border-[#ffd83d] rounded-bl-xl" />
      <span className="pointer-events-none absolute bottom-4 right-4 w-9 h-9 border-b-4 border-r-4 border-[#ffd83d] rounded-br-xl" />
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
  const [fullscreen, setFullscreen] = useState(false)
  const [flash, setFlash] = useState<Flash | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef(0)
  const watchIdRef = useRef(-1)
  const fsRef = useRef(false)
  const busyRef = useRef(false)
  const loopStopRef = useRef(false)
  const flashTimerRef = useRef(0)
  const ctxRef = useRef({
    eventId: 0,
    sesiId: null as number | null,
    hasSesi: false,
    loc: 'idle' as LocStatus,
  })

  fsRef.current = fullscreen
  ctxRef.current = {
    eventId: e?.id_event ?? 0,
    sesiId,
    hasSesi: sesiList.length > 0,
    loc,
  }

  const stopCamera = useCallback(() => {
    loopStopRef.current = true
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

  const refreshRecent = useCallback(async (idEvent: number, fs: boolean) => {
    const rows = await getRecentAbsenForEvent(idEvent, fs ? RECENT_FS : RECENT_NORMAL)
    setRecent(rows)
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
    void refreshRecent(e.id_event, fsRef.current).then(() => {
      /* ok */
    })
    return () => {
      stop = true
    }
  }, [e, resetScan, refreshRecent])

  // Live poll while fullscreen
  useEffect(() => {
    if (!fullscreen || !e) return
    void refreshRecent(e.id_event, true)
    const id = window.setInterval(() => {
      void refreshRecent(e.id_event, true)
    }, 4000)
    return () => clearInterval(id)
  }, [fullscreen, e, refreshRecent])

  // Lock body scroll + Esc to exit fullscreen
  useEffect(() => {
    if (!fullscreen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [fullscreen])

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

  useEffect(() => () => {
    stopCamera()
    window.clearTimeout(flashTimerRef.current)
  }, [stopCamera])

  // Re-bind stream after layout swap (normal ↔ fullscreen remounts <video>)
  useEffect(() => {
    const v = videoRef.current
    const s = streamRef.current
    if (v && s && cam === 'on') {
      v.srcObject = s
      void v.play()
    }
  }, [fullscreen, cam])

  // Start camera after fullscreen <video> is mounted (single rAF can race commit)
  useEffect(() => {
    if (!fullscreen) return
    let cancelled = false
    const id = window.setTimeout(() => {
      if (!cancelled) void startCamera()
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
    // ponytail: startCamera closes over latest sesi/loc via ctxRef; only re-boot on enter FS
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen])

  const showFlash = useCallback((next: Flash) => {
    window.clearTimeout(flashTimerRef.current)
    setFlash(next)
    flashTimerRef.current = window.setTimeout(() => {
      setFlash(null)
      busyRef.current = false
    }, FLASH_MS)
  }, [])

  const absenFromQr = useCallback(
    async (raw: string): Promise<'stop' | 'continue'> => {
      const payload = decodeQR(raw)
      if (!payload) {
        if (fsRef.current) {
          showFlash({ ok: false, title: 'QR tidak valid' })
          return 'continue'
        }
        setError('QR tidak valid.')
        return 'stop'
      }
      const { eventId: evId, sesiId: sid, hasSesi, loc: locNow } = ctxRef.current
      if (payload.ev !== String(evId)) {
        const msg = `QR ini untuk event lain (event #${payload.ev}), bukan event #${evId}.`
        if (fsRef.current) {
          showFlash({ ok: false, title: 'Event tidak cocok', sub: msg })
          return 'continue'
        }
        setError(msg)
        return 'stop'
      }

      if (fsRef.current) {
        if (hasSesi && sid == null) {
          showFlash({ ok: false, title: 'Pilih sesi absen dulu' })
          return 'continue'
        }
        if (locNow === 'outside') {
          showFlash({ ok: false, title: 'Di luar lokasi event' })
          return 'continue'
        }
        const res = await createAbsen(payload, hasSesi ? sid : null)
        if (res.success) {
          setHadir((n) => n + 1)
          void refreshRecent(evId, true)
          showFlash({
            ok: true,
            title: 'Berhasil absen',
            sub: res.nama || undefined,
          })
          return 'continue'
        }
        const errTitle =
          res.reason === 'already_scanned'
            ? 'Sudah diabsen'
            : res.reason === 'sesi_required'
              ? 'Pilih sesi absen dulu'
              : res.reason === 'not_approved'
                ? 'Tiket belum di-approve'
                : res.reason === 'unauthorized'
                  ? 'Login habis'
                  : 'Gagal absen'
        showFlash({ ok: false, title: errTitle })
        return 'continue'
      }

      // Normal mode: preview then confirm
      const peserta = await getPesertaPreview(Number(payload.p))
      setPreview({
        payload,
        nama: peserta?.nama ?? `Peserta #${payload.p}`,
        gereja: peserta?.gereja ?? '',
      })
      return 'stop'
    },
    [refreshRecent, showFlash],
  )

  const onQr = useCallback(
    async (raw: string) => {
      if (fsRef.current) {
        if (busyRef.current) return
        busyRef.current = true
        await absenFromQr(raw)
        // busy cleared by flash timer; if flash skipped somehow, unlock
        if (!fsRef.current) busyRef.current = false
        return
      }
      stopCamera()
      setCam('off')
      await absenFromQr(raw)
    },
    [absenFromQr, stopCamera],
  )

  async function startCamera() {
    resetScan()
    setFlash(null)
    busyRef.current = false
    if (!('BarcodeDetector' in window)) {
      setCam('unsupported')
      return
    }
    stopCamera()
    loopStopRef.current = false
    setCam('loading')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      if (loopStopRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream
      const video = videoRef.current
      if (!video) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      video.srcObject = stream
      await video.play()
      setCam('on')
      // @ts-expect-error BarcodeDetector
      const detector = new BarcodeDetector({ formats: ['qr_code'] })
      const tick = async () => {
        if (loopStopRef.current || !videoRef.current) return
        try {
          if (!busyRef.current) {
            const results = await detector.detect(videoRef.current)
            if (results.length > 0) {
              if (fsRef.current) {
                void onQr(results[0].rawValue)
                // keep looping — busyRef blocks re-entry until flash ends
              } else {
                loopStopRef.current = true
                await onQr(results[0].rawValue)
                return
              }
            }
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

  function openFullscreen() {
    resetScan()
    stopCamera()
    setCam('off')
    setFullscreen(true)
  }

  function closeFullscreen() {
    setFullscreen(false)
    setFlash(null)
    busyRef.current = false
    window.clearTimeout(flashTimerRef.current)
    stopCamera()
    setCam('off')
    if (e) void refreshRecent(e.id_event, false)
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
        const rows = await getRecentAbsenForEvent(e.id_event, RECENT_NORMAL)
        setRecent(rows)
        setToast('Kehadiran tercatat')
        setTimeout(() => setToast(null), 2000)
        return
      }
      if (res.reason === 'already_scanned') setError('Peserta ini sudah diabsen di sesi ini.')
      else if (res.reason === 'sesi_required') setError('Pilih sesi absen dulu.')
      else if (res.reason === 'sesi_invalid') setError('Sesi tidak valid. Pilih ulang sesi.')
      else if (res.reason === 'not_approved') {
        setError('Event nasional: tiket belum di-approve Sekretariat Nasional.')
      } else if (res.reason === 'unauthorized') setError('Sesi login habis, login ulang.')
      else setError('Gagal menyimpan absen. Coba lagi.')
    })
  }

  if (!e) {
    return (
      <PaperMain>
        <PaperHeader sticker="Belum ada event yang bisa diabsen" title="Scan Absensi" />
      </PaperMain>
    )
  }

  const { d, m } = monDay(e.tglMs)
  const selectedSesi = sesiList.find((s) => s.id_sesi === sesiId) ?? null
  const online = e.jenisevent === 'Online'

  const cameraOverlays = (
    <>
      {cam === 'off' && !fullscreen && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-white/80">
          <Icon name="camera" className="w-10 h-10 text-[#ffd83d]" />
          <p className="text-[12px] mt-3">Scan QR di tiket peserta</p>
          <button type="button" onClick={() => void startCamera()} className={`mt-4 ${BTN_SHELL}`}>
            <Strip className="px-6 py-2.5 text-[17px]">Nyalakan Kamera</Strip>
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
          <p className="text-[12px] text-white/90">
            {cam === 'unsupported'
              ? 'Browser tidak mendukung scan QR. Gunakan Chrome atau Safari terbaru.'
              : error}
          </p>
          <button type="button" onClick={() => void startCamera()} className={`mt-4 ${BTN_SHELL}`}>
            <Strip className="px-6 py-2.5 text-[17px]">Coba Lagi</Strip>
          </button>
        </div>
      )}
      {cam === 'on' && (
        <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none">
          <div className="absolute left-[12%] right-[12%] top-[40%] h-0.5 bg-linear-to-r from-transparent via-[#ffd83d] to-transparent shadow-[0_0_12px_#ffd83d]" />
          <p className="relative text-[12px] text-white/60">Arahkan kamera ke QR Code tiket</p>
        </div>
      )}
      <CamCorners />
    </>
  )

  return (
    <PaperMain>
      {!fullscreen && (
        <>
          <PaperHeader sticker={`${hadir} hadir`} title="Scan Absensi">
            <p className={`${MONO} mt-1 text-[12px] font-bold text-[#44403c] truncate`}>{e.nama_event}</p>
          </PaperHeader>

          <div className="px-5 mt-5 space-y-4 pb-4">
            <div className={`p-4 ${PANEL}`}>
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
                    <Icon name="chevron" className="w-5 h-5 text-[#161616] shrink-0" sw={2} />
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
                  className={`flex items-center gap-1.5 text-[11px] font-bold ${
                    online ? 'text-[#44403c]' : loc === 'outside' ? 'text-[#c21f24]' : 'text-[#161616]'
                  }`}
                >
                  <Icon name={online ? 'monitor' : 'pin'} className="w-4 h-4 shrink-0" />
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
                  <div className="rounded-[14px] border-2 border-dotted border-[#161616]/30 p-4 space-y-3">
                    <div>
                      <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>Peserta ditemukan</p>
                      <p className={`${ANTON} mt-1 text-[26px] leading-[1.08] tracking-[.01em] break-words`}>{preview.nama}</p>
                      {preview.gereja && <p className="text-[12px] text-[#44403c] mt-1">{preview.gereja}</p>}
                    </div>
                    <p className="flex items-center gap-1.5 text-[11.5px] font-bold">
                      <Icon name="check" className="w-4 h-4 shrink-0 text-[#c21f24]" sw={2.8} />
                      Event #{e.id_event} sesuai
                    </p>
                    {selectedSesi && (
                      <p className="text-[12px] text-[#44403c]">
                        Sesi: <b className="text-[#161616]">{selectedSesi.nama}</b>
                      </p>
                    )}
                    {error && <p role="alert" className={ERROR}>{error}</p>}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          resetScan()
                          void startCamera()
                        }}
                        className={BTN_OUTLINE}
                      >
                        Scan Ulang
                      </button>
                      <button
                        type="button"
                        onClick={confirm}
                        disabled={confirming || (sesiList.length > 0 && sesiId == null) || loc === 'outside'}
                        className={BTN}
                      >
                        <Strip className="text-[16px]">{confirming ? 'Menyimpan…' : 'Absen Peserta'}</Strip>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative aspect-[4/3] w-full rounded-[14px] overflow-hidden bg-[#161616]">
                      <video
                        ref={videoRef}
                        className={`absolute inset-0 w-full h-full object-cover ${cam === 'on' ? '' : 'opacity-0'}`}
                        muted
                        playsInline
                        autoPlay
                      />
                      {cameraOverlays}
                    </div>
                    {error && cam !== 'error' && (
                      <p role="alert" className={`${ERROR} rounded-[10px] bg-[#e02a2f]/10 px-3 py-2.5`}>
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
                          className={`${LABEL} px-4 py-2 rounded-full ring-1 ring-[#161616]/25 text-[11px] font-bold ${PRESS}`}
                        >
                          Stop Kamera
                        </button>
                      </div>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={openFullscreen}
                  className={BTN}
                >
                  <Strip>
                    <Icon name="scan" className="w-5 h-5" sw={2} />
                    Fullscreen Scan
                  </Strip>
                </button>
              </div>
            </div>

            {done && (
              <div role="status" className="rounded-[14px] bg-[#ffd83d] p-4 flex items-center gap-3">
                <span className="w-10 h-10 shrink-0 rounded-[10px] -rotate-3 bg-[#161616] text-[#ffd83d] flex items-center justify-center">
                  <Icon name="check" className="w-6 h-6" sw={2.4} />
                </span>
                <p className="text-[12.5px] min-w-0 break-words">
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
                    aria-pressed={s.id_sesi === sesiId}
                    className={`${LABEL} shrink-0 h-9 px-3.5 rounded-full text-[10.5px] font-bold ${PRESS} ${
                      s.id_sesi === sesiId ? 'bg-[#161616] text-[#ffd83d]' : 'bg-[#fffdf7] text-[#161616]'
                    }`}
                  >
                    {s.nama}
                  </button>
                ))}
              </div>
            )}

            <div>
              <SectionHead title="Baru Saja Tercatat" />
              {recent.length ? (
                <div className={`${PANEL} ${ROWS}`}>
                  {recent.map((a) => (
                    <div key={a.id_absen} className="flex items-center gap-3 px-4 py-3">
                      <PersonChip />
                      <div className="flex-1 min-w-0">
                        <p className={`${ANTON} text-[16px] leading-tight tracking-[.02em] truncate`}>{a.nama}</p>
                        <p className="text-[11px] text-[#44403c] truncate mt-0.5">
                          {a.gereja}
                          {a.id_sesi != null ? ` · ${sesiList.find((s) => s.id_sesi === a.id_sesi)?.nama ?? ''}` : ''}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-[#57534e]">{a.time}</span>
                      <Icon name="check" className="w-5 h-5 shrink-0 text-[#c21f24]" sw={2.6} />
                    </div>
                  ))}
                </div>
              ) : (
                <Empty>Belum ada presensi</Empty>
              )}
            </div>
          </div>
        </>
      )}

      {fullscreen && (
        <div className="fixed inset-0 z-[60] flex flex-col md:flex-row bg-[#161616] text-white">
          {/* Camera — left / top */}
          <div className="relative flex-1 min-h-0 min-w-0 bg-black">
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover ${cam === 'on' ? '' : 'opacity-0'}`}
              muted
              playsInline
              autoPlay
            />
            {cameraOverlays}
            {cam === 'off' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-white/80">
                <Icon name="camera" className="w-12 h-12 text-[#ffd83d]" />
                <p className="text-[13px] mt-3">Scan QR di tiket peserta</p>
                <button type="button" onClick={() => void startCamera()} className={`mt-4 ${BTN_SHELL}`}>
                  <Strip className="px-6 py-2.5 text-[17px]">Nyalakan Kamera</Strip>
                </button>
              </div>
            )}

            {/* Top bar over camera */}
            <div className="absolute top-0 inset-x-0 z-10 flex items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none">
              <div className="pointer-events-auto min-w-0 rounded-2xl bg-black/55 backdrop-blur px-3.5 py-2.5 ring-1 ring-white/10">
                <p className={`${ANTON} text-[16px] tracking-[.01em] truncate`}>{e.nama_event}</p>
                <p className="text-[11px] text-white/70">
                  <span className="text-[#ffd83d] font-bold">{hadir} hadir</span>
                  {selectedSesi ? ` · ${selectedSesi.nama}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={closeFullscreen}
                className="pointer-events-auto shrink-0 w-11 h-11 rounded-full bg-black/55 backdrop-blur ring-1 ring-white/15 flex items-center justify-center"
                aria-label="Tutup fullscreen"
              >
                <Icon name="x" className="w-5 h-5" sw={2.2} />
              </button>
            </div>

            {/* Success / error flash — 1 detik. Green and red on purpose, off-palette: read at a glance at the door. */}
            {flash && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 pointer-events-none">
                <div
                  className={`mx-6 max-w-sm w-full rounded-3xl px-7 py-8 text-center shadow-[0_24px_60px_-12px_rgba(0,0,0,.55)] ${
                    flash.ok ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  <span
                    className={`mx-auto mb-3 w-14 h-14 rounded-2xl flex items-center justify-center ${
                      flash.ok ? 'bg-white/20' : 'bg-white/15'
                    }`}
                  >
                    <Icon name={flash.ok ? 'check' : 'alert'} className="w-8 h-8" sw={2.4} />
                  </span>
                  <p className={`${ANTON} text-[28px] leading-tight tracking-[.01em]`}>{flash.title}</p>
                  {flash.sub && <p className="mt-2 text-[15px] font-semibold text-white/90 truncate">{flash.sub}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Live list — right / bottom */}
          <aside className="shrink-0 flex flex-col h-[38%] md:h-full md:w-[min(400px,42vw)] bg-[#161616] border-t md:border-t-0 md:border-l border-white/10">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className={`${ANTON} text-[18px] leading-none tracking-[.01em]`}>Absen live</p>
                <p className="text-[11px] text-white/60 truncate mt-1">{recent.length} terbaru</p>
              </div>
              {sesiList.length > 0 && (
                <select
                  value={sesiId ?? ''}
                  onChange={(ev) => setSesiId(Number(ev.target.value) || null)}
                  className="max-w-[45%] rounded-xl bg-white/10 text-[12px] font-semibold px-2.5 py-2 outline-none ring-1 ring-white/15"
                >
                  {sesiList.map((s) => (
                    <option key={s.id_sesi} value={s.id_sesi} className="text-slate-900">
                      {s.nama}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {recent.length === 0 ? (
                <p className={`${LABEL} px-4 py-8 text-center text-[11px] text-white/50`}>Belum ada presensi</p>
              ) : (
                <ul className="divide-y divide-white/10">
                  {recent.map((a) => (
                    <li key={a.id_absen} className="flex items-center gap-3 px-4 py-3">
                      <PersonChip />
                      <div className="flex-1 min-w-0">
                        <p className={`${ANTON} text-[16px] leading-tight tracking-[.02em] truncate`}>{a.nama}</p>
                        <p className="text-[11px] text-white/55 truncate mt-0.5">
                          {a.gereja}
                          {a.id_sesi != null
                            ? ` · ${sesiList.find((s) => s.id_sesi === a.id_sesi)?.nama ?? ''}`
                            : ''}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-white/50 tabular-nums">{a.time}</span>
                      <Icon name="check" className="w-5 h-5 text-emerald-400 shrink-0" sw={2.4} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}

      <Sheet open={pickOpen} onClose={() => setPickOpen(false)}>
        <EventPickSheet
          events={events}
          value={e.id_event}
          onPick={(id) => setEventId(id)}
          onClose={() => setPickOpen(false)}
        />
      </Sheet>
      <Toast msg={toast} />
    </PaperMain>
  )
}
