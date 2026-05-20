import type { AnyElement, OrgInfo, PamfletDoc, TextFont, ShapeEl, TextEl, ImageEl } from './types'
import { uid, CANVAS_SIZE, CANVAS_H } from './types'

// ── Color presets ─────────────────────────────────────────────
const ACCENT = '#5b5bd6'
const ACCENT_DARK = '#3838a8'
const ACCENT_LIGHT = '#e7e7fb'

// ── Builders ──────────────────────────────────────────────────
function txt(opts: {
  id?: string
  x: number; y: number; w: number; h: number; rotation?: number
  content: string
  font: Partial<TextFont> & { size: number }
}): TextEl {
  return {
    id: opts.id ?? uid('t'),
    type: 'text',
    x: opts.x, y: opts.y, w: opts.w, h: opts.h, rotation: opts.rotation ?? 0,
    content: opts.content,
    font: {
      family: opts.font.family ?? 'DM Sans',
      size: opts.font.size,
      weight: opts.font.weight ?? 600,
      italic: opts.font.italic ?? false,
      color: opts.font.color ?? '#1c1917',
      align: opts.font.align ?? 'left',
      lineHeight: opts.font.lineHeight ?? 1.2,
      letterSpacing: opts.font.letterSpacing ?? 0,
      uppercase: opts.font.uppercase ?? false,
    },
  }
}

function rect(opts: {
  id?: string
  x: number; y: number; w: number; h: number; rotation?: number
  fill: string; radius?: number; stroke?: string; strokeWidth?: number
}): ShapeEl {
  return {
    id: opts.id ?? uid('r'),
    type: 'shape',
    kind: 'rect',
    x: opts.x, y: opts.y, w: opts.w, h: opts.h, rotation: opts.rotation ?? 0,
    fill: opts.fill,
    radius: opts.radius ?? 0,
    stroke: opts.stroke,
    strokeWidth: opts.strokeWidth,
  }
}

function circle(opts: {
  id?: string
  x: number; y: number; size: number; rotation?: number
  fill: string; stroke?: string; strokeWidth?: number
}): ShapeEl {
  return {
    id: opts.id ?? uid('c'),
    type: 'shape',
    kind: 'circle',
    x: opts.x, y: opts.y, w: opts.size, h: opts.size, rotation: opts.rotation ?? 0,
    fill: opts.fill,
    stroke: opts.stroke,
    strokeWidth: opts.strokeWidth,
  }
}

function img(opts: {
  id?: string
  x: number; y: number; w: number; h: number; rotation?: number
  src?: string; fit?: 'cover' | 'contain'; radius?: number; opacity?: number
}): ImageEl {
  return {
    id: opts.id ?? uid('i'),
    type: 'image',
    x: opts.x, y: opts.y, w: opts.w, h: opts.h, rotation: opts.rotation ?? 0,
    src: opts.src ?? '', fit: opts.fit ?? 'contain', radius: opts.radius ?? 0, opacity: opts.opacity ?? 1,
  }
}

function pill(opts: { x: number; y: number; w: number; h: number; text: string; bg: string; color: string; size?: number }): AnyElement[] {
  return [
    rect({ x: opts.x, y: opts.y, w: opts.w, h: opts.h, fill: opts.bg, radius: opts.h / 2 }),
    txt({
      x: opts.x, y: opts.y, w: opts.w, h: opts.h,
      content: opts.text,
      font: { size: opts.size ?? 22, weight: 600, color: opts.color, align: 'center', lineHeight: opts.h / (opts.size ?? 22) },
    }),
  ]
}

// ── Templates ─────────────────────────────────────────────────

