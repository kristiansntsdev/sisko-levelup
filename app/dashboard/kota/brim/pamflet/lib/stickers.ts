// Curated sticker library. SVG strings using viewBox 0 0 100 100 and `currentColor`
// so the StickerEl color can recolor them at render time.

export interface StickerDef {
  id: string
  name: string
  svg: string
}

const make = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" fill="currentColor" stroke="currentColor">${inner}</svg>`

export const STICKERS: StickerDef[] = [
  {
    id: 'arrow',
    name: 'Arrow',
    svg: make('<path d="M10 50 H80 M60 30 L80 50 L60 70" fill="none" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'),
  },
  {
    id: 'star',
    name: 'Star',
    svg: make('<path d="M50 8 L62 38 L94 40 L68 60 L78 92 L50 74 L22 92 L32 60 L6 40 L38 38 Z"/>'),
  },
  {
    id: 'sparkle',
    name: 'Sparkle',
    svg: make('<path d="M50 10 L55 45 L90 50 L55 55 L50 90 L45 55 L10 50 L45 45 Z"/>'),
  },
  {
    id: 'frame-corner',
    name: 'Frame',
    svg: make('<path d="M10 30 V10 H30 M70 10 H90 V30 M90 70 V90 H70 M30 90 H10 V70" fill="none" stroke-width="6" stroke-linecap="round"/>'),
  },
  {
    id: 'blob',
    name: 'Blob',
    svg: make('<path d="M50 8 C75 8 92 28 92 50 C92 80 65 92 45 92 C20 92 8 70 8 50 C8 25 25 8 50 8 Z"/>'),
  },
  {
    id: 'ribbon',
    name: 'Ribbon',
    svg: make('<path d="M15 30 H85 V70 L75 60 L65 70 L55 60 L45 70 L35 60 L25 70 L15 60 Z"/>'),
  },
  {
    id: 'badge',
    name: 'Badge',
    svg: make('<circle cx="50" cy="50" r="36" fill="none" stroke-width="6"/><circle cx="50" cy="50" r="24"/>'),
  },
  {
    id: 'underline-squiggle',
    name: 'Squiggle',
    svg: make('<path d="M5 60 Q20 30 35 60 T65 60 T95 60" fill="none" stroke-width="6" stroke-linecap="round"/>'),
  },
  {
    id: 'divider',
    name: 'Divider',
    svg: make('<rect x="5" y="47" width="90" height="6" rx="3"/>'),
  },
  {
    id: 'heart',
    name: 'Heart',
    svg: make('<path d="M50 85 C20 65 10 45 10 30 C10 15 25 8 35 8 C42 8 47 12 50 18 C53 12 58 8 65 8 C75 8 90 15 90 30 C90 45 80 65 50 85 Z"/>'),
  },
  {
    id: 'lightning',
    name: 'Lightning',
    svg: make('<path d="M55 5 L20 55 L45 55 L40 95 L80 40 L55 40 Z"/>'),
  },
  {
    id: 'dot-pattern',
    name: 'Dots',
    svg: make([20, 50, 80].flatMap(cy => [20, 50, 80].map(cx => `<circle cx="${cx}" cy="${cy}" r="6"/>`)).join('')),
  },
]
