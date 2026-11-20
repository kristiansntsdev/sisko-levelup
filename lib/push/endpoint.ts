/** Hanya endpoint push milik layanan browser yang dikenal (guard SSRF): server akan POST ke URL ini. Murni. */
const HOST_TETAP = new Set(['fcm.googleapis.com', 'web.push.apple.com'])
const AKHIRAN_HOST = ['.push.services.mozilla.com', '.notify.windows.com', '.push.apple.com']

export function endpointDiizinkan(raw: unknown): raw is string {
  if (typeof raw !== 'string' || raw.length > 1024) return false
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return false
  }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return false
  const host = u.hostname.toLowerCase()
  return HOST_TETAP.has(host) || AKHIRAN_HOST.some((a) => host.endsWith(a))
}