export function createMinimal(org: OrgInfo): AnyElement[] {
  return [
    rect({ x: 0, y: 0, w: 16, h: CANVAS_H, fill: ACCENT }),
    txt({ x: 70, y: 70, w: 600, h: 26, content: 'TECH TALK',
      font: { size: 18, weight: 700, color: ACCENT_DARK, letterSpacing: 6, uppercase: true } }),
    rect({ x: 880, y: 60, w: 50, h: 50, fill: ACCENT, radius: 12 }),
    txt({ x: 880, y: 60, w: 50, h: 50, content: org.logoText,
      font: { size: 18, weight: 800, color: '#fff', align: 'center', lineHeight: 50/18, letterSpacing: -0.5 } }),
    txt({ x: 945, y: 75, w: 80, h: 22, content: org.name,
      font: { size: 16, weight: 700, align: 'right' } }),

    txt({ x: 70, y: 360, w: 940, h: 280, content: 'AI for Good:\nMembangun Solusi Berdampak',
      font: { size: 84, weight: 700, lineHeight: 0.98, letterSpacing: -3 } }),

    ...pill({ x: 70, y: 700, w: 280, h: 60, text: '15 Jun 2026', bg: '#fff', color: '#1c1917', size: 24 }),
    ...pill({ x: 365, y: 700, w: 240, h: 60, text: '15.00 – 17.30 WIB', bg: '#fff', color: '#1c1917', size: 22 }),
    ...pill({ x: 620, y: 700, w: 380, h: 60, text: 'Auditorium Robotika ITS', bg: ACCENT_LIGHT, color: ACCENT_DARK, size: 22 }),

    rect({ x: 70, y: 820, w: 940, h: 2, fill: '#e7e5e4' }),
    txt({ x: 70, y: 840, w: 200, h: 22, content: 'PEMBICARA',
      font: { size: 14, weight: 700, color: '#78716c', letterSpacing: 3, uppercase: true } }),
    circle({ x: 70, y: 880, size: 70, fill: ACCENT_LIGHT }),
    txt({ x: 160, y: 885, w: 360, h: 28, content: 'Dr. Adinda Rahman',
      font: { size: 22, weight: 700 } }),
    txt({ x: 160, y: 918, w: 360, h: 22, content: 'AI Researcher · Tokopedia',
      font: { size: 16, weight: 500, color: '#78716c' } }),

    rect({ x: 70, y: 1000, w: 940, h: 1.5, fill: '#e7e5e4' }),
    rect({ x: 70, y: 1020, w: 44, h: 44, fill: ACCENT, radius: 10 }),
    txt({ x: 70, y: 1020, w: 44, h: 44, content: org.logoText,
      font: { size: 16, weight: 800, color: '#fff', align: 'center', lineHeight: 44/16 } }),
    txt({ x: 130, y: 1022, w: 400, h: 22, content: org.name, font: { size: 18, weight: 700 } }),
    txt({ x: 130, y: 1046, w: 400, h: 18, content: org.tagline, font: { size: 13, weight: 500, color: '#78716c' } }),
    txt({ x: 600, y: 1030, w: 410, h: 22, content: `${org.instagram}  ·  ${org.website}`,
      font: { family: 'DM Mono', size: 14, weight: 500, color: '#78716c', align: 'right' } }),
  ]
}

export function createBoldType(org: OrgInfo): AnyElement[] {
  return [
    rect({ x: 0, y: 0, w: CANVAS_SIZE, h: CANVAS_H, fill: ACCENT }),
    rect({ x: 60, y: 60, w: 50, h: 50, fill: '#fff', radius: 12 }),
    txt({ x: 60, y: 60, w: 50, h: 50, content: org.logoText,
      font: { size: 18, weight: 800, color: ACCENT, align: 'center', lineHeight: 50/18, letterSpacing: -0.5 } }),
    txt({ x: 125, y: 75, w: 400, h: 22, content: org.name.toUpperCase(),
      font: { size: 16, weight: 700, color: '#fff', letterSpacing: 1 } }),
    txt({ x: 700, y: 78, w: 320, h: 20, content: 'TECH TALK / 2026',
      font: { size: 14, weight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: 4, align: 'right', uppercase: true } }),

    txt({ x: 60, y: 260, w: 960, h: 460, content: 'AI FOR GOOD',
      font: { family: 'Space Grotesk', size: 160, weight: 700, color: '#fff', lineHeight: 0.88, letterSpacing: -8 } }),

    txt({ x: 60, y: 760, w: 300, h: 180, content: '15',
      font: { family: 'Space Grotesk', size: 180, weight: 700, color: '#fff', lineHeight: 0.85, letterSpacing: -8 } }),
    txt({ x: 280, y: 800, w: 240, h: 36, content: 'JUN 2026',
      font: { size: 28, weight: 700, color: '#fff', letterSpacing: 4 } }),
    txt({ x: 280, y: 850, w: 320, h: 24, content: '15.00 – 17.30 WIB',
      font: { size: 18, weight: 500, color: 'rgba(255,255,255,0.8)' } }),
    txt({ x: 280, y: 880, w: 400, h: 24, content: 'Auditorium Robotika ITS',
      font: { size: 18, weight: 500, color: 'rgba(255,255,255,0.8)' } }),

    txt({ x: 670, y: 770, w: 350, h: 22, content: 'SPEAKERS',
      font: { size: 14, weight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: 4, align: 'right', uppercase: true } }),
    txt({ x: 670, y: 800, w: 350, h: 30, content: 'Dr. Adinda Rahman',
      font: { size: 22, weight: 700, color: '#fff', align: 'right' } }),
    txt({ x: 670, y: 835, w: 350, h: 30, content: 'Bagas Wirawan',
      font: { size: 22, weight: 700, color: '#fff', align: 'right' } }),

    rect({ x: 60, y: 990, w: 960, h: 1.5, fill: 'rgba(255,255,255,0.3)' }),
    txt({ x: 60, y: 1010, w: 600, h: 22, content: org.tagline,
      font: { size: 15, weight: 500, color: 'rgba(255,255,255,0.8)' } }),
    txt({ x: 600, y: 1010, w: 420, h: 22, content: `${org.instagram}  ${org.website}`,
      font: { family: 'DM Mono', size: 14, weight: 500, color: 'rgba(255,255,255,0.8)', align: 'right' } }),
  ]
}

