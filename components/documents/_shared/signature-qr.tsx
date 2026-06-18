'use client'

import { useEffect, useState } from 'react'
import { generateQrWithLogo } from '@/lib/documents/generate-qr-with-logo'

type Props = {
  data: string
  logoSrc: string | null
  size?: number
  className?: string
}

export function SignatureQr({ data, logoSrc, size = 100, className }: Props) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    generateQrWithLogo(data, logoSrc, size)
      .then((url) => {
        if (!cancelled) setSrc(url)
      })
      .catch(() => {
        if (!cancelled) setSrc(null)
      })
    return () => {
      cancelled = true
    }
  }, [data, logoSrc, size])

  if (!src) {
    return (
      <div
        className={className ?? 'doc-sign-qr-placeholder'}
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="QR Tanda Tangan"
      className={className ?? 'doc-sign-qr'}
      width={size}
      height={size}
    />
  )
}
