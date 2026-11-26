'use client'
// Demo shim for lib/actions/air-hidup.ts (+ lib/air-hidup-data.ts): same names and shapes, backed by the localStorage store.
// Rules mirror production: only a PIC (userlevel 4) of a city may report for it; Core and above (>= 3) see their city bar.
import { addLog, getDb, mutate, wibDay, type DbWwLaporan, type DemoDb } from '../../db'
import { fileToDataUrl, sessionPeserta } from '../util'
import { isOnlineEvent } from '@/lib/event-link'
import {
  airAnggota, fokusDari, hitungNasional, laporanDari, ringkasKota, terakhirMinum, validateLaporan,
  type AirAnggota, type AirBeranda, type AliranData, type EditData, type KotaAir, type PicData, type WwLaporan,
} from '@/lib/air-hidup'

const todayOf = (d: DemoDb) => wibDay(d.air_hari)

/** Sama dengan produksi: terakhir minum = yang paling baru antara absen di event Online dan penandaan di laporan WW. */
function anggotaList(d: DemoDb): AirAnggota[] {
  const today = todayOf(d)
  const online = new Set(d.event.filter((e) => isOnlineEvent(e.jenisevent)).map((e) => e.id_event))
  return d.peserta.map((p) => {
    const kota = d.cabang.find((c) => String(c.id_cabang) === p.kotalevelup)
    const tag = d.ww_peserta.filter((t) => t.id_peserta === p.id_peserta).map((t) => t.hari)
    const absen = d.absen.filter((a) => a.id_peserta === p.id_peserta && online.has(a.id_event)).map((a) => a.hari ?? wibDay(0, new Date(a.timestamp)))
    return airAnggota({
      id: p.id_peserta, nama: p.nama, idCabang: kota?.id_cabang ?? null, namaKota: kota?.namacabang ?? null,
      terakhir: terakhirMinum(...tag, ...absen), mulai: kota ? (d.air_mulai[kota.id_cabang] ?? null) : null,
    }, today)
  })
}

function kotaList(d: DemoDb, anggota = anggotaList(d)): KotaAir[] {
  return d.cabang.map((c) => ringkasKota(c.id_cabang, c.namacabang, anggota.filter((a) => a.idCabang === c.id_cabang)))
}

/** Anggota kota ini yang sah ditandai (demo: peserta dengan kotalevelup sama). */
const anggotaKota = (d: DemoDb, cabang: number) => d.peserta.filter((p) => p.kotalevelup === String(cabang)).map((p) => p.id_peserta)

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

/** Beranda: air milik sendiri + Kabar Terbaru untuk semua anggota. */
export async function getAirBeranda(): Promise<AirBeranda | null> {
  const d = getDb()
  const me = sessionPeserta()
  if (!me) return null
  const semua = anggotaList(d)
  const isPic = me.userlevel === '4'
  const kota = isPic ? kotaList(d, semua).find((k) => String(k.idCabang) === me.kotalevelup) : undefined
  return {
    saya: semua.find((a) => a.id === me.id_peserta) ?? null,
    isPic,
    anggotaHaus: isPic ? (kota?.perluMinum ?? 0) : null,
    pembaca: `p${me.id_peserta}`,
    laporan: [...d.ww_laporan].sort(terbaru).slice(0, 3).map((l) => toLaporan(d, l, me.id_peserta)),
  }
}

/** Dashboard PIC + Lapor WW. null = bukan PIC. */
export async function getPicData(): Promise<PicData | null> {
  const d = getDb()
  const me = sessionPeserta()
  if (!me || me.userlevel !== '4') return null
  const semua = anggotaList(d)
  const kota = kotaList(d, semua).find((k) => String(k.idCabang) === me.kotalevelup)
  if (!kota) return null
  return {
    today: todayOf(d),
    kota,
    namaKota: kota.namaKota,
    anggota: semua.filter((a) => a.idCabang === kota.idCabang),
    laporanKota: [...d.ww_laporan].sort(terbaru).filter((l) => l.id_cabang === kota.idCabang).map((l) => toLaporan(d, l, me.id_peserta)),
  }
}