export function createPhotoPortrait(org: OrgInfo): AnyElement[] {
  return [
    rect({ x: 0, y: 0, w: CANVAS_SIZE, h: CANVAS_H,
      fill: `linear-gradient(160deg, ${ACCENT_DARK}, ${ACCENT} 60%, #1e6b8a)` as string }),
    rect({ x: 0, y: 0, w: CANVAS_SIZE, h: CANVAS_H, fill: 'rgba(0,0,0,0.35)' }),

    rect({ x: 60, y: 60, w: 54, h: 54, fill: '#fff', radius: 12 }),
    txt({ x: 60, y: 60, w: 54, h: 54, content: org.logoText,
      font: { size: 20, weight: 800, color: '#1c1917', align: 'center', lineHeight: 54/20, letterSpacing: -0.5 } }),
    txt({ x: 130, y: 70, w: 400, h: 22, content: org.name,
      font: { size: 18, weight: 700, color: '#fff' } }),
    txt({ x: 130, y: 96, w: 400, h: 16, content: 'presents',
      font: { size: 13, weight: 500, color: 'rgba(255,255,255,0.75)' } }),

    rect({ x: 820, y: 64, w: 200, h: 44, fill: 'transparent', stroke: 'rgba(255,255,255,0.6)', strokeWidth: 2, radius: 22 }),
    txt({ x: 820, y: 64, w: 200, h: 44, content: 'TECH TALK',
      font: { size: 14, weight: 700, color: '#fff', align: 'center', lineHeight: 44/14, letterSpacing: 4 } }),

    txt({ x: 60, y: 620, w: 940, h: 260, content: 'AI for Good',
      font: { size: 110, weight: 700, color: '#fff', lineHeight: 0.95, letterSpacing: -5 } }),

    rect({ x: 60, y: 900, w: 280, h: 90, fill: ACCENT, radius: 14 }),
    txt({ x: 80, y: 912, w: 240, h: 18, content: 'TANGGAL',
      font: { size: 12, weight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: 3, uppercase: true } }),
    txt({ x: 80, y: 935, w: 240, h: 40, content: '15 Jun 2026',
      font: { size: 28, weight: 700, color: '#fff' } }),

    txt({ x: 380, y: 910, w: 400, h: 28, content: '⏱  15.00 – 17.30 WIB',
      font: { size: 18, weight: 600, color: '#fff' } }),
    txt({ x: 380, y: 950, w: 400, h: 28, content: '📍  Auditorium Robotika ITS',
      font: { size: 18, weight: 600, color: '#fff' } }),

    rect({ x: 60, y: 1015, w: 960, h: 1.5, fill: 'rgba(255,255,255,0.3)' }),
    circle({ x: 60, y: 1030, size: 50, fill: 'rgba(255,255,255,0.15)', stroke: '#fff', strokeWidth: 2 }),
    txt({ x: 130, y: 1035, w: 500, h: 20, content: 'BERSAMA',
      font: { size: 12, weight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: 3, uppercase: true } }),
    txt({ x: 130, y: 1055, w: 500, h: 24, content: 'Dr. Adinda Rahman, Bagas Wirawan',
      font: { size: 17, weight: 600, color: '#fff' } }),
    txt({ x: 700, y: 1040, w: 320, h: 20, content: `${org.instagram}  ${org.website}`,
      font: { family: 'DM Mono', size: 12, weight: 500, color: 'rgba(255,255,255,0.75)', align: 'right' } }),
  ]
}

