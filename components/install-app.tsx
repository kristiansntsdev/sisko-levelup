'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'

type Platform = 'android' | 'ios' | null

// Chrome/Edge Android: event non-standar, belum ada di lib.dom
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  // iPadOS 13+ mengaku "Macintosh", bedakan lewat touch
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIOS) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return null
}

// Safari asli iOS: in-app browser (IG, FB, Line) tidak punya token "Safari",
// Chrome/Firefox/Edge iOS punya token sendiri
function isIOSSafari(): boolean {
  const ua = navigator.userAgent
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|DuckDuckGo|YaBrowser/.test(ua)
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function InstallApp() {
  const [platform, setPlatform] = useState<Platform>(null)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showSteps, setShowSteps] = useState(false)
  const [iosSafari, setIosSafari] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Sudah dibuka dari home screen -> tidak perlu tombol install
    if (isStandalone()) return
    setPlatform(detectPlatform())
    setIosSafari(isIOSSafari())

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setPlatform(null)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!platform) return null

  async function handleClick() {
    // Android + browser dukung prompt native -> langsung dialog install
    if (platform === 'android' && deferred) {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      setDeferred(null)
      if (outcome === 'accepted') setPlatform(null)
      return
    }
    // iOS (tidak ada API install) / Android tanpa prompt -> tampilkan langkah manual
    setShowSteps((v) => !v)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <Button variant="ghost" fullWidth onClick={handleClick}>
        <span className="flex items-center justify-center gap-2">
          {platform === 'ios' ? <AppleIcon /> : <AndroidIcon />}
          Install di {platform === 'ios' ? 'iOS' : 'Android'}
        </span>
      </Button>

      {showSteps && (
        <div className="rounded-btn border border-border bg-surface px-4 py-3 text-[13px] text-fg2">
          {platform === 'ios' ? (
            <>
            {!iosSafari && (
              <div className="mb-2 flex flex-col gap-2 rounded-[8px] bg-amber-light px-3 py-2 text-amber-dark">
                <span>
                  Browser ini tidak bisa install aplikasi. Salin link lalu buka di <strong>Safari</strong>.
                </span>
                <Button variant="secondary" size="sm" onClick={copyLink}>
                  {copied ? 'Link tersalin ✓' : 'Salin link'}
                </Button>
              </div>
            )}
            <ol className="list-decimal pl-4 flex flex-col gap-1">
              <li>
                Buka halaman ini di <strong className="text-fg">Safari</strong> (wajib, browser lain tidak bisa)
              </li>
              <li>
                Tap tombol <strong className="text-fg">Share</strong> <ShareIcon /> di browser
              </li>
              <li>
                Pilih <strong className="text-fg">Tambah ke Layar Utama</strong> (Add to Home Screen)
              </li>
              <li>
                Tap <strong className="text-fg">Tambah</strong>
              </li>
            </ol>
            </>
          ) : (
            <ol className="list-decimal pl-4 flex flex-col gap-1">
              <li>
                Tap menu <strong className="text-fg">⋮</strong> di pojok kanan atas browser
              </li>
              <li>
                Pilih <strong className="text-fg">Tambahkan ke Layar utama</strong> atau{' '}
                <strong className="text-fg">Instal aplikasi</strong>
              </li>
              <li>
                Tap <strong className="text-fg">Instal</strong> / <strong className="text-fg">Tambah</strong>
              </li>
            </ol>
          )}
        </div>
      )}
    </div>
  )
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.37 12.62c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-2.99-.79-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.88 1.15 9.13.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.77-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.39-.92-2.41-3.65zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28z" />
    </svg>
  )
}

function AndroidIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.6 9.48l1.84-3.18a.38.38 0 00-.66-.38l-1.87 3.23a11.4 11.4 0 00-9.82 0L5.22 5.92a.38.38 0 00-.66.38L6.4 9.48A10.8 10.8 0 001 18h22a10.8 10.8 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg className="inline -mt-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )
}
