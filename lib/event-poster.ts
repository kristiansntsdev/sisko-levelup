const POSTER_BASE = 'https://sisko.levelupgen.com/uploads/poster/'

/** Legacy posterevent first; empty → v2 Blob image_url. */
export function resolveEventPosterUrl(
  posterevent?: string | null,
  imageUrl?: string | null,
): string {
  const legacy = (posterevent ?? '').trim()
  if (legacy) {
    if (/^https?:\/\//i.test(legacy)) return legacy
    return `${POSTER_BASE}${legacy}`
  }
  return (imageUrl ?? '').trim()
}