export function createEditorial(org: OrgInfo): AnyElement[] {
  return [
    rect({ x: 0, y: 0, w: CANVAS_SIZE, h: CANVAS_H, fill: '#fafaf9' }),
    rect({ x: 0, y: 110, w: CANVAS_SIZE, h: 2, fill: '#1c1917' }),

    circle({ x: 50, y: 40, size: 40, fill: ACCENT }),
    txt({ x: 50, y: 40, w: 40, h: 40, content: org.logoText,
      font: { size: 14, weight: 800, color: '#fff', align: 'center', lineHeight: 40/14 } }),
    txt({ x: 105, y: 50, w: 400, h: 22, content: org.name.toUpperCase(),
      font: { size: 15, weight: 700, letterSpacing: 1 } }),
    txt({ x: 600, y: 55, w: 430, h: 22, content: 'VOL. 01 · JUN 2026',
      font: { family: 'DM Mono', size: 14, weight: 500, color: '#1c1917', align: 'right', letterSpacing: 3 } }),

    rect({ x: 540, y: 112, w: 2, h: 760, fill: '#1c1917' }),

    txt({ x: 60, y: 160, w: 460, h: 22, content: '— TECH TALK',
      font: { family: 'DM Mono', size: 14, weight: 500, color: ACCENT_DARK, letterSpacing: 4, uppercase: true } }),
    txt({ x: 60, y: 220, w: 460, h: 420, content: 'AI for Good',
      font: { family: 'Instrument Serif', size: 90, weight: 400, italic: true, lineHeight: 0.95, letterSpacing: -2 } }),

    rect({ x: 60, y: 700, w: 460, h: 2, fill: '#1c1917' }),
    txt({ x: 60, y: 720, w: 200, h: 22, content: 'TANGGAL',
      font: { family: 'DM Mono', size: 13, weight: 500, color: '#78716c', letterSpacing: 2 } }),
    txt({ x: 280, y: 720, w: 240, h: 22, content: '15 Jun 2026',
      font: { size: 16, weight: 700, align: 'right' } }),
    txt({ x: 60, y: 755, w: 200, h: 22, content: 'WAKTU',
      font: { family: 'DM Mono', size: 13, weight: 500, color: '#78716c', letterSpacing: 2 } }),
    txt({ x: 280, y: 755, w: 240, h: 22, content: '15.00 – 17.30',
      font: { size: 16, weight: 700, align: 'right' } }),
    txt({ x: 60, y: 790, w: 200, h: 22, content: 'TEMPAT',
      font: { family: 'DM Mono', size: 13, weight: 500, color: '#78716c', letterSpacing: 2 } }),
    txt({ x: 260, y: 790, w: 260, h: 22, content: 'Auditorium Robotika ITS',
      font: { size: 16, weight: 700, align: 'right' } }),

    rect({ x: 560, y: 140, w: 480, h: 480, fill: ACCENT_LIGHT }),
    circle({ x: 640, y: 220, size: 320, fill: `radial-gradient(circle at 35% 30%, ${ACCENT}, ${ACCENT_DARK} 70%)` as string }),

    txt({ x: 560, y: 650, w: 480, h: 22, content: 'FEATURING',
      font: { family: 'DM Mono', size: 13, weight: 500, color: '#78716c', letterSpacing: 4, uppercase: true } }),
    circle({ x: 560, y: 690, size: 50, fill: ACCENT_LIGHT }),
    txt({ x: 620, y: 695, w: 400, h: 22, content: 'Dr. Adinda Rahman',
      font: { size: 17, weight: 700 } }),
    txt({ x: 620, y: 720, w: 400, h: 18, content: 'AI Researcher · Tokopedia',
      font: { size: 13, weight: 500, color: '#78716c' } }),

    rect({ x: 0, y: 980, w: CANVAS_SIZE, h: 100, fill: '#1c1917' }),
    rect({ x: 60, y: 1005, w: 44, h: 44, fill: ACCENT, radius: 10 }),
    txt({ x: 60, y: 1005, w: 44, h: 44, content: org.logoText,
      font: { size: 16, weight: 800, color: '#fff', align: 'center', lineHeight: 44/16 } }),
    txt({ x: 120, y: 1010, w: 400, h: 22, content: org.name, font: { size: 17, weight: 700, color: '#fff' } }),
    txt({ x: 120, y: 1035, w: 400, h: 18, content: org.tagline, font: { size: 13, weight: 500, color: 'rgba(255,255,255,0.65)' } }),
    txt({ x: 600, y: 1020, w: 420, h: 22, content: `${org.instagram}  ${org.website}`,
      font: { family: 'DM Mono', size: 13, weight: 500, color: 'rgba(255,255,255,0.65)', align: 'right' } }),
  ]
}

