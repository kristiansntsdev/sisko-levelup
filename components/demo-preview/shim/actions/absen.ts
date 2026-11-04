'use client'
/* eslint-disable @typescript-eslint/no-unused-vars */
import { eventDateTime, isOnlineAbsenOpen } from '@/lib/event-absen-window'
import { parseLocalDate } from '@/lib/event-sesi'
import type { QRPayload } from '@/lib/qr'
import type { RecentAbsen } from '@/lib/actions/absen'
import { addLog, getDb, mutate } from '../../db'
import { sessionPeserta, sessionPengurus } from '../util'

export type * from '@/lib/actions/absen'

type RecordAbsenResult = { success: true; nama: string; gereja: string } | { success: false; reason: string; lokasi?: string }

export async function getPesertaPreview(idPeserta: number) {
  const p = getDb().peserta.find((x) => x.id_peserta === idPeserta)
  return p ? { nama: p.nama, gereja: p.gereja } : null
}

/** Same checks as lib/absen-record.recordAbsen that matter for a kota event: invalid, sesi, duplicate, then write. */
function record(payload: QRPayload, idSesi: number | null, by: string): RecordAbsenResult {
  const d = getDb()
  const idPeserta = Number(payload.p)
  const idEvent = Number(payload.ev)
  const ev = d.event.find((e) => e.id_event === idEvent)
  const peserta = d.peserta.find((p) => p.id_peserta === idPeserta)
  if (!ev || !peserta) return { success: false, reason: 'invalid_payload' }
  const sesi = d.event_sesi.filter((s) => s.id_event === idEvent)
  if (sesi.length > 0) {
    if (idSesi == null) return { success: false, reason: 'sesi_required' }
    if (!sesi.some((s) => s.id_sesi === idSesi)) return { success: false, reason: 'sesi_invalid' }
  }
  const dup = d.absen.some((a) => a.id_peserta === idPeserta && a.id_event === idEvent && (idSesi == null ? a.id_sesi == null : a.id_sesi === idSesi))
  if (dup) return { success: false, reason: 'already_scanned' }
  mutate((x) => {
    x.absen.push({ id_absen: x.nextId++, id_peserta: idPeserta, id_event: idEvent, id_sesi: idSesi, email: peserta.email, timestamp: new Date().toISOString() })
    for (const r of x.registrasi) {
      if (r.id_peserta === idPeserta && r.id_event === idEvent && (r.status === 'confirmed' || r.status === 'absence')) r.status = 'attend'
    }
    addLog(x, `${peserta.nama} hadir di "${ev.nama_event}" (dicatat ${by})`)
  })
  return { success: true, nama: peserta.nama, gereja: peserta.gereja }
}

export async function createAbsen(payload: QRPayload, idSesi?: number | null, _idLokasi?: number | null): Promise<RecordAbsenResult> {
  const me = sessionPengurus()
  if (!me || me.divisi !== 'alk') return { success: false, reason: 'unauthorized' }
  return record(payload, idSesi ?? null, me.nama)
}

export async function absenOnlineSelf(idRegistrasi: number): Promise<
  { success: true } | { success: false; reason: 'unauthenticated' | 'not_found' | 'forbidden' | 'not_online' | 'window_closed' | 'already_scanned' | 'error' }
> {
  const me = sessionPeserta()
  if (!me) return { success: false, reason: 'unauthenticated' }
  const d = getDb()
  const reg = d.registrasi.find((r) => r.id_registrasi === idRegistrasi)
  if (!reg) return { success: false, reason: 'not_found' }
  if (reg.id_peserta !== me.id_peserta || reg.status === 'pending' || reg.status === 'cancelled') return { success: false, reason: 'forbidden' }
  const ev = d.event.find((e) => e.id_event === reg.id_event)
  if (!ev) return { success: false, reason: 'not_found' }
  if (ev.jenisevent.trim().toLowerCase() !== 'online') return { success: false, reason: 'not_online' }
  const endAt = eventDateTime(parseLocalDate(ev.tgleventselesai), ev.jamselesaievent)
  if (!endAt || !isOnlineAbsenOpen(new Date(), endAt)) return { success: false, reason: 'window_closed' }
  const res = record({ p: String(me.id_peserta), e: me.email, ev: String(ev.id_event) }, null, me.nama)
  if (res.success) return { success: true }
  return { success: false, reason: res.reason === 'already_scanned' ? 'already_scanned' : 'error' }
}

export async function getRecentAbsenForEvent(idEvent: number, limit = 5, idSesi: number | null = null): Promise<RecentAbsen> {
  const d = getDb()
  const all = d.absen.filter((a) => a.id_event === idEvent && (idSesi == null || a.id_sesi === idSesi))
  const rows = all
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit)
    .map((a) => {
      const p = d.peserta.find((x) => x.id_peserta === a.id_peserta)
      return {
        id_absen: a.id_absen,
        nama: p?.nama ?? `Peserta #${a.id_peserta}`,
        gereja: p?.gereja ?? '',
        gender: p?.gender ?? '',
        id_sesi: a.id_sesi,
        time: new Date(a.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }),
      }
    })
  return { rows, total: all.length }
}
