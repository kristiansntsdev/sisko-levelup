import type { KorwilOption } from '@/lib/surat-keuangan-data'

export type KorwilResult = { ok: true; korwil: KorwilOption[] } | { ok: false; error: string }

/** Daftar korwil aktif dari pphtgd-official (read-only API). Tanpa fallback: env kosong = error. */
export async function listKorwilPphtgd(): Promise<KorwilResult> {
  const base = process.env.PPHTGD_API_URL?.replace(/\/$/, '')
  const secret = process.env.PPHTGD_API_SECRET
  if (!base || !secret) return { ok: false, error: 'PPHTGD_API_URL / PPHTGD_API_SECRET belum diset' }
  try {
    const res = await fetch(`${base}/api/internal/levelup/korwils`, {
      headers: { Authorization: `Bearer ${secret}`, Accept: 'application/json' },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return { ok: false, error: `pphtgd HTTP ${res.status}` }
    const json = (await res.json()) as {
      korwils?: Array<{ id: number; nama: string; koordinator: string | null; kota: string | null; wa?: string | null }>
    }
    return {
      ok: true,
      korwil: (json.korwils ?? []).map((k) => ({
        id: k.id,
        nama: k.nama,
        koordinator: k.koordinator,
        kota: k.kota,
        wa: k.wa ?? null,
      })),
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Gagal memuat korwil' }
  }
}
