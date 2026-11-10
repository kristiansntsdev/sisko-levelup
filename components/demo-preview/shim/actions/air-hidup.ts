'use client'
// Demo shim for the future lib/actions/air-hidup.ts: everything lives in the localStorage store, nothing touches a server.
// Rules: only a PIC (userlevel 4) of a city may report for it; Core and above (userlevel >= 3) read the feed.
import { addLog, getDb, mutate, wibDay, type DbWwLaporan, type DemoDb } from '../../db'
import { sessionPeserta } from '../util'
import { hitungNasional, kotaAir, perluPopup, urutKotaHaus, validateLaporan, type AirStage, type KotaAir, type LaporanInput, type WwLaporan } from '@/lib/air-hidup'

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

const todayOf = (d: DemoDb) => wibDay(d.air_hari)

function kotaList(d: DemoDb): KotaAir[] {
  const today = todayOf(d)
  return d.cabang.map((c) => {
    const terakhir = d.ww_laporan.filter((l) => l.id_cabang === c.id_cabang).reduce<string | null>((m, l) => (!m || l.tanggal > m ? l.tanggal : m), null)
    return kotaAir(c.id_cabang, c.namacabang, terakhir, today)
  })
}

function toLaporan(d: DemoDb, l: DbWwLaporan, meId: number | null): WwLaporan {
  const namaOf = (id: number) => d.cabang.find((c) => c.id_cabang === id)?.namacabang ?? `Kota ${id}`
  const aminRows = d.ww_amin.filter((a) => a.id_laporan === l.id_laporan)
  return {
    id: l.id_laporan,
    idCabang: l.id_cabang,
    namaKota: namaOf(l.id_cabang),
    tanggal: l.tanggal,
    jumlah: l.jumlah,
    isi: l.isi,
    foto: l.foto,
    oleh: l.oleh,
    alirKe: l.alir_ke != null ? { idCabang: l.alir_ke, namaKota: namaOf(l.alir_ke) } : null,
    amin: l.amin_awal + aminRows.length,
    aminSaya: meId != null && aminRows.some((a) => a.id_peserta === meId),
  }
}

const terbaru = (a: DbWwLaporan, b: DbWwLaporan) => (a.tanggal === b.tanggal ? b.id_laporan - a.id_laporan : a.tanggal < b.tanggal ? 1 : -1)

/** Hari WIB menurut jam simulasi demo. */
export async function getAirToday(): Promise<string> {
  return todayOf(getDb())
}

/** Dipakai landing (publik, hanya baca) dan aliran anggota. */
export async function getAirHidupFeed() {
  const d = getDb()
  const me = sessionPeserta()
  const today = todayOf(d)
  return {
    today,
    nasional: hitungNasional(d.ww_laporan.map((l) => ({ idCabang: l.id_cabang, tanggal: l.tanggal, jumlah: l.jumlah })), today),
    kota: kotaList(d),
    laporan: [...d.ww_laporan].sort(terbaru).map((l) => toLaporan(d, l, me?.id_peserta ?? null)),
  }
}

/** Bar air kota anggota (Core ke atas); null untuk level lain atau tanpa kota. */
export async function getAirKotaSaya(): Promise<{ kota: KotaAir; isPic: boolean; popup: AirStage | null } | null> {
  const d = getDb()
  const me = sessionPeserta()
  if (!me || Number(me.userlevel) < 3) return null
  const kota = kotaList(d).find((k) => String(k.idCabang) === me.kotalevelup)
  if (!kota) return null
  const popup = perluPopup(kota.stage) && !d.air_popup.includes(`${me.id_peserta}:${kota.stage}`) ? kota.stage : null
  return { kota, isPic: me.userlevel === '4', popup }
}

export async function tandaiPopup(stage: AirStage): Promise<void> {
  const me = sessionPeserta()
  if (!me) return
  mutate((d) => {
    const key = `${me.id_peserta}:${stage}`
    if (!d.air_popup.includes(key)) d.air_popup.push(key)
  })
}

export async function getPicDashboard() {
  const d = getDb()
  const me = sessionPeserta()
  if (!me || me.userlevel !== '4') return null
  const semua = kotaList(d)
  const kota = semua.find((k) => String(k.idCabang) === me.kotalevelup)
  if (!kota) return null
  const laporan = [...d.ww_laporan].sort(terbaru)
  const masuk = laporan.find((l) => l.alir_ke === kota.idCabang && l.id_cabang !== kota.idCabang)
  return {
    today: todayOf(d),
    kota,
    namaKota: kota.namaKota,
    masuk: masuk ? toLaporan(d, masuk, me.id_peserta) : null,
    laporanKota: laporan.filter((l) => l.id_cabang === kota.idCabang).map((l) => toLaporan(d, l, me.id_peserta)),
    kotaLain: urutKotaHaus(semua.filter((k) => k.idCabang !== kota.idCabang)),
  }
}

export async function kirimLaporanWw(input: LaporanInput): Promise<Result<{ id: number }>> {
  const d = getDb()
  const me = sessionPeserta()
  if (!me || me.userlevel !== '4') return { ok: false, error: 'Hanya PIC yang bisa melapor.' }
  const cabang = Number(me.kotalevelup)
  if (!d.cabang.some((c) => c.id_cabang === cabang)) return { ok: false, error: 'LevelUP Kota tidak valid.' }
  const err = validateLaporan(input, todayOf(d))
  if (err) return { ok: false, error: err }
  let id = 0
  mutate((x) => {
    id = x.nextId++
    x.ww_laporan.push({
      id_laporan: id,
      id_cabang: cabang,
      oleh: me.nama,
      tanggal: input.tanggal,
      jumlah: input.jumlah,
      isi: input.isi.trim(),
      foto: input.foto ?? '',
      alir_ke: null,
      amin_awal: 0,
      created_at: new Date().toISOString(),
    })
    addLog(x, `${me.nama} melaporkan WW (${input.jumlah} orang)`)
  })
  return { ok: true, id }
}

export async function alirkanKe(idLaporan: number, idCabang: number): Promise<Result> {
  const me = sessionPeserta()
  const d = getDb()
  const l = d.ww_laporan.find((x) => x.id_laporan === idLaporan)
  if (!me || !l || String(l.id_cabang) !== me.kotalevelup || me.userlevel !== '4') return { ok: false, error: 'Laporan bukan milik kotamu.' }
  if (idCabang === l.id_cabang || !d.cabang.some((c) => c.id_cabang === idCabang)) return { ok: false, error: 'Kota tujuan tidak valid.' }
  mutate((x) => {
    const row = x.ww_laporan.find((r) => r.id_laporan === idLaporan)
    if (row) row.alir_ke = idCabang
    addLog(x, `${me.nama} mengalirkan Air Hidup ke kota lain`)
  })
  return { ok: true }
}

export async function toggleAmin(idLaporan: number): Promise<void> {
  const me = sessionPeserta()
  if (!me) return
  mutate((d) => {
    const i = d.ww_amin.findIndex((a) => a.id_laporan === idLaporan && a.id_peserta === me.id_peserta)
    if (i >= 0) d.ww_amin.splice(i, 1)
    else d.ww_amin.push({ id_laporan: idLaporan, id_peserta: me.id_peserta })
  })
}

/** Demo only: majukan jam Air Hidup supaya turunnya air terlihat. */
export async function lompatHari(n: number): Promise<void> {
  mutate((d) => {
    d.air_hari += n
    addLog(d, `Simulasi waktu Air Hidup +${n} hari (hari ke +${d.air_hari})`)
  })
}