export function createSoftGlow(org: OrgInfo): AnyElement[] {
  return [
    rect({ x: 0, y: 0, w: CANVAS_SIZE, h: CANVAS_H,
      fill: `radial-gradient(120% 80% at 50% 0%, ${ACCENT_LIGHT} 0%, #fafaf9 50%, #f0eeec 100%)` as string }),
    circle({ x: 240, y: -300, size: 600, fill: `radial-gradient(circle, ${ACCENT}22, transparent 60%)` as string }),

    rect({ x: 490, y: 70, w: 50, h: 50, fill: ACCENT, radius: 12 }),
    txt({ x: 490, y: 70, w: 50, h: 50, content: org.logoText,
      font: { size: 18, weight: 800, color: '#fff', align: 'center', lineHeight: 50/18 } }),

    rect({ x: 380, y: 150, w: 320, h: 44, fill: '#fff', stroke: '#e7e5e4', strokeWidth: 1.5, radius: 22 }),
    txt({ x: 380, y: 150, w: 320, h: 44, content: 'SPECIAL EVENT',
      font: { size: 14, weight: 700, color: ACCENT_DARK, align: 'center', lineHeight: 44/14, letterSpacing: 4 } }),

    circle({ x: 410, y: 230, size: 260, fill: ACCENT_LIGHT, stroke: ACCENT, strokeWidth: 4 }),

    txt({ x: 80, y: 540, w: 920, h: 220, content: 'AI for Good',
      font: { family: 'Instrument Serif', size: 100, weight: 400, lineHeight: 1, letterSpacing: -3, align: 'center' } }),

    txt({ x: 80, y: 770, w: 920, h: 30, content: 'Dr. Adinda Rahman',
      font: { size: 26, weight: 700, align: 'center' } }),
    txt({ x: 80, y: 805, w: 920, h: 22, content: 'AI Researcher · Tokopedia',
      font: { size: 16, weight: 500, color: '#78716c', align: 'center' } }),

    rect({ x: 200, y: 870, w: 320, h: 56, fill: '#1c1917', radius: 14 }),
    txt({ x: 200, y: 870, w: 320, h: 56, content: '📅  15 Jun 2026 · 15.00',
      font: { size: 18, weight: 600, color: '#fff', align: 'center', lineHeight: 56/18 } }),

    rect({ x: 540, y: 870, w: 340, h: 56, fill: '#fff', stroke: '#e7e5e4', strokeWidth: 1.5, radius: 14 }),
    txt({ x: 540, y: 870, w: 340, h: 56, content: '📍  Auditorium Robotika ITS',
      font: { size: 17, weight: 600, align: 'center', lineHeight: 56/17 } }),

    rect({ x: 80, y: 1000, w: 920, h: 1.5, fill: '#e7e5e4' }),
    rect({ x: 460, y: 1020, w: 44, h: 44, fill: ACCENT, radius: 10 }),
    txt({ x: 460, y: 1020, w: 44, h: 44, content: org.logoText,
      font: { size: 16, weight: 800, color: '#fff', align: 'center', lineHeight: 44/16 } }),
    txt({ x: 80, y: 1030, w: 360, h: 22, content: org.name, font: { size: 16, weight: 700, align: 'right' } }),
    txt({ x: 520, y: 1030, w: 460, h: 22, content: `${org.instagram}  ${org.website}`,
      font: { family: 'DM Mono', size: 13, weight: 500, color: '#78716c' } }),
  ]
}

