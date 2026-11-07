// Server-only (uses secrets); never import from a client component.

/** Payload for pphtgd-official `POST /api/internal/levelup/dana/notify` (LevelUpDanaNotifyController). */
export type DanaNotifyPayload = {
  /** pic = link review PIC LevelUP Pusat (setelah Korwil ACC); keuangan = link tandai transfer (setelah PIC ACC) */
  stage: 'pic' | 'keuangan'
  kota: string
  event: string
  tanggal: string
  korwil: string
  koordinator: string | null
  hadir: number
  dana: number
  bank: string
  norek: string
  namarek: string
  link: string
}

export type DanaNotifyResult = { ok: true } | { ok: false; error: string }

/** Minta pphtgd mengirim link langkah berikutnya ke grup WA pengajuan kegiatan. Tanpa fallback: env kosong = error. */
export async function notifyPphtgdDana(payload: DanaNotifyPayload): Promise<DanaNotifyResult> {
  const base = process.env.PPHTGD_API_URL?.replace(/\/$/, '')
  const secret = process.env.PPHTGD_API_SECRET
  if (!base || !secret) return { ok: false, error: 'PPHTGD_API_URL / PPHTGD_API_SECRET belum diset' }
  try {
    const res = await fetch(`${base}/api/internal/levelup/dana/notify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (res.status !== 202 && !res.ok) return { ok: false, error: `pphtgd HTTP ${res.status}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Gagal menghubungi pphtgd' }
  }
}
