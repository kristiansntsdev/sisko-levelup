export type QRPayload = { p: string; e: string; ev: string }

export function decodeQR(raw: string): QRPayload | null {
  try {
    const parsed = JSON.parse(raw)
    // email (e) may be empty if ticket was generated without a session email
    if (parsed.p == null || parsed.ev == null) return null
    const p = String(parsed.p)
    const ev = String(parsed.ev)
    if (!p || !ev) return null
    return { p, e: String(parsed.e ?? ''), ev }
  } catch {
    return null
  }
}