export function createTicket(org: OrgInfo): AnyElement[] {
  return [
    rect({ x: 0, y: 0, w: CANVAS_SIZE, h: CANVAS_H, fill: '#0f0e0c' }),
    rect({ x: 44, y: 44, w: CANVAS_SIZE - 88, h: CANVAS_H - 88, fill: '#fafaf9', radius: 22 }),

    rect({ x: 44, y: 44, w: CANVAS_SIZE - 88, h: 580, fill: ACCENT, radius: 22 }),
    rect({ x: 44, y: 580, w: CANVAS_SIZE - 88, h: 44, fill: ACCENT }),

    txt({ x: 100, y: 100, w: 600, h: 22, content: 'ADMIT ONE — TECH TALK',
      font: { family: 'DM Mono', size: 14, weight: 500, color: '#fff', letterSpacing: 3, uppercase: true } }),
    txt({ x: 700, y: 100, w: 280, h: 22, content: '№ 042 / 2026',
      font: { family: 'DM Mono', size: 14, weight: 500, color: '#fff', letterSpacing: 3, align: 'right' } }),

    txt({ x: 100, y: 230, w: 880, h: 280, content: 'AI for Good',
      font: { family: 'Space Grotesk', size: 130, weight: 700, color: '#fff', lineHeight: 0.92, letterSpacing: -5 } }),

    txt({ x: 100, y: 510, w: 200, h: 18, content: 'DATE',
      font: { family: 'DM Mono', size: 12, weight: 500, color: 'rgba(255,255,255,0.75)', letterSpacing: 3 } }),
    txt({ x: 100, y: 530, w: 280, h: 30, content: '15 Jun 2026',
      font: { size: 24, weight: 700, color: '#fff' } }),
    txt({ x: 400, y: 510, w: 200, h: 18, content: 'TIME',
      font: { family: 'DM Mono', size: 12, weight: 500, color: 'rgba(255,255,255,0.75)', letterSpacing: 3 } }),
    txt({ x: 400, y: 530, w: 280, h: 30, content: '15.00 – 17.30',
      font: { size: 24, weight: 700, color: '#fff' } }),
    txt({ x: 700, y: 510, w: 280, h: 18, content: 'VENUE',
      font: { family: 'DM Mono', size: 12, weight: 500, color: 'rgba(255,255,255,0.75)', letterSpacing: 3 } }),
    txt({ x: 700, y: 530, w: 280, h: 30, content: 'Auditorium ITS',
      font: { size: 22, weight: 700, color: '#fff' } }),

    // perforation
    circle({ x: 26, y: 600, size: 36, fill: '#0f0e0c' }),
    circle({ x: CANVAS_SIZE - 62, y: 600, size: 36, fill: '#0f0e0c' }),
    rect({ x: 100, y: 618, w: CANVAS_SIZE - 200, h: 2, fill: '#d6d3d1' }),

    // bottom stub
    circle({ x: 100, y: 700, size: 90, fill: ACCENT_LIGHT }),
    txt({ x: 220, y: 705, w: 400, h: 18, content: 'FEATURING',
      font: { family: 'DM Mono', size: 12, weight: 500, color: ACCENT_DARK, letterSpacing: 3 } }),
    txt({ x: 220, y: 725, w: 500, h: 30, content: 'Dr. Adinda Rahman',
      font: { size: 24, weight: 700 } }),
    txt({ x: 220, y: 760, w: 500, h: 22, content: 'AI Researcher · Tokopedia',
      font: { size: 14, weight: 500, color: '#78716c' } }),

    txt({ x: 780, y: 770, w: 200, h: 22, content: org.instagram,
      font: { family: 'DM Mono', size: 13, weight: 500, color: '#78716c', align: 'right', letterSpacing: 2 } }),

    rect({ x: 100, y: 870, w: CANVAS_SIZE - 200, h: 1.5, fill: '#e7e5e4' }),
    rect({ x: 100, y: 895, w: 44, h: 44, fill: ACCENT, radius: 10 }),
    txt({ x: 100, y: 895, w: 44, h: 44, content: org.logoText,
      font: { size: 16, weight: 800, color: '#fff', align: 'center', lineHeight: 44/16 } }),
    txt({ x: 160, y: 900, w: 400, h: 22, content: org.name, font: { size: 17, weight: 700 } }),
    txt({ x: 160, y: 925, w: 400, h: 18, content: org.tagline, font: { size: 13, weight: 500, color: '#78716c' } }),
  ]
}

// ── We Worship Templates ──────────────────────────────────────

