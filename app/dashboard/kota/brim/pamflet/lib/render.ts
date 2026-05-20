import type { FontFamily, AnyElement, Background, TextEl, ImageEl, ShapeEl, StickerEl } from './types'

export const PLACEHOLDER_FILL = '#f5f5f4'

// ── Fonts ─────────────────────────────────────────────────────
// next/font generates hashed family names exposed as CSS variables on <html>.
// Konva.Text needs a literal font-family string, so resolve the variable once.
const FONT_VAR: Record<FontFamily, string> = {
  'DM Sans': '--font-dm-sans',
  'Space Grotesk': '--font-space-grotesk',
  'Instrument Serif': '--font-instrument-serif',
  'DM Mono': '--font-dm-mono',
}
const fontCache: Partial<Record<FontFamily, string>> = {}

export function resolveFont(family: FontFamily): string {
  const cached = fontCache[family]
  if (cached) return cached
  if (typeof window === 'undefined') return `"${family}", sans-serif`
  const v = getComputedStyle(document.documentElement).getPropertyValue(FONT_VAR[family]).trim()
  const resolved = v ? `${v}, sans-serif` : `"${family}", sans-serif`
  fontCache[family] = resolved
  return resolved
}

// ── Box transform — applied to the per-element <Group> ────────
// Group is positioned at the element centre with a half-size offset so
// children draw at local (0,0)–(w,h) and rotation pivots around centre.
export function boxAttrs(el: AnyElement) {
  return {
    x: el.x + el.w / 2,
    y: el.y + el.h / 2,
    offsetX: el.w / 2,
    offsetY: el.h / 2,
    rotation: el.rotation,
    width: el.w,
    height: el.h,
  }
}

// ── Text → Konva.Text config ──────────────────────────────────
export function textAttrs(el: TextEl) {
  const f = el.font
  return {
    text: f.uppercase ? el.content.toUpperCase() : el.content,
    width: el.w,
    height: el.h,
    fontFamily: resolveFont(f.family),
    fontSize: f.size,
    fontStyle: `${f.italic ? 'italic ' : ''}${f.weight}`,
    fill: f.color,
    align: f.align,
    verticalAlign: 'top' as const,
    lineHeight: f.lineHeight,
    letterSpacing: f.letterSpacing,
    wrap: 'word' as const,
  }
}

// ── Image → Konva.Image draw rect + crop ──────────────────────
export interface ImageDraw {
  x: number; y: number; width: number; height: number
  crop?: { x: number; y: number; width: number; height: number }
}

/** Centre-crop rect (source pixels) that fills a box of the given aspect ratio. */
export function coverCrop(boxW: number, boxH: number, natW: number, natH: number) {
  const boxAR = boxW / boxH
  const natAR = natW / natH
  if (natAR > boxAR) {
    const cw = natH * boxAR
    return { x: (natW - cw) / 2, y: 0, width: cw, height: natH }
  }
  const ch = natW / boxAR
  return { x: 0, y: (natH - ch) / 2, width: natW, height: ch }
}

export function imageDrawAttrs(el: ImageEl, natural: { width: number; height: number }): ImageDraw {
  const { width: nw, height: nh } = natural
  if (nw <= 0 || nh <= 0) return { x: 0, y: 0, width: el.w, height: el.h }

  // Explicit crop window (set in crop mode) — draw it filling the box.
  if (el.crop) {
    return { x: 0, y: 0, width: el.w, height: el.h, crop: el.crop }
  }

  if (el.fit === 'cover') {
    return { x: 0, y: 0, width: el.w, height: el.h, crop: coverCrop(el.w, el.h, nw, nh) }
  }

  // contain: scale the whole image to fit inside the box, centred.
  const scale = Math.min(el.w / nw, el.h / nh)
  const dw = nw * scale, dh = nh * scale
  return { x: (el.w - dw) / 2, y: (el.h - dh) / 2, width: dw, height: dh }
}

// ── Shapes → Konva.Rect / Konva.Circle config ─────────────────
export function shapeAttrs(el: ShapeEl) {
  const fill = parseFill(el.fill, el.w, el.h)
  const stroke = el.stroke && el.strokeWidth
    ? { stroke: el.stroke, strokeWidth: el.strokeWidth }
    : {}
  if (el.kind === 'circle') {
    return {
      shape: 'circle' as const,
      x: el.w / 2, y: el.h / 2, radius: el.w / 2,
      ...fill, ...stroke,
    }
  }
  return {
    shape: 'rect' as const,
    x: 0, y: 0, width: el.w, height: el.h,
    cornerRadius: el.kind === 'rect' ? (el.radius ?? 0) : 0,
    ...fill, ...stroke,
  }
}

