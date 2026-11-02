'use client'
import { getDb, type DbEvent, type DbPengurus, type DbPeserta } from '../db'

export function sessionPeserta(): DbPeserta | null {
  const d = getDb()
  return d.peserta.find((p) => p.id_peserta === d.session.idPeserta) ?? null
}

export function sessionPengurus(): DbPengurus | null {
  const d = getDb()
  return d.pengurus.find((p) => p.id_pengurus === d.session.idPengurus) ?? null
}

/** Same fields requireAlkPengurus() returns on the server. */
export function alkPengurus() {
  const p = sessionPengurus()
  if (!p || p.divisi !== 'alk') return null
  return { id_pengurus: p.id_pengurus, nama: p.nama, username: p.username, divisi: p.divisi, kotalevelup: p.kotalevelup, cabang: p.kotalevelup, isNasional: false }
}

const dayDate = (iso: string) => new Date(`${iso}T00:00:00Z`)

export function dayMs(iso: string): number {
  return dayDate(iso).getTime()
}

export function fmtLong(iso: string): string {
  return dayDate(iso).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

export function fmtDay(iso: string): string {
  return dayDate(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function fmtShort(iso: string): string {
  return dayDate(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function fmtRange(start: string, end: string): string {
  if (start === end) return fmtDay(start)
  const a = dayDate(start).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', timeZone: 'UTC' })
  return `${a} - ${fmtDay(end)}`
}

export function posterOf(e: DbEvent): string {
  return (e.posterevent || e.image_url || '').trim()
}

export const WW_CATEGORY: Record<string, string> = { bulanan: 'WW Bulanan', jfe: 'WW JFE', nasional: 'Nasional' }

/** Shrink an uploaded flyer to a small JPEG data URL so it fits comfortably in localStorage. */
export function fileToDataUrl(file: File, maxDim = 720, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Gambar tidak bisa dibaca'))
      img.onload = () => {
        const k = Math.min(1, maxDim / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.round(img.width * k))
        c.height = Math.max(1, Math.round(img.height * k))
        const ctx = c.getContext('2d')
        if (!ctx) return reject(new Error('Canvas tidak tersedia'))
        ctx.drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', quality))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