export function createWeWorshipBorder(org: OrgInfo): AnyElement[] {
  const GOLD = '#C9A44A'
  const MAROON = '#8B1A1A'
  return [
    // Dark overlay — user sets bg to event photo via Background Sheet
    rect({ x: 0, y: 0, w: CANVAS_SIZE, h: CANVAS_H, fill: 'rgba(0,0,0,0.52)' }),
    // Gold border frame
    rect({ x: 40, y: 40, w: 1000, h: 1270, fill: 'rgba(0,0,0,0)', stroke: GOLD, strokeWidth: 2 }),

    // Logo placeholders — top left: PPHTGD crown, top right: LevelUP kota
    img({ x: 70, y: 68, w: 90, h: 90 }),
    img({ x: 768, y: 62, w: 222, h: 100 }),

    // Divider below logos
    rect({ x: 80, y: 190, w: 920, h: 1, fill: `${GOLD}55` }),

    // WE WORSHIP title
    txt({ x: 80, y: 212, w: 920, h: 300,
      content: 'WE\nWORSHIP',
      font: { family: 'Space Grotesk', size: 170, weight: 700, color: '#fff', lineHeight: 0.87, letterSpacing: -6, align: 'center' } }),

    // Maroon tagline bar
    rect({ x: 80, y: 524, w: 920, h: 3, fill: MAROON }),
    txt({ x: 80, y: 530, w: 920, h: 34,
      content: 'LevelUP  ·  THE JEREMIAH GENERATION',
      font: { size: 17, weight: 700, color: '#fff', align: 'center', letterSpacing: 4, uppercase: true } }),
    rect({ x: 80, y: 564, w: 920, h: 3, fill: MAROON }),

    // Info section divider
    rect({ x: 80, y: 610, w: 920, h: 1, fill: 'rgba(255,255,255,0.25)' }),

    // Date & time
    txt({ x: 80, y: 630, w: 920, h: 52,
      content: 'Hari, Tanggal Bulan Tahun',
      font: { size: 34, weight: 700, color: GOLD, align: 'center' } }),
    txt({ x: 80, y: 684, w: 920, h: 44,
      content: '00.00 WIB',
      font: { size: 30, weight: 700, color: GOLD, align: 'center' } }),

    // Venue
    txt({ x: 80, y: 758, w: 920, h: 44,
      content: 'NAMA GEREJA / VENUE',
      font: { size: 30, weight: 700, color: '#fff', align: 'center', uppercase: true } }),
    txt({ x: 80, y: 806, w: 920, h: 28,
      content: 'Kecamatan, Kabupaten',
      font: { size: 18, weight: 400, color: 'rgba(255,255,255,0.75)', align: 'center' } }),

    // Speaker
    txt({ x: 80, y: 882, w: 920, h: 30,
      content: 'With :',
      font: { family: 'Instrument Serif', size: 22, weight: 400, italic: true, color: GOLD, align: 'center' } }),
    txt({ x: 80, y: 916, w: 920, h: 54,
      content: 'NAMA PEMBICARA',
      font: { size: 36, weight: 700, color: '#fff', align: 'center', uppercase: true } }),
    txt({ x: 80, y: 974, w: 920, h: 28,
      content: '(Tim LevelUP Indonesia)',
      font: { size: 17, weight: 400, color: 'rgba(255,255,255,0.75)', align: 'center', uppercase: true } }),

    // Bottom divider + social
    rect({ x: 80, y: 1102, w: 920, h: 1, fill: 'rgba(255,255,255,0.35)' }),
    txt({ x: 80, y: 1120, w: 920, h: 30,
      content: `@levelup.gen  ·  ${org.instagram}`,
      font: { family: 'DM Mono', size: 18, weight: 500, color: 'rgba(255,255,255,0.85)', align: 'center', letterSpacing: 1 } }),
  ]
}

