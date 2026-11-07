// Server-only (uses secrets); never import from a client component.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export type DanaPeran = 'korwil' | 'pic' | 'keuangan'

/** 32 random bytes → 43 url-safe chars; one secret per role so a Korwil link can never act as PIC or Keuangan. */
function token(): string {
  return randomBytes(32).toString('base64url')
}

export function newDanaTokens(): { token_korwil: string; token_pic: string; token_keuangan: string } {
  return { token_korwil: token(), token_pic: token(), token_keuangan: token() }
}

/** Origin produksi untuk link di luar app. AUTH_URL wajib (origin polos, lihat decision next_config). */
function appOrigin(): string {
  const base = process.env.AUTH_URL?.replace(/\/$/, '')
  if (!base) throw new Error('AUTH_URL belum di-set')
  return base
}

/** Link tanpa login di domain produksi. */
export function danaLinkUrl(t: string): string {
  return `${appOrigin()}/dana/${t}`
}

// ── QR tanda tangan Surat Keuangan → /verifikasi/{kode} ─────────────────────────────────────────
// kode = id_reimburse + 16 char sha256(token_korwil) (96 bit, pendek supaya QR renggang meski ada logo di tengah):
// tidak bisa ditebak, tidak membuka link
// approval (hash satu arah), ikut mati saat ALK Kota submit ulang (token baru), dan tanpa kolom DB baru.

function verifikasiHash(tokenKorwil: string): string {
  return createHash('sha256').update(`surat-verifikasi:${tokenKorwil}`).digest('base64url').slice(0, 16)
}

export function verifikasiKode(idReimburse: number, tokenKorwil: string): string {
  return `${idReimburse}-${verifikasiHash(tokenKorwil)}`
}

/** null = format salah (tanpa query DB). */
export function parseVerifikasiKode(kode: string): { idReimburse: number; hash: string } | null {
  const m = /^(\d{1,10})-([A-Za-z0-9_-]{16})$/.exec(kode)
  return m ? { idReimburse: Number(m[1]), hash: m[2] } : null
}

export function cekVerifikasiHash(hash: string, tokenKorwil: string): boolean {
  const a = Buffer.from(hash)
  const b = Buffer.from(verifikasiHash(tokenKorwil))
  return a.length === b.length && timingSafeEqual(a, b)
}

export function verifikasiUrl(kode: string): string {
  return `${appOrigin()}/verifikasi/${kode}`
}

/** Pesan yang dikirim ALK Kota ke WhatsApp ketua korwil. */
export function korwilWaText(input: {
  koordinator: string
  kota: string
  event: string
  tanggal: string
  link: string
}): string {
  const sapaan = input.koordinator ? `Shalom Bapak/Ibu ${input.koordinator},` : 'Shalom Bapak/Ibu,'
  return [
    sapaan,
    '',
    `Kami dari ${input.kota} mengajukan support dana untuk event *${input.event}* (${input.tanggal}).`,
    '',
    'Mohon review & persetujuannya di link berikut (tanpa login):',
    input.link,
    '',
    'Terima kasih, Tuhan Yesus memberkati.',
  ].join('\n')
}

/** wa.me ke nomor korwil (digit internasional, mis. 6281234567890); null kalau nomor tidak ada. */
export function korwilWaUrl(wa: string | null, text: string): string | null {
  const digits = (wa ?? '').replace(/\D/g, '')
  if (digits.length < 10) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}
