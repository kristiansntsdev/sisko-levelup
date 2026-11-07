// Server-only (uses secrets); never import from a client component.
import { randomBytes } from 'node:crypto'

export type DanaPeran = 'korwil' | 'pic' | 'keuangan'

/** 32 random bytes → 43 url-safe chars; one secret per role so a Korwil link can never act as PIC or Keuangan. */
function token(): string {
  return randomBytes(32).toString('base64url')
}

export function newDanaTokens(): { token_korwil: string; token_pic: string; token_keuangan: string } {
  return { token_korwil: token(), token_pic: token(), token_keuangan: token() }
}

/** Link tanpa login di domain produksi. AUTH_URL wajib (origin polos, lihat decision next_config). */
export function danaLinkUrl(t: string): string {
  const base = process.env.AUTH_URL?.replace(/\/$/, '')
  if (!base) throw new Error('AUTH_URL belum di-set')
  return `${base}/dana/${t}`
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
