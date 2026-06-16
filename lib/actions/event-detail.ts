'use server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// ── Types ──────────────────────────────────────────────────────

export type PembicaraItem = {
  nama: string
  jabatan: string
  bio: string
}

export type RundownRow = {
  id: string       // crypto.randomUUID() on creation
  waktu: string
  kegiatan: string
  pic: string
  keterangan: string
}

export type EventDetailVol = {
  id: number
  id_event: number
  pembicara: PembicaraItem[]
  rundown_pra: RundownRow[]
  rundown_on: RundownRow[]
  updated_at: string
}

// ── Helpers ────────────────────────────────────────────────────

function parsePembicara(raw: string | null | undefined): PembicaraItem[] {
  try { return JSON.parse(raw ?? '[]') } catch { return [] }
}

function parseRundown(raw: string | null | undefined): RundownRow[] {
  try { return JSON.parse(raw ?? '[]') } catch { return [] }
}

function revalidateVol(idEvent: number) {
  revalidatePath(`/dashboard/kota/vol/event/${idEvent}`)
  revalidatePath('/dashboard/kota/vol')
}

// ── Queries ────────────────────────────────────────────────────

export async function getEventDetailVol(idEvent: number): Promise<EventDetailVol | null> {
  const row = await db.event_detail.findUnique({ where: { id_event: idEvent } })
  if (!row) return null
  return {
    id: row.id,
    id_event: row.id_event,
    pembicara: parsePembicara(row.pembicara),
    rundown_pra: parseRundown(row.rundown_pra),
    rundown_on: parseRundown(row.rundown_on),
    updated_at: row.updated_at.toISOString(),
  }
}

// ── Mutations ──────────────────────────────────────────────────

export async function upsertPembicara(
  idEvent: number,
  pembicara: PembicaraItem[],
): Promise<void> {
  const data = JSON.stringify(pembicara)
  await db.event_detail.upsert({
    where: { id_event: idEvent },
    create: { id_event: idEvent, pembicara: data },
    update: { pembicara: data, updated_at: new Date() },
  })
  revalidateVol(idEvent)
}

export async function upsertRundownPra(
  idEvent: number,
  rows: RundownRow[],
): Promise<void> {
  const data = JSON.stringify(rows)
  await db.event_detail.upsert({
    where: { id_event: idEvent },
    create: { id_event: idEvent, rundown_pra: data },
    update: { rundown_pra: data, updated_at: new Date() },
  })
  revalidateVol(idEvent)
}

export async function upsertRundownOn(
  idEvent: number,
  rows: RundownRow[],
): Promise<void> {
  const data = JSON.stringify(rows)
  await db.event_detail.upsert({
    where: { id_event: idEvent },
    create: { id_event: idEvent, rundown_on: data },
    update: { rundown_on: data, updated_at: new Date() },
  })
  revalidateVol(idEvent)
}
