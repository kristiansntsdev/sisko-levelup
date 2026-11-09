import sharp from 'sharp'

/** Matches serverActions.bodySizeLimit in next.config.ts. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

// 800px leaves headroom over the largest use, the member card photo at ~110 CSS px on a 3x screen.
// WebP q80 matches the quality of AVIF q55 (PSNR within 0.2dB) on real LevelUP photos at ~30-50% more bytes.
// WebP is used over AVIF because it displays on iOS 14+ (iPhone 11 can be stuck on older iOS); AVIF needs iOS 16+.
const MAX_EDGE = 800
const WEBP = { quality: 80, effort: 5 }
// Guards server memory against decompression bombs. Phones send ~1600px, so this only ever stops abuse.
const MAX_INPUT_PIXELS = 50_000_000
// Only formats a browser upload can legitimately be. Notably excludes SVG, which libvips would otherwise parse.
const ALLOWED_INPUT = new Set(['jpeg', 'png', 'webp', 'heif'])

/** The bytes are not a photo we can read. */
export class UnreadablePhotoError extends Error {}

/** Re-encodes to WebP. Sharp drops all metadata by default, so EXIF (GPS location, device) never reaches storage. */
export async function convertProfilePhoto(input: Buffer, maxEdge: number = MAX_EDGE): Promise<Buffer> {
  try {
    const image = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    const { format } = await image.metadata()
    if (!ALLOWED_INPUT.has(format)) throw new Error(`format ${format}`)
    return await image
      .rotate() // applies EXIF orientation before it is stripped
      .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
      .webp(WEBP)
      .toBuffer()
  } catch {
    throw new UnreadablePhotoError()
  }
}
