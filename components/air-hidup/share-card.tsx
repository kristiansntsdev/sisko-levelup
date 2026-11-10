'use client'
import { useEffect, useRef, useState } from 'react'
import { ANTON, BTN, BTN_OUTLINE, ERROR, LABEL, MONO, Strip } from '@/components/pwa/paper-ui'
import { ID_FONTS } from '@/components/pwa/member-card'
import { Icon, LOGO, Sheet, SheetHead } from '@/components/pwa/ui'
import { DropIcon, WATER } from './bar'
import { fmtTanggal } from './feed'

const CARD_BG = '#efe8da'
// iOS Safari gives up on canvases over 16,777,216 px (blank image).
const MAX_PIXELS = 16_000_000

export type ShareData = { namaKota: string; jumlah: number; isi: string; tanggal: string; foto: string }

/** WebKit can paint the first pass before embedded fonts and the logo decode, so it is rendered twice. */
function isWebKit() {
  const ua = navigator.userAgent
  return /AppleWebKit/.test(ua) && !/Chrome|Chromium|Android|Edg/.test(ua)
}

async function renderPng(node: HTMLElement) {
  const { toBlob } = await import('html-to-image')
  await Promise.all([...node.querySelectorAll('img')].map((i) => i.decode().catch(() => {})))
  const pixelRatio = Math.min(2, Math.sqrt(MAX_PIXELS / (node.offsetWidth * node.offsetHeight)))
  const opts = { pixelRatio, backgroundColor: CARD_BG }
  if (isWebKit()) await toBlob(node, opts)
  const blob = await toBlob(node, opts)
  if (!blob) throw new Error('toBlob returned null')
  return blob
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

/** Kartu 540px: digambar di luar layar lalu diubah ke PNG. */
function ShareCard({ d }: { d: ShareData }) {
  return (
    <div className={`${ID_FONTS} ${MONO} relative w-[540px] p-7 text-[#161616]`} style={{ background: CARD_BG }}>
      <div className="flex items-start justify-between gap-4">
        <p className={`${LABEL} text-[11px] font-bold text-[#57534e]`}>Air Hidup · {fmtTanggal(d.tanggal)}</p>
        <span className="shrink-0 -rotate-3 bg-[#e02a2f] px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- html-to-image embeds a plain img */}
          <img src={LOGO} alt="" width={72} height={28} className="block h-7 w-[72px]" />
        </span>
      </div>
      <p className={`${ANTON} mt-3 text-[44px] leading-[1.02] tracking-[.01em]`}>{d.namaKota}</p>
      <p className={`${ANTON} mt-1 flex items-center gap-2 text-[26px] leading-none`} style={{ color: WATER }}>
        <DropIcon className="h-6 w-6" />
        baru minum Air Hidup
      </p>
      <div className="relative mt-5 -rotate-1 bg-[#fffdf7] p-2.5 pb-3 shadow-[0_14px_22px_-12px_rgba(40,30,10,.5)]">
        <div className="relative h-[250px] w-full overflow-hidden bg-[#e02a2f]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.foto || LOGO} alt="" className={`absolute inset-0 h-full w-full ${d.foto ? 'object-cover' : 'object-contain p-12'}`} />
        </div>
        <p className={`${MONO} px-1 pt-3 text-[15px] font-bold leading-snug`}>“{d.isi}”</p>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <p className={`${ANTON} text-[34px] leading-none`}>
          {d.jumlah} <span className="text-[18px]">orang</span>
        </p>
        <p className={`${MONO} max-w-[260px] text-right text-[11px] leading-snug text-[#44403c]`}>
          “Barangsiapa haus, baiklah ia datang kepada-Ku dan minum.” · Yohanes 7:37
        </p>
      </div>
    </div>
  )
}

export function ShareSheet({ data, onClose }: { data: ShareData; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [img, setImg] = useState<{ url: string; file: File } | null>(null)
  const [canShare, setCanShare] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    let url = ''
    ;(async () => {
      try {
        await document.fonts.ready
        if (cancelled || !ref.current) return
        const blob = await renderPng(ref.current)
        if (cancelled) return
        const file = new File([blob], `air-hidup-${slug(data.namaKota) || 'kota'}-${data.tanggal}.png`, { type: 'image/png' })
        url = URL.createObjectURL(blob)
        setImg({ url, file })
        setCanShare(typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] }))
      } catch (e) {
        if (cancelled) return
        console.error('air-hidup share card', e)
        setError('Gagal membuat gambar. Tutup lalu coba lagi.')
      }
    })()
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [data])

  function download() {
    if (!img) return
    const a = document.createElement('a')
    a.href = img.url
    a.download = img.file.name
    a.click()
  }

  async function share() {
    if (!img) return
    try {
      await navigator.share({ files: [img.file] })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError('Gagal membagikan. Pakai Unduh Gambar.')
    }
  }

  return (
    <>
      <Sheet open onClose={onClose}>
        <SheetHead title="Kartu Air Hidup" sub="Bagikan ke grup WhatsApp atau story supaya kota lain ikut minum." />
        <div className="max-h-[48vh] overflow-y-auto rounded-[10px] ring-1 ring-[#161616]/15" style={{ background: CARD_BG }}>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob URL preview
            <img src={img.url} alt="Pratinjau kartu Air Hidup" className="block h-auto w-full" />
          ) : (
            !error && <p className={`${LABEL} py-12 text-center text-[11px] text-[#57534e]`}>Membuat gambar…</p>
          )}
        </div>
        {error && (
          <p role="alert" className={`${ERROR} mt-3`}>
            {error}
          </p>
        )}
        <div className="mt-4 space-y-2.5">
          {canShare && (
            <button type="button" onClick={share} disabled={!img} className={BTN}>
              <Strip tone="ink" className="py-2.5 text-[16px]">
                <Icon name="share" className="h-4 w-4" />
                Bagikan / Simpan
              </Strip>
            </button>
          )}
          {canShare ? (
            <button type="button" onClick={download} disabled={!img} className={BTN_OUTLINE}>
              Unduh Gambar
            </button>
          ) : (
            <button type="button" onClick={download} disabled={!img} className={BTN}>
              <Strip tone="ink" className="py-2.5 text-[16px]">
                <Icon name="image" className="h-4 w-4" />
                Unduh Gambar
              </Strip>
            </button>
          )}
        </div>
      </Sheet>
      <div aria-hidden className="pointer-events-none fixed top-0 -left-[10000px]">
        <div ref={ref}>
          <ShareCard d={data} />
        </div>
      </div>
    </>
  )
}
