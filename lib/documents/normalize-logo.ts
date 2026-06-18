/** Normalize pengaturan_kota.logo to a usable img src */
export function normalizeLogoSrc(logo: string | null | undefined): string {
  if (!logo?.trim()) return ''
  const v = logo.trim()
  if (v.startsWith('data:') || v.startsWith('http://') || v.startsWith('https://')) {
    return v
  }
  return `data:image/png;base64,${v}`
}
