// Browser-side first step of a profile photo upload. WebP conversion has to happen on the server because
// Safari's canvas can only output PNG or JPEG, but this step still matters:
// - phone photos often exceed the 4MB server action limit (and Vercel's 4.5MB body limit)
// - the browser can decode what the server can't: Safari reads iPhone HEIC, which sharp's prebuilt binary doesn't
// - re-encoding drops EXIF, so GPS location never leaves the device
const MAX_EDGE = 1600
const QUALITY = 0.9

/** Throws if the browser cannot decode the file (not an image, or a format like HEIC outside Safari). */
export async function shrinkPhotoForUpload(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no 2d context')
    ctx.fillStyle = '#fff' // JPEG has no alpha: transparent PNGs would otherwise turn black
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
    canvas.width = canvas.height = 0 // iOS holds canvas memory until it is resized
    if (!blob) throw new Error('canvas export failed')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
