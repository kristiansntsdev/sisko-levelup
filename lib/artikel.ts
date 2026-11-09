/** Pure helpers for Artikel (safe on client and server). */

export const ARTIKEL_JUDUL_MAX = 200
export const ARTIKEL_RINGKASAN_MAX = 300
export const KOMENTAR_NAMA_MAX = 60
export const KOMENTAR_ISI_MAX = 1000
export const KOMENTAR_JEDA_DETIK = 20

export type ArtikelStatus = 'draft' | 'published'

export function slugify(input: string): string {
  const s = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' dan ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
    .replace(/-+$/g, '')
  return s || 'artikel'
}

/** Plain text of sanitized HTML, used when ringkasan is left empty. */
export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function excerpt(html: string, max = ARTIKEL_RINGKASAN_MAX): string {
  const t = stripHtml(html)
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

export function formatTanggalArtikel(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
}

export function formatWaktuKomentar(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  })
}

/** Typography for article HTML (no tailwind typography plugin in this project). */
export const ARTIKEL_BODY = [
  'text-[17px] leading-[1.75] text-[#1c1917] break-words',
  '[&_p]:my-4 [&_h2]:mt-9 [&_h2]:mb-3 [&_h2]:text-[26px] [&_h2]:font-extrabold [&_h2]:leading-tight',
  '[&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:text-[21px] [&_h3]:font-extrabold [&_h3]:leading-tight',
  '[&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:text-[18px] [&_h4]:font-bold',
  '[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1',
  '[&_a]:text-[#e02a2f] [&_a]:underline [&_a]:underline-offset-2',
  '[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#ffd83d] [&_blockquote]:bg-[#fffdf7] [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:italic',
  '[&_img]:my-5 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-sm',
  '[&_iframe]:my-5 [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full',
  '[&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[#161616]/20 [&_td]:p-2 [&_th]:border [&_th]:border-[#161616]/20 [&_th]:bg-[#efe8da] [&_th]:p-2',
  '[&_hr]:my-8 [&_hr]:border-[#161616]/20',
].join(' ')