// ── Sticker → tinted SVG data URL ─────────────────────────────
export function stickerDataUrl(el: StickerEl): string {
  let svg = el.src.replaceAll('currentColor', el.color)
  // Picker SVGs use width/height="100%"; an <img>/canvas rasteriser needs an
  // absolute intrinsic size, so derive one from the viewBox.
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  if (vb && !/<svg[^>]*\swidth="\d/.test(svg)) {
    svg = svg
      .replace(/\s(?:width|height)="100%"/g, '')
      .replace('<svg', `<svg width="${vb[1]}" height="${vb[2]}"`)
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// ── Background → first node in the layer ──────────────────────
export type BgNode =
  | { kind: 'rect'; attrs: Record<string, unknown> }
  | { kind: 'image'; src: string; fit: 'cover' | 'contain' }

export function bgNode(bg: Background, w: number, h: number): BgNode {
  if (bg.kind === 'color') return { kind: 'rect', attrs: { fill: bg.color } }
  if (bg.kind === 'gradient') {
    return { kind: 'rect', attrs: parseLinear(`linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`, w, h) }
  }
  return { kind: 'image', src: bg.src, fit: bg.fit }
}

// ── Fill / gradient parsing ───────────────────────────────────
function parseFill(fill: string, w: number, h: number): Record<string, unknown> {
  if (!fill || fill === 'transparent') return { fill: undefined }
  if (fill.startsWith('linear-gradient')) return parseLinear(fill, w, h)
  if (fill.startsWith('radial-gradient')) return parseRadial(fill, w, h)
  return { fill }
}

/** Split on top-level commas, ignoring commas inside parentheses (rgba()). */
function splitTop(s: string): string[] {
  const parts: string[] = []
  let depth = 0, cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = '' }
    else cur += ch
  }
  if (cur.trim()) parts.push(cur.trim())
  return parts
}

/** Turn `["#000", "#fff 60%"]` into Konva colorStops `[0, "#000", 0.6, "#fff"]`. */
function parseStops(parts: string[]): (number | string)[] {
  const out: (number | string)[] = []
  parts.forEach((p, i) => {
    const m = p.match(/^(.+?)(?:\s+([\d.]+)%)?$/)
    const color = (m?.[1] ?? p).trim()
    const pct = m?.[2] != null ? parseFloat(m[2]) / 100 : (parts.length > 1 ? i / (parts.length - 1) : 0)
    out.push(pct, color)
  })
  return out
}

function keywordAngle(kw: string): number {
  if (kw.includes('top')) return 0
  if (kw.includes('bottom')) return 180
  if (kw.includes('left')) return 270
  if (kw.includes('right')) return 90
  return 180
}

function parseLinear(fill: string, w: number, h: number): Record<string, unknown> {
  const inner = fill.slice(fill.indexOf('(') + 1, fill.lastIndexOf(')'))
  const parts = splitTop(inner)
  let angle = 180
  if (parts[0] && (/deg\s*$/.test(parts[0]) || /^to\s/.test(parts[0]))) {
    const head = parts.shift()!
    angle = head.includes('deg') ? parseFloat(head) : keywordAngle(head)
  }
  const rad = (angle * Math.PI) / 180
  const dx = Math.sin(rad), dy = -Math.cos(rad)
  const len = Math.abs(w * dx) + Math.abs(h * dy)
  const cx = w / 2, cy = h / 2
  return {
    fillLinearGradientStartPoint: { x: cx - (dx * len) / 2, y: cy - (dy * len) / 2 },
    fillLinearGradientEndPoint: { x: cx + (dx * len) / 2, y: cy + (dy * len) / 2 },
    fillLinearGradientColorStops: parseStops(parts),
  }
}

function parseRadial(fill: string, w: number, h: number): Record<string, unknown> {
  const inner = fill.slice(fill.indexOf('(') + 1, fill.lastIndexOf(')'))
  const parts = splitTop(inner)
  let cx = w / 2, cy = h / 2
  if (parts[0] && /circle|ellipse|\bat\b/.test(parts[0])) {
    const desc = parts.shift()!
    const at = desc.match(/at\s+([\d.]+)%\s+([\d.]+)%/)
    if (at) { cx = (parseFloat(at[1]) / 100) * w; cy = (parseFloat(at[2]) / 100) * h }
  }
  return {
    fillRadialGradientStartPoint: { x: cx, y: cy },
    fillRadialGradientEndPoint: { x: cx, y: cy },
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndRadius: Math.max(w, h),
    fillRadialGradientColorStops: parseStops(parts),
  }
}
