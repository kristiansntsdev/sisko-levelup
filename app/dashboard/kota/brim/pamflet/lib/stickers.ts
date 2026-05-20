// Shape library — SVG viewBox 0 0 100 100, fill="currentColor" so StickerEl color applies.

export interface StickerDef {
  id: string
  name: string
  svg: string
}

const s = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" fill="currentColor">${inner}</svg>`

export const STICKERS: StickerDef[] = [
  // Row 1 — rectangles + circle
  {
    id: 'rect',
    name: 'Persegi',
    svg: s('<rect x="5" y="5" width="90" height="90"/>'),
  },
  {
    id: 'rect-rounded',
    name: 'Persegi Bulat',
    svg: s('<rect x="5" y="5" width="90" height="90" rx="22"/>'),
  },
  {
    id: 'circle',
    name: 'Lingkaran',
    svg: s('<circle cx="50" cy="50" r="45"/>'),
  },

  // Row 2 — triangles + diamond
  {
    id: 'triangle-up',
    name: 'Segitiga',
    svg: s('<polygon points="50,5 95,90 5,90"/>'),
  },
  {
    id: 'triangle-down',
    name: 'Segitiga Bawah',
    svg: s('<polygon points="5,10 95,10 50,95"/>'),
  },
  {
    id: 'diamond',
    name: 'Belah Ketupat',
    svg: s('<polygon points="50,5 95,50 50,95 5,50"/>'),
  },

  // Row 3 — cross, hexagon, octagon
  {
    id: 'cross',
    name: 'Plus',
    svg: s('<path d="M35 5 H65 V35 H95 V65 H65 V95 H35 V65 H5 V35 H35 Z"/>'),
  },
  {
    id: 'hexagon',
    name: 'Heksagon',
    svg: s('<polygon points="50,5 91,27 91,73 50,95 9,73 9,27"/>'),
  },
  {
    id: 'octagon',
    name: 'Oktagon',
    svg: s('<polygon points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30"/>'),
  },

  // Row 4 — parallelogram + trapezoids
  {
    id: 'parallelogram',
    name: 'Jajaran Genjang',
    svg: s('<polygon points="30,8 95,8 70,92 5,92"/>'),
  },
  {
    id: 'trapezoid-narrow-top',
    name: 'Trapesium',
    svg: s('<polygon points="22,8 78,8 95,92 5,92"/>'),
  },
  {
    id: 'trapezoid-narrow-bottom',
    name: 'Trapesium Bawah',
    svg: s('<polygon points="5,8 95,8 78,92 22,92"/>'),
  },

  // Row 5 — inverted trapezoid + tombstone + arch
  {
    id: 'trapezoid-wide-top',
    name: 'Trapesium Lebar',
    svg: s('<polygon points="5,8 95,8 70,92 30,92"/>'),
  },
  {
    id: 'tombstone',
    name: 'Nisan',
    svg: s('<path d="M20,92 L20,48 A30,30,0,0,1,80,48 L80,92 Z"/>'),
  },
  {
    id: 'arch',
    name: 'Gerbang',
    svg: s('<path d="M8,92 L8,60 A42,35,0,0,1,92,60 L92,92 Z"/>'),
  },
]
