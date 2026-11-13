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

/** Typography for article HTML (no tailwind typography plugin in this project). Zine look: marker headings,
 *  highlighted bold, sticky-note quotes, polaroid images. Expects --font-marker from ZinePage. */
export const ARTIKEL_BODY = [
  'text-[17px] leading-[1.75] text-[#1c1917] break-words',
  '[&_p]:my-4',
  // Raised initial on the opening paragraph: the first letter is bigger and shares the first line's baseline,
  // so it rises above the rest of the line. leading-[.8] keeps it from stretching the line box.
  '[&>p:first-of-type::first-letter]:font-[family-name:var(--font-marker)] [&>p:first-of-type::first-letter]:text-[2.4em] [&>p:first-of-type::first-letter]:leading-[.8] [&>p:first-of-type::first-letter]:text-[#e02a2f] [&>p:first-of-type::first-letter]:mr-1',
  // Headings in marker font; h2 gets the yellow highlighter
  '[&_h2]:mt-11 [&_h2]:mb-4 [&_h2]:inline-block [&_h2]:font-[family-name:var(--font-marker)] [&_h2]:font-normal [&_h2]:uppercase [&_h2]:text-[clamp(1.6rem,4.5vw,2.1rem)] [&_h2]:leading-[1.15] [&_h2]:bg-[linear-gradient(transparent_58%,#ffd83d_58%)] [&_h2]:[box-decoration-break:clone] [&_h2]:px-1 [&_h2]:-rotate-[.6deg]',
  '[&_h3]:mt-9 [&_h3]:mb-3 [&_h3]:font-[family-name:var(--font-marker)] [&_h3]:font-normal [&_h3]:uppercase [&_h3]:text-[clamp(1.3rem,3.6vw,1.6rem)] [&_h3]:leading-tight [&_h3]:before:content-["//"] [&_h3]:before:mr-2 [&_h3]:before:text-[#e02a2f]',
  '[&_h4]:mt-7 [&_h4]:mb-2 [&_h4]:text-[18px] [&_h4]:font-extrabold [&_h4]:uppercase [&_h4]:tracking-wide',
  // Bold reads like a highlighter pass
  '[&_strong]:font-extrabold [&_strong]:bg-[linear-gradient(transparent_62%,#ffd83d_62%)] [&_strong]:[box-decoration-break:clone] [&_strong]:px-0.5',
  '[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-7 [&_li]:my-1.5 [&_li::marker]:text-[#e02a2f] [&_li::marker]:font-extrabold',
  '[&_a]:text-[#e02a2f] [&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-[3px]',
  // Sticky note
  '[&_blockquote]:relative [&_blockquote]:my-9 [&_blockquote]:mx-1 [&_blockquote]:-rotate-1 [&_blockquote]:bg-[#ffe36e] [&_blockquote]:px-6 [&_blockquote]:py-5 [&_blockquote]:text-[16.5px] [&_blockquote]:leading-[1.65] [&_blockquote]:shadow-[0_14px_22px_-12px_rgba(40,30,10,.55)] [&_blockquote_p]:my-2',
  // Polaroid images, alternating tilt
  '[&_img]:my-8 [&_img]:h-auto [&_img]:max-w-full [&_img]:bg-[#fffdf7] [&_img]:p-2.5 [&_img]:pb-4 [&_img]:shadow-[0_16px_26px_-12px_rgba(40,30,10,.55)] [&_img:nth-of-type(odd)]:-rotate-[1.2deg] [&_img:nth-of-type(even)]:rotate-[1.2deg]',
  '[&_iframe]:my-8 [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full [&_iframe]:bg-[#fffdf7] [&_iframe]:p-2.5 [&_iframe]:shadow-[0_16px_26px_-12px_rgba(40,30,10,.55)]',
  '[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[15.5px] [&_td]:border [&_td]:border-[#161616]/25 [&_td]:p-2.5 [&_th]:border [&_th]:border-[#161616] [&_th]:bg-[#161616] [&_th]:text-[#fbf6ec] [&_th]:p-2.5 [&_th]:font-[family-name:var(--font-marker)] [&_th]:font-normal [&_th]:uppercase [&_th]:text-left',
  // Divider = short red marker stroke
  '[&_hr]:my-10 [&_hr]:mx-auto [&_hr]:h-1.5 [&_hr]:w-24 [&_hr]:border-0 [&_hr]:bg-[#e02a2f] [&_hr]:-rotate-2',
].join(' ')
