export const CANVAS_SIZE = 1080
export const CANVAS_W = 1080
export const CANVAS_H = 1350

export type FontFamily = 'DM Sans' | 'Space Grotesk' | 'Instrument Serif' | 'DM Mono'
export type FontWeight = 400 | 500 | 600 | 700 | 800
export type Align = 'left' | 'center' | 'right'

export interface Box {
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

export interface TextFont {
  family: FontFamily
  size: number
  weight: FontWeight
  italic: boolean
  color: string
  align: Align
  lineHeight: number
  letterSpacing: number
  uppercase: boolean
}

export interface TextEl extends Box {
  id: string
  type: 'text'
  content: string
  font: TextFont
}

export interface ImageCrop {
  x: number
  y: number
  width: number
  height: number
}

export interface ImageEl extends Box {
  id: string
  type: 'image'
  src: string
  fit: 'cover' | 'contain'
  radius: number
  opacity: number
  crop?: ImageCrop  // source-image pixel rect; undefined = full image
}

export interface ShapeEl extends Box {
  id: string
  type: 'shape'
  kind: 'rect' | 'circle' | 'line'
  fill: string
  stroke?: string
  strokeWidth?: number
  radius?: number
}

export interface StickerEl extends Box {
  id: string
  type: 'sticker'
  src: string
  color: string
}

export type AnyElement = TextEl | ImageEl | ShapeEl | StickerEl

export type Background =
  | { kind: 'color'; color: string }
  | { kind: 'image'; src: string; fit: 'cover' | 'contain' }
  | { kind: 'gradient'; from: string; to: string; angle: number }

export interface PamfletDoc {
  version: 3
  templateId: string
  canvas: { w: number; h: number; bg: Background }
  elements: AnyElement[]
}

export interface OrgInfo {
  name: string
  tagline: string
  contactName: string
  contactRole: string
  contactPhone: string
  instagram: string
  tiktok: string
  linkedin: string
  website: string
  logoText: string
}

export interface Draft {
  id: string
  savedAt: number
  name: string
  doc: PamfletDoc
}

export const DEFAULT_ORG: OrgInfo = {
  name: 'HMTI ITS',
  tagline: 'Himpunan Mahasiswa Teknik Informatika',
  contactName: 'Rizky Pratama',
  contactRole: 'Wakil Ketua HMTI',
  contactPhone: '+62 812 3456 7890',
  instagram: '@hmti.its',
  tiktok: '@hmti.its',
  linkedin: 'hmti-its',
  website: 'hmti.its.ac.id',
  logoText: 'HMTI',
}

export function uid(prefix = 'el'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}
