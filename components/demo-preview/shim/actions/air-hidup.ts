'use client'
// Demo shim for lib/actions/air-hidup.ts (+ lib/air-hidup-data.ts): same names and shapes, backed by the localStorage store.
// Rules mirror production: only a PIC (userlevel 4) of a city may report for it; Core and above (>= 3) see their city bar.
import { addLog, getDb, mutate, wibDay, type DbWwLaporan, type DemoDb } from '../../db'
import { fileToDataUrl, sessionPeserta } from '../util'
import {
  fokusDari, hitungNasional, kotaAir, laporanDari, validateLaporan,
  type AirBeranda, type AliranData, type EditData, type KotaAir, type PicData, type WwLaporan,
} from '@/lib/air-hidup'

const todayOf = (d: DemoDb) => wibDay(d.air_hari)

function kotaList(d: DemoDb): KotaAir[] {
  const today = todayOf(d)
  return d.cabang.map((c) => {
    // Sama dengan produksi: air terisi di hari laporan dikirim, bukan tanggal WW.
    const terakhir = d.ww_laporan
      .filter((l) => l.id_cabang === c.id_cabang)
      .reduce<string | null>((m, l) => {
        const hari = l.dikirim ?? l.tanggal
        return !m || hari > m ? hari : m
      }, null)
    return kotaAir(c.id_cabang, c.namacabang, terakhir, today, d.air_mulai[c.id_cabang] ?? null)
  })
}

function toLaporan(d: DemoDb, l: DbWwLaporan, meId: number | null): WwLaporan {
  const aminRows = d.ww_amin.filter((a) => a.id_laporan === l.id_laporan)
  return {
    id: l.id_laporan,
    idCabang: l.id_cabang,
    namaKota: d.cabang.find((c) => c.id_cabang === l.id_cabang)?.namacabang ?? `Kota ${l.id_cabang}`,
    tanggal: l.tanggal,
    jumlah: l.jumlah,
    isi: l.isi,
    foto: l.foto,
    fotoX: l.foto_x ?? 50,
    fotoY: l.foto_y ?? 50,
    oleh: l.oleh,
    amin: l.amin_awal + aminRows.length,
    aminSaya: meId != null && aminRows.some((a) => a.id_peserta === meId),
  }
}

const terbaru = (a: DbWwLaporan, b: DbWwLaporan) => (a.tanggal === b.tanggal ? b.id_laporan - a.id_laporan : a.tanggal < b.tanggal ? 1 : -1)

/** Beranda: Kabar Terbaru untuk semua anggota, bar kota hanya Core ke atas. */
export async function getAirBeranda(): Promise<AirBeranda | null> {
  const d = getDb()
  const me = sessionPeserta()
  if (!me) return null
  const kota = Number(me.userlevel) >= 3 ? (kotaList(d).find((k) => String(k.idCabang) === me.kotalevelup) ?? null) : null
  return { kota, isPic: me.userlevel === '4', pembaca: `p${me.id_peserta}`, laporan: [...d.ww_laporan].sort(terbaru).slice(0, 3).map((l) => toLaporan(d, l, me.id_peserta)) }
}

/** Dashboard PIC + Lapor WW. null = bukan PIC. */
export async function getPicData(): Promise<PicData | null> {
  const d = getDb()
  const me = sessionPeserta()
  if (!me || me.userlevel !== '4') return null
  const kota = kotaList(d).find((k) => String(k.idCabang) === me.kotalevelup)
  if (!kota) return null
  return {
    today: todayOf(d),
    kota,
    namaKota: kota.namaKota,
    laporanKota: [...d.ww_laporan].sort(terbaru).filter((l) => l.id_cabang === kota.idCabang).map((l) => toLaporan(d, l, me.id_peserta)),
  }
}

/** Aliran (anggota) dan landing (publik, hanya baca): bar tiap kota hanya LevelUP Pusat. */
export async function getAliranData(): Promise<AliranData> {
  const d = getDb()
  const me = sessionPeserta()
  const today = todayOf(d)
  return {
    today,
    nasional: hitungNasional(d.ww_laporan.map((l) => ({ idCabang: l.id_cabang, tanggal: l.tanggal, jumlah: l.jumlah })), today),
    kota: me && Number(me.userlevel) >= 5 ? kotaList(d) : undefined,
    laporan: [...d.ww_laporan].sort(terbaru).map((l) => toLaporan(d, l, me?.id_peserta ?? null)),
  }
}