export function createWeWorshipSlate(org: OrgInfo): AnyElement[] {
  const GOLD = '#C9A44A'
  const MAROON = '#8B1A1A'
  return [
    // Dark overlay — user sets bg to event photo via Background Sheet
    rect({ x: 0, y: 0, w: CANVAS_SIZE, h: CANVAS_H, fill: 'rgba(0,0,0,0.38)' }),
    // Gradient darkens toward the info section
    rect({ x: 0, y: 660, w: CANVAS_SIZE, h: 690,
      fill: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.9) 44%)' as string }),

    // Logo placeholders — top left: PPHTGD crown, top right: LevelUP kota
    img({ x: 60, y: 58, w: 90, h: 90 }),
    img({ x: 770, y: 58, w: 250, h: 90 }),

    // WE WORSHIP — left-aligned, large
    txt({ x: 60, y: 490, w: 960, h: 248,
      content: 'WE WORSHIP',
      font: { family: 'Space Grotesk', size: 130, weight: 700, color: '#fff', lineHeight: 0.9, letterSpacing: -4, align: 'left' } }),

    // Maroon tagline bar
    rect({ x: 60, y: 748, w: 960, h: 3, fill: MAROON }),
    txt({ x: 60, y: 754, w: 960, h: 30,
      content: 'LevelUP  ·  THE JEREMIAH GENERATION',
      font: { size: 15, weight: 700, color: '#fff', align: 'left', letterSpacing: 4, uppercase: true } }),
    rect({ x: 60, y: 784, w: 960, h: 3, fill: MAROON }),

    // Date & time
    txt({ x: 60, y: 822, w: 600, h: 50,
      content: 'Hari, Tanggal Bulan Tahun',
      font: { size: 32, weight: 700, color: GOLD } }),
    txt({ x: 60, y: 874, w: 280, h: 40,
      content: '00.00 WIB',
      font: { size: 26, weight: 700, color: GOLD } }),

    // Divider
    rect({ x: 60, y: 944, w: 960, h: 1, fill: 'rgba(255,255,255,0.25)' }),

    // Venue (left) + Speaker (right)
    txt({ x: 60, y: 962, w: 540, h: 44,
      content: 'NAMA GEREJA / VENUE',
      font: { size: 28, weight: 700, color: '#fff', uppercase: true } }),
    txt({ x: 60, y: 1010, w: 560, h: 26,
      content: 'Kecamatan, Kabupaten',
      font: { size: 17, weight: 400, color: 'rgba(255,255,255,0.75)' } }),

    txt({ x: 630, y: 950, w: 390, h: 24,
      content: 'PEMBICARA',
      font: { family: 'DM Mono', size: 13, weight: 500, color: GOLD, align: 'right', letterSpacing: 3 } }),
    txt({ x: 630, y: 978, w: 390, h: 40,
      content: 'Nama Pembicara',
      font: { size: 26, weight: 700, color: '#fff', align: 'right' } }),
    txt({ x: 630, y: 1020, w: 390, h: 24,
      content: 'Tim LevelUP Indonesia',
      font: { size: 15, weight: 400, color: 'rgba(255,255,255,0.7)', align: 'right' } }),

    // Bottom divider + social
    rect({ x: 60, y: 1100, w: 960, h: 1, fill: 'rgba(255,255,255,0.25)' }),
    txt({ x: 60, y: 1118, w: 960, h: 28,
      content: `${org.instagram}  ·  @levelup.gen  ·  LevelUP Generation  ·  @levelup.pphtgd`,
      font: { family: 'DM Mono', size: 13, weight: 500, color: 'rgba(255,255,255,0.75)', align: 'center' } }),
    txt({ x: 60, y: 1150, w: 960, h: 24,
      content: 'levelupgen.com',
      font: { family: 'DM Mono', size: 14, weight: 500, color: 'rgba(255,255,255,0.5)', align: 'center' } }),
  ]
}

// ── Registry ──────────────────────────────────────────────────

export interface TemplateDef {
  id: string
  name: string
  sub: string
  create: (org: OrgInfo) => AnyElement[]
  bg: import('./types').Background
}

export const TEMPLATE_LIST: TemplateDef[] = [
  { id: 'weworship-border', name: 'We Worship I', sub: 'Gold border', create: createWeWorshipBorder, bg: { kind: 'color', color: '#1c1c1c' } },
  { id: 'weworship-slate', name: 'We Worship II', sub: 'Slate + card', create: createWeWorshipSlate, bg: { kind: 'color', color: '#1c1c1c' } },
  { id: 'minimal', name: 'Minimal', sub: 'Clean & light', create: createMinimal, bg: { kind: 'color', color: '#fafaf9' } },
  { id: 'bold', name: 'Bold Type', sub: 'Color block', create: createBoldType, bg: { kind: 'color', color: ACCENT } },
  { id: 'photo', name: 'Photo Portrait', sub: 'Full-bleed', create: createPhotoPortrait, bg: { kind: 'color', color: ACCENT_DARK } },
  { id: 'editorial', name: 'Editorial', sub: 'Magazine grid', create: createEditorial, bg: { kind: 'color', color: '#fafaf9' } },
  { id: 'soft', name: 'Soft Glow', sub: 'Soft & elegant', create: createSoftGlow, bg: { kind: 'color', color: '#fafaf9' } },
  { id: 'ticket', name: 'Ticket Stub', sub: 'Retro & playful', create: createTicket, bg: { kind: 'color', color: '#0f0e0c' } },
]

export function makeDocFromTemplate(tplId: string, org: OrgInfo): PamfletDoc {
  const tpl = TEMPLATE_LIST.find(t => t.id === tplId) ?? TEMPLATE_LIST[0]
  return {
    version: 3,
    templateId: tpl.id,
    canvas: { w: CANVAS_SIZE, h: CANVAS_H, bg: tpl.bg },
    elements: tpl.create(org),
  }
}

export function makeBlankDoc(): PamfletDoc {
  return {
    version: 3,
    templateId: 'blank',
    canvas: { w: CANVAS_SIZE, h: CANVAS_H, bg: { kind: 'color', color: '#ffffff' } },
    elements: [],
  }
}
