'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card } from '@/components/ui'
import { createAbsen, getPesertaPreview } from '@/lib/actions/absen'
import { decodeQR, type QRPayload } from '@/lib/qr'

type ScanStatus = 'loading' | 'scanning' | 'stopped' | 'error' | 'unsupported'

type Preview = {
  payload: QRPayload
  nama: string
  gereja: string
}

export function ScannerClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId') ?? ''

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const facingModeRef = useRef<'environment' | 'user'>('environment')

  const [scanStatus, setScanStatus] = useState<ScanStatus>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const handleQRDetected = useCallback(async (raw: string) => {
    stopCamera()
    const payload = decodeQR(raw)
    if (!payload) {
      setErrorMsg('QR tidak valid.')
      setScanStatus('error')
      return
    }
    if (eventId && payload.ev !== eventId) {
      setErrorMsg(`QR ini untuk event lain (event #${payload.ev}), bukan event #${eventId}.`)
      setScanStatus('error')
      return
    }
    const peserta = await getPesertaPreview(Number(payload.p))
    setPreview({
      payload,
      nama: peserta?.nama ?? `Peserta #${payload.p}`,
      gereja: peserta?.gereja ?? '',
    })
  }, [eventId, stopCamera])

  const startScanning = useCallback(async () => {
    setPreview(null)
    setConfirmError('')
    if (!('BarcodeDetector' in window)) {
      setScanStatus('unsupported')
      return
    }
    setScanStatus('loading')
    let stopped = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingModeRef.current, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()
      setScanStatus('scanning')
      // @ts-expect-error — BarcodeDetector not yet in TS lib
      const detector = new BarcodeDetector({ formats: ['qr_code'] })
      async function scan() {
        if (stopped) return
        try {
          const results = await detector.detect(videoRef.current!)
          if (results.length > 0 && !stopped) {
            stopped = true
            await handleQRDetected(results[0].rawValue)
            return
          }
        } catch { /* per-frame errors are normal */ }
        rafRef.current = requestAnimationFrame(scan)
      }
      rafRef.current = requestAnimationFrame(scan)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setScanStatus('error')
      setErrorMsg(
        msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')
          ? 'Izin kamera ditolak. Aktifkan kamera di pengaturan browser.'
          : 'Tidak dapat mengakses kamera.',
      )
    }
    return () => { stopped = true }
  }, [handleQRDetected])

  useEffect(() => {
    const cleanup = startScanning()
    return () => {
      cleanup?.then?.((fn) => fn?.())
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [startScanning])

  function handleStop() {
    stopCamera()
    if (videoRef.current) videoRef.current.srcObject = null
    setScanStatus('stopped')
  }

  function handleFlip() {
    stopCamera()
    const next = facingModeRef.current === 'environment' ? 'user' : 'environment'
    facingModeRef.current = next
    setFacingMode(next)
    startScanning()
  }

  async function handleConfirm() {
    if (!preview) return
    setConfirming(true)
    setConfirmError('')
    const result = await createAbsen(preview.payload)
    if (result.success) {
      router.push(`/alk/data-peserta?nama=${encodeURIComponent(result.nama)}&gereja=${encodeURIComponent(result.gereja)}`)
    } else if (result.reason === 'already_scanned') {
      setConfirmError('Peserta ini sudah diabsen sebelumnya.')
      setConfirming(false)
    } else {
      setConfirmError('Gagal menyimpan absen. Coba lagi.')
      setConfirming(false)
    }
  }

  function handleScanAgain() {
    setPreview(null)
    setConfirmError('')
    startScanning()
  }

  const statusText =
    scanStatus === 'scanning' ? 'Arahkan kamera ke QR Code tiket'
    : scanStatus === 'loading' ? 'Memulai kamera...'
    : scanStatus === 'stopped' ? 'Kamera dimatikan'
    : ''

  return (
    <main className="min-h-screen bg-bg pb-safe flex flex-col">

      {/* Nav */}
      <nav className="w-full sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-sm mx-auto px-5 pt-6 pb-4 flex items-center justify-between">
          <button
            onClick={() => { stopCamera(); router.push('/alk') }}
            className="text-sm text-muted hover:text-fg transition-colors"
          >
            ← Kembali
          </button>
          {eventId && <p className="text-xs text-muted">Event #{eventId}</p>}
        </div>
      </nav>

      {/* Preview — shown after QR detected */}
      {preview && (
        <div className="max-w-sm mx-auto w-full px-5 py-4 flex flex-col gap-3">
          <Card variant="elevated" className="p-4 flex flex-col gap-3">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Peserta ditemukan</p>
              <p className="text-lg font-bold text-fg">{preview.nama}</p>
              {preview.gereja && <p className="text-sm text-muted mt-0.5">{preview.gereja}</p>}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Event #{preview.payload.ev} sesuai
            </div>
            {confirmError && <p className="text-sm text-red font-medium">{confirmError}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={handleScanAgain} disabled={confirming}>
                Scan Ulang
              </Button>
              <Button fullWidth onClick={handleConfirm} disabled={confirming}>
                {confirming ? 'Menyimpan...' : 'Absen Peserta'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Camera + Controls — vertically centered */}
      {!preview && (
        <div className="flex-1 flex flex-col justify-center gap-4">

          <div className="max-w-sm mx-auto w-full px-5">
            <div className="relative w-full overflow-hidden rounded-card bg-fg" style={{ aspectRatio: '4/3' }}>
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline autoPlay />

              {scanStatus === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                </div>
              )}

              {scanStatus === 'stopped' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-fg">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <p className="text-sm" style={{ color: 'var(--subtle)' }}>Kamera dimatikan</p>
                </div>
              )}

              {(scanStatus === 'error' || scanStatus === 'unsupported') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 bg-fg">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--red-light)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm text-center" style={{ color: 'var(--red-light)' }}>
                    {scanStatus === 'unsupported'
                      ? 'Browser tidak mendukung scan QR. Gunakan Chrome atau Safari terbaru.'
                      : errorMsg}
                  </p>
                </div>
              )}

              {scanStatus === 'scanning' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-3/5 h-3/5">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-accent" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-accent" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-accent" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-accent" />
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-accent opacity-80" style={{ animation: 'scan-line 2s ease-in-out infinite' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="max-w-sm mx-auto w-full px-5 flex flex-col gap-3">
            {statusText && <p className="text-sm text-muted text-center">{statusText}</p>}

            {scanStatus === 'scanning' && (
              <div className="flex gap-2">
                <Button variant="secondary" fullWidth onClick={handleStop}>
                  Stop Kamera
                </Button>
                <Button variant="secondary" fullWidth onClick={handleFlip}>
                  {facingMode === 'environment' ? '🔄 Kamera Depan' : '🔄 Kamera Belakang'}
                </Button>
              </div>
            )}

            {(scanStatus === 'stopped' || scanStatus === 'error') && (
              <Button variant="secondary" fullWidth onClick={() => startScanning()}>
                Nyalakan Kamera
              </Button>
            )}
          </div>

        </div>
      )}

    </main>
  )
}
