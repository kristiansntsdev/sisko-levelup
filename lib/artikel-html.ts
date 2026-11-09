import sanitizeHtml from 'sanitize-html'

const YOUTUBE_HOSTS = new Set(['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'])

function isHttps(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function isYoutubeEmbed(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'https:' && YOUTUBE_HOSTS.has(u.hostname) && u.pathname.startsWith('/embed/')
  } catch {
    return false
  }
}

/**
 * Sanitizes Jodit output on every save. Only https images/links, YouTube embeds, no scripts or event handlers,
 * and base64 `data:` images are dropped (uploads go through /api/brim/artikel/upload and come back as Blob URLs).
 */
export function sanitizeArtikelHtml(html: string): string {
  const clean = sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'hr', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup', 'span',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption', 'iframe',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      iframe: ['src', 'width', 'height', 'allowfullscreen', 'title'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
      p: ['style'],
      h2: ['style'],
      h3: ['style'],
      h4: ['style'],
      span: ['style'],
      li: ['style'],
    },
    allowedStyles: {
      '*': {
        'text-align': [/^(left|right|center|justify)$/],
        color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i],
        'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i],
      },
    },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['https'] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: 'noopener noreferrer',
          ...(attribs.target ? { target: '_blank' } : {}),
        },
      }),
    },
    exclusiveFilter: (frame) => {
      if (frame.tag === 'img') return !isHttps(frame.attribs.src ?? '')
      if (frame.tag === 'iframe') return !isYoutubeEmbed(frame.attribs.src ?? '')
      return false
    },
  })
  return clean.trim()
}

/** Blob URLs of images inside sanitized article HTML (for cleanup on delete). */
export function artikelImageUrls(html: string): string[] {
  const out: string[] = []
  for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/gi)) out.push(m[1].replace(/&amp;/g, '&'))
  return out
}