export async function kirimLaporanWw(fd: FormData): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const d = getDb()
  const me = sessionPeserta()
  if (!me || me.userlevel !== '4') return { ok: false, error: 'Hanya PIC yang bisa melapor.' }
  const cabang = Number(me.kotalevelup)
  if (!d.cabang.some((c) => c.id_cabang === cabang)) return { ok: false, error: 'LevelUP Kota tidak valid.' }
  const input = laporanDari(fd)
  const err = validateLaporan(input, todayOf(d))
  if (err) return { ok: false, error: err }
  const isi = input.isi.trim()
  if (d.ww_laporan.some((l) => l.id_cabang === cabang && l.tanggal === input.tanggal && l.isi === isi && l.jumlah === input.jumlah)) return { ok: false, error: 'Laporan ini sudah terkirim.' }
  const file = fd.get('foto')
  const foto = file instanceof Blob && file.size > 0 ? await fileToDataUrl(new File([file], 'foto.jpg', { type: file.type }), 900, 0.78) : ''
  const fokus = fokusDari(fd)
  let id = 0
  mutate((x) => {
    id = x.nextId++
    x.ww_laporan.push({ id_laporan: id, id_cabang: cabang, oleh: me.nama, tanggal: input.tanggal, jumlah: input.jumlah, isi, foto, foto_x: fokus.x, foto_y: fokus.y, amin_awal: 0, created_at: new Date().toISOString(), dikirim: todayOf(d) })
    addLog(x, `${me.nama} melaporkan WW (${input.jumlah} orang)`)
  })
  return { ok: true, id }
}

/** Laporan untuk diedit: hanya PIC kota pemilik laporan. */
export async function getEditLaporan(idLaporan: number): Promise<EditData | null> {
  const d = getDb()
  const me = sessionPeserta()
  if (!me || me.userlevel !== '4') return null
  const l = d.ww_laporan.find((x) => x.id_laporan === idLaporan && String(x.id_cabang) === me.kotalevelup)
  if (!l) return null
  const kota = d.cabang.find((c) => c.id_cabang === l.id_cabang)
  return {
    today: todayOf(d),
    namaKota: kota?.namacabang ?? `Kota ${l.id_cabang}`,
    laporan: { id: l.id_laporan, tanggal: l.tanggal, jumlah: l.jumlah, isi: l.isi, foto: l.foto, fotoX: l.foto_x ?? 50, fotoY: l.foto_y ?? 50 },
  }
}

export async function perbaruiLaporanWw(idLaporan: number, fd: FormData): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const d = getDb()
  const me = sessionPeserta()
  if (!me || me.userlevel !== '4') return { ok: false, error: 'Hanya PIC yang bisa mengubah laporan.' }
  const lama = d.ww_laporan.find((l) => l.id_laporan === idLaporan && String(l.id_cabang) === me.kotalevelup)
  if (!lama) return { ok: false, error: 'Laporan tidak ditemukan.' }
  const input = laporanDari(fd)
  const err = validateLaporan(input, todayOf(d))
  if (err) return { ok: false, error: err }
  const isi = input.isi.trim()
  if (d.ww_laporan.some((l) => l.id_laporan !== idLaporan && l.id_cabang === lama.id_cabang && l.tanggal === input.tanggal && l.isi === isi && l.jumlah === input.jumlah)) return { ok: false, error: 'Laporan yang sama sudah ada.' }
  const file = fd.get('foto')
  const fotoBaru = file instanceof Blob && file.size > 0 ? await fileToDataUrl(new File([file], 'foto.jpg', { type: file.type }), 900, 0.78) : ''
  const foto = fotoBaru || (fd.get('hapusFoto') === '1' ? '' : lama.foto)
  const fokus = foto ? fokusDari(fd) : { x: 50, y: 50 }
  mutate((x) => {
    const l = x.ww_laporan.find((r) => r.id_laporan === idLaporan)
    if (!l) return
    Object.assign(l, { tanggal: input.tanggal, jumlah: input.jumlah, isi, foto, foto_x: fokus.x, foto_y: fokus.y })
    addLog(x, `${me.nama} mengubah laporan WW (${input.jumlah} orang)`)
  })
  return { ok: true, id: idLaporan }
}

export async function toggleAmin(idLaporan: number): Promise<{ ok: true; amin: number; aminSaya: boolean } | { ok: false }> {
  const me = sessionPeserta()
  if (!me || !getDb().ww_laporan.some((l) => l.id_laporan === idLaporan)) return { ok: false }
  mutate((d) => {
    const i = d.ww_amin.findIndex((a) => a.id_laporan === idLaporan && a.id_peserta === me.id_peserta)
    if (i >= 0) d.ww_amin.splice(i, 1)
    else d.ww_amin.push({ id_laporan: idLaporan, id_peserta: me.id_peserta })
  })
  const d = getDb()
  const l = d.ww_laporan.find((x) => x.id_laporan === idLaporan)!
  return { ok: true, ...(({ amin, aminSaya }) => ({ amin, aminSaya }))(toLaporan(d, l, me.id_peserta)) }
}

/** Demo only: majukan jam Air Hidup supaya turunnya air terlihat. */
export async function lompatHari(n: number): Promise<void> {
  mutate((d) => {
    d.air_hari += n
    addLog(d, `Simulasi waktu Air Hidup +${n} hari (hari ke +${d.air_hari})`)
  })
}
