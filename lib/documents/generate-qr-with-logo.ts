import QRCode from 'qrcode'
import { normalizeLogoSrc } from '@/lib/documents/normalize-logo'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function generateQrWithLogo(
  data: string,
  logoSrc: string | null | undefined,
  size = 100,
): Promise<string> {
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, data, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark: '#1c1917', light: '#ffffff' },
  })

  const logo = normalizeLogoSrc(logoSrc)
  if (logo) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      try {
        const img = await loadImage(logo)
        const logoSize = Math.round(size * 0.24)
        const pad = Math.round(logoSize * 0.15)
        const x = (size - logoSize) / 2
        const y = (size - logoSize) / 2

        ctx.fillStyle = '#000000'
        ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2)

        ctx.drawImage(img, x, y, logoSize, logoSize)
      } catch {
        // QR without logo overlay if image fails to load
      }
    }
  }

  return canvas.toDataURL('image/png')
}
