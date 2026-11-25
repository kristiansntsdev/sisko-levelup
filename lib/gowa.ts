// Kirim pesan ke grup WhatsApp lewat GOWA. Server-only: membaca secret dari env.
// Env kosong = { ok: false } tanpa default (tidak ada fallback diam-diam).

export type GowaResult = { ok: true } | { ok: false; error: string }

export async function sendWaGroup(
  text: string,
  groupId: string | undefined = process.env.SISKO_WA_GROUP_ID,
): Promise<GowaResult> {
  const base = process.env.GOWA_BASE_URL?.replace(/\/$/, '')
  const auth = process.env.GOWA_BASIC_AUTH
  const device = process.env.GOWA_DEVICE_ID
  if (!base || !auth || !device || !groupId) {
    return { ok: false, error: 'env GOWA belum lengkap' }
  }
  try {
    const res = await fetch(`${base}/send/message`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(auth).toString('base64'),
        'X-Device-Id': device,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: groupId, message: text }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    return res.ok ? { ok: true } : { ok: false, error: `GOWA HTTP ${res.status}` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Gagal menghubungi GOWA' }
  }
}