/** Aliran (anggota) dan landing (publik, hanya baca): air tiap kota hanya LevelUP Pusat. */
export async function getAliranData(): Promise<AliranData> {
  const d = getDb()
  const me = sessionPeserta()
  const today = todayOf(d)
  const semua = anggotaList(d)
  return {
    today,
    nasional: hitungNasional(semua),
    kota: me && Number(me.userlevel) >= 5 ? kotaList(d, semua) : undefined,
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
  const sah = anggotaKota(d, cabang)
  if (input.anggota.some((id) => !sah.includes(id))) return { ok: false, error: 'Ada anggota yang bukan dari kotamu.' }
  const jumlah = input.anggota.length
  const isi = input.isi.trim()
  if (d.ww_laporan.some((l) => l.id_cabang === cabang && l.tanggal === input.tanggal && l.isi === isi && l.jumlah === jumlah)) return { ok: false, error: 'Laporan ini sudah terkirim.' }
  const file = fd.get('foto')
  const foto = file instanceof Blob && file.size > 0 ? await fileToDataUrl(new File([file], 'foto.jpg', { type: file.type }), 900, 0.78) : ''
  const fokus = fokusDari(fd)
  let id = 0
  mutate((x) => {
    id = x.nextId++
    x.ww_laporan.push({ id_laporan: id, id_cabang: cabang, oleh: me.nama, tanggal: input.tanggal, jumlah, isi, foto, foto_x: fokus.x, foto_y: fokus.y, amin_awal: 0, created_at: new Date().toISOString(), dikirim: todayOf(d) })
    for (const idp of input.anggota) x.ww_peserta.push({ id_laporan: id, id_peserta: idp, hari: todayOf(d) })
    addLog(x, `${me.nama} melaporkan WW (${jumlah} orang)`)
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
  const ditandai = d.ww_peserta.filter((t) => t.id_laporan === idLaporan).map((t) => t.id_peserta)
  return {
    today: todayOf(d),
    namaKota: kota?.namacabang ?? `Kota ${l.id_cabang}`,
    // Yang sudah ditandai tetap tampil walau kotanya kini pindah (sama dengan produksi).
    anggota: anggotaList(d).filter((a) => a.idCabang === l.id_cabang || ditandai.includes(a.id)),
    laporan: { id: l.id_laporan, tanggal: l.tanggal, anggota: ditandai, isi: l.isi, foto: l.foto, fotoX: l.foto_x ?? 50, fotoY: l.foto_y ?? 50 },
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
  const ditandai = d.ww_peserta.filter((t) => t.id_laporan === idLaporan).map((t) => t.id_peserta)
  const sah = anggotaKota(d, lama.id_cabang)
  if (input.anggota.some((id) => !sah.includes(id) && !ditandai.includes(id))) return { ok: false, error: 'Ada anggota yang bukan dari kotamu.' }
  const jumlah = input.anggota.length
  const isi = input.isi.trim()
  if (d.ww_laporan.some((l) => l.id_laporan !== idLaporan && l.id_cabang === lama.id_cabang && l.tanggal === input.tanggal && l.isi === isi && l.jumlah === jumlah)) return { ok: false, error: 'Laporan yang sama sudah ada.' }
  const file = fd.get('foto')
  const fotoBaru = file instanceof Blob && file.size > 0 ? await fileToDataUrl(new File([file], 'foto.jpg', { type: file.type }), 900, 0.78) : ''
  const foto = fotoBaru || (fd.get('hapusFoto') === '1' ? '' : lama.foto)
  const fokus = foto ? fokusDari(fd) : { x: 50, y: 50 }
  mutate((x) => {
    const l = x.ww_laporan.find((r) => r.id_laporan === idLaporan)
    if (!l) return
    Object.assign(l, { tanggal: input.tanggal, jumlah, isi, foto, foto_x: fokus.x, foto_y: fokus.y })
    // Yang tetap ditandai tidak berubah, yang baru terisi hari ini, yang dicoret kehilangan isinya (sama dengan produksi).
    x.ww_peserta = [
      ...x.ww_peserta.filter((t) => t.id_laporan !== idLaporan || input.anggota.includes(t.id_peserta)),
      ...input.anggota.filter((idp) => !ditandai.includes(idp)).map((idp) => ({ id_laporan: idLaporan, id_peserta: idp, hari: todayOf(x) })),
    ]
    addLog(x, `${me.nama} mengubah laporan WW (${jumlah} orang)`)
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
