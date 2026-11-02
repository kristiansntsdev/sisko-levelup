'use client'
import type { CreateRegistrasiResult, RegistrasiMine } from '@/lib/actions/registrasi'
import { ticketStatusOnRequest } from '@/lib/registrasi-status'
import { addLog, getDb, mutate } from '../../db'
import { dayMs, fmtDay, fmtShort, posterOf, WW_CATEGORY } from '../util'

export type * from '@/lib/actions/registrasi'

const todayWib = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10)
const monthOf = (iso: string) => iso.slice(0, 7)

export async function updatePesertaProfile(
  idPeserta: number,
  data: {
    nama: string; nowa: string; kotalevelup?: string; gereja: string; sekolah: string; idTempatKerja: number | null
    gender?: string; tempatlahir?: string; tgllahir?: string; pendidikan?: string; jurusan?: string
    provinsi?: string; kabupaten?: string; kecamatan?: string; desa?: string; alamat?: string
  },
) {
  mutate((d) => {
    const p = d.peserta.find((x) => x.id_peserta === idPeserta)
    if (!p) return
    p.nama = data.nama
    p.nowa = data.nowa
    p.gereja = data.gereja
    p.pekerjaan = data.sekolah
    if (data.kotalevelup != null) p.kotalevelup = data.kotalevelup
    for (const k of ['gender', 'tempatlahir', 'tgllahir', 'pendidikan', 'jurusan', 'provinsi', 'kabupaten', 'kecamatan', 'desa', 'alamat'] as const) {
      if (data[k] != null) p[k] = data[k] as string
    }
  })
}

export async function countActiveRegistrasi(idEvent: number): Promise<number> {
  return getDb().registrasi.filter((r) => r.id_event === idEvent && r.status !== 'cancelled').length
}

export async function createRegistrasi(idPeserta: number, idEvent: number): Promise<CreateRegistrasiResult> {
  const d = getDb()
  const ev = d.event.find((e) => e.id_event === idEvent)
  if (!ev) return { full: true }
  const existing = d.registrasi.find((r) => r.id_peserta === idPeserta && r.id_event === idEvent)
  if (existing && existing.status !== 'cancelled') return existing.status === 'pending' ? { id: existing.id_registrasi, pending: true } : { id: existing.id_registrasi }
  if (ev.targetjumlah > 0 && (await countActiveRegistrasi(idEvent)) >= ev.targetjumlah) return { full: true }

  // Real rule is 'pending' until Sekretariat Nasional approves national tickets. The demo has no such approver.
  const status = ticketStatusOnRequest(ev.wwtype) === 'pending' ? 'confirmed' : 'confirmed'
  let id = existing?.id_registrasi ?? 0
  mutate((x) => {
    if (existing) {
      const row = x.registrasi.find((r) => r.id_registrasi === existing.id_registrasi)
      if (row) row.status = status
    } else {
      id = x.nextId++
      x.registrasi.push({ id_registrasi: id, id_peserta: idPeserta, id_event: idEvent, status })
    }
    addLog(x, `${x.peserta.find((p) => p.id_peserta === idPeserta)?.nama ?? 'Peserta'} mengambil tiket "${ev.nama_event}"`)
  })
  return { id }
}

export async function checkRegistrasi(idPeserta: number, idEvent: number): Promise<boolean> {
  return (await findRegistrasiId(idPeserta, idEvent)) != null
}

export async function findRegistrasiId(idPeserta: number, idEvent: number): Promise<number | null> {
  const r = getDb().registrasi.find((x) => x.id_peserta === idPeserta && x.id_event === idEvent && ['confirmed', 'attend', 'absence'].includes(x.status))
  return r?.id_registrasi ?? null
}

export async function findRegistrasiMine(idPeserta: number, idEvent: number): Promise<RegistrasiMine | null> {
  const r = getDb().registrasi.find((x) => x.id_peserta === idPeserta && x.id_event === idEvent && ['pending', 'confirmed', 'attend', 'absence'].includes(x.status))
  if (!r) return null
  return r.status === 'pending' ? { id: r.id_registrasi, status: 'pending' } : { id: r.id_registrasi, status: r.status as 'confirmed' | 'attend' | 'absence' }
}

