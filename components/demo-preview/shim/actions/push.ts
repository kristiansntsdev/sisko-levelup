'use client'
// Demo: tidak ada Web Push. Tanpa kunci publik, kartu + menu Notifikasi menampilkan "Belum tersedia".
export async function getPushConfig(): Promise<{ publicKey: string | null }> {
  return { publicKey: null }
}
export async function simpanPush(_input?: unknown, _opts?: unknown): Promise<{ ok: true; uji: boolean }> {
  return { ok: true, uji: false }
}
export async function hapusPush(_endpoint?: string): Promise<{ ok: true }> {
  return { ok: true }
}
export async function lepasPushPeserta(): Promise<void> {}
