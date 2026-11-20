/** Push untuk pengurus: pusat (Sekretariat + BRIM Nasional) dan pengurus kota dari kota event. Hanya server. */
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { isNasionalAdmin, isNasionalBrim } from '@/lib/event-cabang'
import { BRIM_BASE, BRIM_LEGACY } from '@/components/brim-v2/paths'
import { berlangganan, kirimPush, pushAktif, type PushOpts } from './send'

export type PeranPengurus = 'sekretariat' | 'brim-nasional' | 'alk-kota' | 'brim-kota'

export function peranPengurus(p: { divisi: string | null; username: string }): PeranPengurus | null {
  if (p.divisi === 'alk') return isNasionalAdmin(p.username) ? 'sekretariat' : 'alk-kota'
  if (p.divisi === 'brim') return isNasionalBrim(p.username) ? 'brim-nasional' : 'brim-kota'
  return null
}

/** Link event per peran: tiap pengurus dibuka di dashboard-nya sendiri. */
export function urlEventPengurus(peran: PeranPengurus, idEvent: number, aksi: 'detail' | 'approve' = 'detail'): string {
  switch (peran) {
    case 'sekretariat':
      return aksi === 'approve' ? `/dashboard/v2/kota/alk/event/${idEvent}/approve` : `/dashboard/v2/kota/alk/event/${idEvent}`
    case 'brim-nasional':
      return `${BRIM_BASE}/event/${idEvent}`
    case 'alk-kota':
      return `/dashboard/v2/kota/alk/event/${idEvent}`
    case 'brim-kota':
      return BRIM_LEGACY
  }
}

export type PushPengurusInput = {
  title: string
  body: string
  tag?: string
  /** Kirim ke Sekretariat + BRIM Nasional. */
  pusat?: boolean
  /** Kirim ke ALK + BRIM kota ini (id_cabang). Cabang '0'/kosong = tidak ada pengurus kota. */
  idCabang?: string
  /** Pengurus yang melakukan aksi tidak dikirimi. */
  aktorId?: number | null
  url: (peran: PeranPengurus) => string
  renotify?: boolean
} & PushOpts

/** Fire-and-forget: `void pushPengurus(...)`. Tidak pernah melempar. */
export async function pushPengurus(input: PushPengurusInput): Promise<void> {
  try {
    if (!pushAktif()) return
    const subs = await berlangganan()
    if (!subs.pengurus.length) return
    const rows = await db.pengurus.findMany({
      where: { id_pengurus: { in: subs.pengurus } },
      select: { id_pengurus: true, username: true, divisi: true, kotalevelup: true },
    })
    const kota = input.idCabang && input.idCabang !== '0' ? String(Number(input.idCabang)) : null
    const perUrl = new Map<string, number[]>()
    for (const r of rows) {
      if (input.aktorId && r.id_pengurus === input.aktorId) continue
      const peran = peranPengurus(r)
      if (!peran) continue
      const pusat = peran === 'sekretariat' || peran === 'brim-nasional'
      const sekota = (peran === 'alk-kota' || peran === 'brim-kota') && kota !== null && String(Number(r.kotalevelup)) === kota
      if (!((input.pusat && pusat) || (input.idCabang !== undefined && sekota))) continue
      const url = input.url(peran)
      perUrl.set(url, [...(perUrl.get(url) ?? []), r.id_pengurus])
    }
    for (const [url, ids] of perUrl) {
      await kirimPush(
        { pengurus: ids },
        { title: input.title, body: input.body, url, tag: input.tag, renotify: input.renotify },
        { ttl: input.ttl, urgency: input.urgency },
      )
    }
  } catch (err) {
    console.error('[push] pushPengurus gagal', err)
  }
}

/** id pengurus dari cookie sesi (null kalau tidak ada). Dipanggil di dalam server action. */
export async function aktorPengurusId(): Promise<number | null> {
  const raw = (await cookies()).get('pengurus_id')?.value
  const id = Number(raw)
  return raw && Number.isFinite(id) ? id : null
}