export async function getRegistrasiDetail(idRegistrasi: number) {
  const d = getDb()
  const r = d.registrasi.find((x) => x.id_registrasi === idRegistrasi)
  if (!r) return null
  const e = d.event.find((x) => x.id_event === r.id_event)
  const p = d.peserta.find((x) => x.id_peserta === r.id_peserta)
  return {
    id_registrasi: r.id_registrasi,
    id_peserta: r.id_peserta,
    id_event: r.id_event,
    status: r.status,
    nama_event: e?.nama_event ?? '',
    posterUrl: (e && posterOf(e)) || null,
    jenisevent: e?.jenisevent ?? '',
    tglDisplay: e ? fmtDay(e.tglevent) : '',
    tglSelesaiDisplay: e ? fmtDay(e.tgleventselesai) : '',
    jamevent: e?.jamevent ?? '',
    jamselesaievent: e?.jamselesaievent ?? '',
    alamatevent: e?.alamatevent ?? '',
    pesertaNama: p?.nama ?? '',
    usercode: p?.usercode ?? '',
    tglSelesaiMs: e ? dayMs(e.tgleventselesai) : 0,
  }
}

export async function getRegistrasiByPeserta(idPeserta: number) {
  // Confirmed tickets of events that already ended become 'absence' (lazily, as in the real action).
  const stale = getDb().registrasi.some((r) => {
    const e = getDb().event.find((x) => x.id_event === r.id_event)
    return r.id_peserta === idPeserta && r.status === 'confirmed' && e && e.tgleventselesai < todayWib()
  })
  if (stale) {
    mutate((d) => {
      for (const r of d.registrasi) {
        const e = d.event.find((x) => x.id_event === r.id_event)
        if (r.id_peserta === idPeserta && r.status === 'confirmed' && e && e.tgleventselesai < todayWib()) r.status = 'absence'
      }
    })
  }
  const d = getDb()
  const thisMonth = monthOf(todayWib())
  const todayMs = dayMs(todayWib())
  return d.registrasi
    .filter((r) => r.id_peserta === idPeserta && ['confirmed', 'absence', 'attend'].includes(r.status))
    .map((r) => ({ r, e: d.event.find((x) => x.id_event === r.id_event)! }))
    .filter(({ e }) => e && monthOf(e.tglevent) === thisMonth)
    .sort((a, b) => a.e.tglevent.localeCompare(b.e.tglevent))
    .map(({ r, e }) => {
      const endMs = dayMs(e.tgleventselesai)
      const ticketState = r.status === 'attend' ? 'Hadir' : r.status === 'absence' ? 'Tidak hadir' : endMs < todayMs ? 'Tidak hadir' : 'Terdaftar'
      return {
        id_registrasi: r.id_registrasi,
        id_event: r.id_event,
        status: r.status,
        nama_event: e.nama_event,
        tglDisplay: fmtShort(e.tglevent),
        tglMs: dayMs(e.tglevent),
        tglSelesaiMs: endMs,
        jamevent: e.jamevent,
        jamselesaievent: e.jamselesaievent,
        jenisevent: e.jenisevent,
        category: WW_CATEGORY[e.wwtype] ?? 'Event',
        posterUrl: posterOf(e),
        alamatevent: e.alamatevent,
        ticketState: ticketState as 'Terdaftar' | 'Hadir' | 'Tidak hadir',
        active: r.status === 'confirmed' || (r.status === 'absence' && endMs >= todayMs),
      }
    })
}

// Nasional ticket approval does not exist in the demo.
export async function listPendingTiketNasional() {
  return []
}
export async function countPendingTiketNasional(): Promise<number> {
  return 0
}
export async function approveTiketNasional(): Promise<{ ok: false; error: string }> {
  return { ok: false, error: 'Tidak ada di demo' }
}
export async function rejectTiketNasional(): Promise<{ ok: false; error: string }> {
  return { ok: false, error: 'Tidak ada di demo' }
}
