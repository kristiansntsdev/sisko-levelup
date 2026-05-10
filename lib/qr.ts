export type QRPayload = { p: string; e: string; ev: string }

export function decodeQR(raw: string): QRPayload | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed.p && parsed.e && parsed.ev) return parsed as QRPayload
    return null
  } catch {
    return null
  }
}
