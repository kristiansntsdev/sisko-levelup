'use client'
// Kesaksian in the demo lives only in this module (gone on reload), like the feedback shim: nothing is persisted.
import { formatTanggalKesaksian, KESAKSIAN_MAX, type KesaksianItem } from '@/lib/kesaksian'

type Result = { ok: true; item: KesaksianItem } | { ok: false; error: string }

let items: KesaksianItem[] = []

export async function listKesaksianSaya(): Promise<KesaksianItem[]> {
  return items
}

export async function kirimKesaksian(isi: string): Promise<Result> {
  const text = isi.trim()
  if (!text) return { ok: false, error: 'Tulis dulu kesaksianmu.' }
  if (text.length > KESAKSIAN_MAX) return { ok: false, error: `Maksimal ${KESAKSIAN_MAX} karakter.` }
  const item = { id: Date.now(), isi: text, tanggal: formatTanggalKesaksian(new Date()) }
  items = [item, ...items]
  return { ok: true, item }
}
