'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

export default function ScannerPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const [status, setStatus] = useState<'loading' | 'scanning' | 'stopped' | 'error' | 'unsupported'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startScanning = useCallback(async () => {
    if (!('BarcodeDetector' in window)) {
      setStatus('unsupported')
      return
    }

    setStatus('loading')
    let stopped = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })

      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()

      setStatus('scanning')

      // @ts-expect-error — BarcodeDetector not yet in TS lib
      const detector = new BarcodeDetector({ formats: ['qr_code'] })

      async function scan() {
        if (stopped) return
        try {
          const results = await detector.detect(videoRef.current!)
          if (results.length > 0 && !stopped) {
            stopped = true
            stopCamera()
            router.push(`/alk/data-peserta?qr=${encodeURIComponent(results[0].rawValue)}`)
            return
          }
        } catch { /* per-frame errors are normal */ }
        rafRef.current = requestAnimationFrame(scan)
      }

      rafRef.current = requestAnimationFrame(scan)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setStatus('error')
      setErrorMsg(
        msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')
          ? 'Izin kamera ditolak. Aktifkan kamera di pengaturan browser.'
          : 'Tidak dapat mengakses kamera.',
      )
    }

    return () => { stopped = true }
  }, [router, stopCamera])

  useEffect(() => {
    const cleanup = startScanning()
    return () => {
      cleanup?.then?.((fn) => fn?.())
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [startScanning])

  function handleStop() {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('stopped')
  }

  function handleBack() {
    stopCamera()
    router.back()
  }

  return (
    <main className="max-w-sm mx-auto min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold text-fg">Scanner</h1>
        <button onClick={handleBack} className="text-sm text-muted hover:text-fg transition-colors">
          ← Kembali
        </button>
      </div>

      {/* Camera — fills all available space */}
      <div className="relative flex-1 bg-fg overflow-hidden">

          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            autoPlay
          />

          {/* Loading */}
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-10 h-10 rounded-full border-2"
                style={{
                  borderColor: 'var(--accent)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            </div>
          )}

          {/* Stopped placeholder */}
          {status === 'stopped' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-fg">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--subtle)' }}>Kamera dimatikan</p>
            </div>
          )}

          {/* Error / unsupported */}
          {(status === 'error' || status === 'unsupported') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 bg-fg">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--red-light)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-center" style={{ color: 'var(--red-light)' }}>
                {status === 'unsupported'
                  ? 'Browser tidak mendukung scan QR. Gunakan Chrome atau Safari terbaru.'
                  : errorMsg}
              </p>
            </div>
          )}

          {/* Scan overlay: corner brackets + scan line */}
          {status === 'scanning' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-3/5 h-3/5">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-accent" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-accent" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-accent" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-accent" />
                <div
                  className="absolute inset-x-0 top-0 h-0.5 bg-accent opacity-80"
                  style={{ animation: 'scan-line 2s ease-in-out infinite' }}
                />
              </div>
            </div>
          )}
      </div>

      {/* Controls */}
      <div className="px-4 py-5 flex flex-col gap-3 shrink-0">
        <p className="text-sm text-muted text-center">
          {status === 'scanning'
            ? 'Arahkan kamera ke QR Code tiket'
            : status === 'loading'
              ? 'Memulai kamera...'
              : status === 'stopped'
                ? 'Nyalakan kamera kembali atau absen manual'
                : 'Gunakan Absen Manual di bawah'}
        </p>

        {status === 'scanning' && (
          <Button variant="secondary" fullWidth onClick={handleStop}>
            Stop Kamera
          </Button>
        )}

        {status === 'stopped' && (
          <Button variant="secondary" fullWidth onClick={() => startScanning()}>
            Nyalakan Kamera
          </Button>
        )}

        <Button fullWidth size="lg" onClick={() => { stopCamera(); router.push('/alk/data-peserta') }}>
          Absen Manual
        </Button>
      </div>
    </main>
  )
}
