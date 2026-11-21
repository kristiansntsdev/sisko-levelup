/**
 * Job terjadwal push: ulang tahun, acara hari ini (LevelUP Pusat), pengingat H-1 / hari-H, absen online dibuka.
 * Dipanggil tiap 15 menit oleh POST /api/internal/push-cron. Setiap job punya jendela jam WIB, dan push_kirim
 * (INSERT IGNORE) menjamin satu kiriman per kunci walau tick datang berkali-kali atau terlambat. Hanya server.
 */
import { db } from '@/lib/db'
import { isOnlineEvent } from '@/lib/event-link'
import { eventDateTime, getOnlineAbsenWindow } from '@/lib/event-absen-window'
import { NASIONAL_EVENT_CABANG } from '@/lib/event-cabang'
import { wibToday } from '@/lib/wib'
import {
  bersihkanKlaim, berlangganan, kirimPush, klaimPush, pushAktif, TTL_PENGINGAT,
  type Penerima, type PushOpts, type PushPayload,
} from './send'
import { halamanPengumuman, pastikanBarisUltah, teksUltahDiri, type OrangUltah } from './pengumuman'
import { daftarNama, ingatH0Aktif, jendelaBuka, ultahHariIni, wibIso } from './rules'

type Pesan = { to: Penerima; payload: PushPayload; opts?: PushOpts }
/** `tulis` false = dry run: hitung penerima saja, jangan menulis apa pun ke DB. */
type Grup = { kunci: string; pesan: (tulis: boolean) => Promise<Pesan[]> }
export type LaporanGrup = { kunci: string; status: 'sudah' | 'kosong' | 'siap' | 'terkirim'; penerima: number; terkirim: number }
export type LaporanJob = { job: string; status: 'di-luar-jendela' | 'ok'; grup: LaporanGrup[] }

const DEKAT = { ttl: TTL_PENGINGAT } satisfies PushOpts

function hitung(to: Penerima): number {
  return new Set(to.peserta ?? []).size + new Set(to.pengurus ?? []).size
}

async function sudahKlaim(kunci: string): Promise<boolean> {
  const rows = await db.$queryRaw<{ n: number }[]>`SELECT 1 AS n FROM push_kirim WHERE kunci = ${kunci} LIMIT 1`
  return rows.length > 0
}

async function jalankanGrup(g: Grup, dry: boolean): Promise<LaporanGrup> {
  if (await sudahKlaim(g.kunci)) return { kunci: g.kunci, status: 'sudah', penerima: 0, terkirim: 0 }
  const pesan = (await g.pesan(!dry)).filter((m) => hitung(m.to) > 0)
  const penerima = pesan.reduce((n, m) => n + hitung(m.to), 0)
  if (dry) return { kunci: g.kunci, status: pesan.length ? 'siap' : 'kosong', penerima, terkirim: 0 }
  if (!(await klaimPush(g.kunci))) return { kunci: g.kunci, status: 'sudah', penerima: 0, terkirim: 0 }
  let terkirim = 0
  for (const m of pesan) terkirim += (await kirimPush(m.to, m.payload, m.opts)).terkirim
  return { kunci: g.kunci, status: 'terkirim', penerima, terkirim }
}

type PesertaPush = { id_peserta: number; nama: string; kotalevelup: string; userlevel: string }

async function pesertaBerlangganan(): Promise<PesertaPush[]> {
  const { peserta } = await berlangganan()
  if (!peserta.length) return []
  return db.peserta.findMany({
    where: { id_peserta: { in: peserta } },
    select: { id_peserta: true, nama: true, kotalevelup: true, userlevel: true },
  })
}

async function petaKota(): Promise<Map<string, string>> {
  const rows = await db.cabang.findMany({ select: { id_cabang: true, namacabang: true } })
  return new Map(rows.map((c) => [String(c.id_cabang), c.namacabang]))
}

const kotaKey = (k: string) => String(Number(k))

// ───────────────────────── ulang tahun ─────────────────────────

async function orangUltahHariIni(now: Date): Promise<OrangUltah[]> {
  const semua = await db.peserta.findMany({
    where: { tgllahir: { not: '' } },
    select: { id_peserta: true, nama: true, tgllahir: true, kotalevelup: true, userlevel: true },
  })
  return semua.filter((p) => ultahHariIni(p.tgllahir, now))
}

/**
 * Yang berulang tahun: baris di halaman pengumuman (dibuat sekali per orang per hari, juga bagi yang belum
 * mengaktifkan notifikasi) + push ucapan dari LevelUP Pusat ke dirinya. Satu kunci per orang, jadi tanggal lahir
 * yang diubah setelah tick pagi tetap terkirim di tick berikutnya selama jendela buka.
 */
async function pesanUltahDiri(u: OrangUltah, now: Date, tulis: boolean): Promise<Pesan[]> {
  const id = tulis ? await pastikanBarisUltah(u, wibIso(now)) : 0
  const teks = teksUltahDiri(u.nama)
  return [{
    to: { peserta: [u.id_peserta] },
    payload: { ...teks, url: id ? halamanPengumuman(id) : '/dashboard/pengumuman', tag: `ultah-diri-${u.id_peserta}-${wibIso(now)}` },
    opts: DEKAT,
  }]
}

/** Push ke teman: satu pesan per hari per penerima, nama yang berulang tahun digabung. */
async function pesanUltah(now: Date): Promise<Pesan[]> {
  const subs = await pesertaBerlangganan()
  if (!subs.length) return []
  const ultah = await orangUltahHariIni(now)
  if (!ultah.length) return []
  const kota = await petaKota()
  const namaKota = (p: { kotalevelup: string }) => kota.get(kotaKey(p.kotalevelup)) ?? 'LevelUP'

  // Satu pesan per (kelompok penerima, isi): penerima dengan isi yang sama digabung. Diri sendiri tidak ikut.
  const bucket = new Map<string, { teks: string; ids: number[] }>()
  for (const r of subs) {
    const level = Number(r.userlevel)
    const kotaR = kotaKey(r.kotalevelup)
    const lain = ultah.filter((u) => u.id_peserta !== r.id_peserta)
    const lihat =
      level >= 5
        ? lain.map((u) => `${u.nama} (${namaKota(u)})`)
        : level === 4
          ? lain.filter((u) => kotaKey(u.kotalevelup) === kotaR || u.userlevel === '4').map((u) => (kotaKey(u.kotalevelup) === kotaR ? u.nama : `${u.nama} (${namaKota(u)})`))
          : lain.filter((u) => kotaKey(u.kotalevelup) === kotaR).map((u) => u.nama)
    if (!lihat.length) continue
    const teks = daftarNama(lihat)
    const b = bucket.get(teks) ?? { teks, ids: [] }
    b.ids.push(r.id_peserta)
    bucket.set(teks, b)
  }
  return [...bucket.values()].map((b) => ({
    to: { peserta: b.ids },
    payload: { title: 'Ulang tahun hari ini 🎂', body: `Doakan & ucapkan selamat untuk ${b.teks}`, url: '/dashboard/pengumuman', tag: `ultah-${wibIso(now)}` },
    opts: DEKAT,
  }))
}

// ───────────────────────── event ─────────────────────────

type EventPush = {
  id_event: number; nama_event: string; tglevent: Date; tgleventselesai: Date; jamevent: string
  jamselesaievent: string; id_cabang: string; jenisevent: string; alamatevent: string
}
const EVENT_SELECT = {
  id_event: true, nama_event: true, tglevent: true, tgleventselesai: true, jamevent: true,
  jamselesaievent: true, id_cabang: true, jenisevent: true, alamatevent: true,
} as const

const DISETUJUI = { approvenasional: '1', approvebrimnas: '1' } as const

/** Pendaftar tiket aktif + PIC kota event (semua event kotanya, daftar atau tidak). */
async function penerimaEvent(ev: EventPush): Promise<{ daftar: number[]; pic: number[] }> {
  const regs = await db.registrasi.findMany({
    where: { id_event: ev.id_event, status: { in: ['confirmed', 'attend', 'absence'] } },
    select: { id_peserta: true },
  })
  const daftar = regs.map((r) => r.id_peserta)
  let pic: number[] = []
  if (ev.id_cabang !== NASIONAL_EVENT_CABANG) {
    const subs = await pesertaBerlangganan()
    pic = subs
      .filter((p) => p.userlevel === '4' && kotaKey(p.kotalevelup) === kotaKey(ev.id_cabang))
      .map((p) => p.id_peserta)
      .filter((id) => !daftar.includes(id))
  }
  return { daftar, pic }
}

function lokasi(ev: EventPush): string {
  return isOnlineEvent(ev.jenisevent) ? 'Online' : ev.alamatevent.trim().slice(0, 60) || 'Offline'
}

async function pesanIngat(ev: EventPush, kapan: 'besok' | 'hari-ini'): Promise<Pesan[]> {
  const { daftar, pic } = await penerimaEvent(ev)
  const judul = kapan === 'besok' ? `Besok: ${ev.nama_event}` : `Hari ini ${ev.jamevent}: ${ev.nama_event}`
  const online = isOnlineEvent(ev.jenisevent)
  const bodyDaftar = online
    ? `${ev.jamevent} · Online. Absen dibuka dari tiketmu menjelang selesai.`
    : `${ev.jamevent} · ${lokasi(ev)}. Siapkan QR tiketmu untuk absen.`
  const bodyPic = `${ev.jamevent} · ${lokasi(ev)}. Acara kotamu, ajak anggota hadir.`
  const tag = `ingat-${ev.id_event}`
  return [
    { to: { peserta: daftar }, payload: { title: judul, body: bodyDaftar, url: '/dashboard/tiket', tag }, opts: DEKAT },
    { to: { peserta: pic }, payload: { title: judul, body: bodyPic, url: '/events', tag }, opts: DEKAT },
  ]
}

async function eventBesok(now: Date): Promise<EventPush[]> {
  const besok = new Date(wibToday(now).getTime() + 24 * 60 * 60 * 1000)
  return db.event.findMany({ where: { tglevent: besok, ...DISETUJUI }, select: EVENT_SELECT })
}

async function eventHariIni(now: Date): Promise<EventPush[]> {
  return db.event.findMany({ where: { tglevent: wibToday(now), ...DISETUJUI }, select: EVENT_SELECT })
}

// ───────────────────────── daftar job ─────────────────────────

async function grupUltah(now: Date): Promise<Grup[]> {
  const tgl = wibIso(now)
  const diri: Grup[] = (await orangUltahHariIni(now)).map((u) => ({
    kunci: `ultah-diri:${tgl}:${u.id_peserta}`,
    pesan: (tulis) => pesanUltahDiri(u, now, tulis),
  }))
  // Baris halaman dibuat dulu (grup `diri`), baru push ke teman.
  return [...diri, { kunci: `ultah:${tgl}`, pesan: () => pesanUltah(now) }]
}

async function grupAcaraHariIni(now: Date): Promise<Grup[]> {
  const hari = wibToday(now)
  return [
    {
      kunci: `acara-hari-ini:${wibIso(now)}`,
      pesan: async () => {
        const pusat = (await pesertaBerlangganan()).filter((p) => p.userlevel === '5').map((p) => p.id_peserta)
        if (!pusat.length) return []
        const events = await db.event.findMany({
          where: { tglevent: { lte: hari }, tgleventselesai: { gte: hari }, ...DISETUJUI },
          select: EVENT_SELECT,
          orderBy: { jamevent: 'asc' },
        })
        if (!events.length) return []
        const kota = await petaKota()
        const nama = events.map((e) => `${e.nama_event} (${e.id_cabang === NASIONAL_EVENT_CABANG ? 'Nasional' : (kota.get(kotaKey(e.id_cabang)) ?? 'LevelUP')})`)
        return [{
          to: { peserta: pusat },
          payload: { title: `Acara hari ini: ${events.length}`, body: daftarNama(nama), url: '/events', tag: `acara-${wibIso(now)}` },
          opts: DEKAT,
        }]
      },
    },
  ]
}

async function grupIngatH1(now: Date): Promise<Grup[]> {
  return (await eventBesok(now)).map((ev) => ({ kunci: `ingat-h1:${ev.id_event}`, pesan: () => pesanIngat(ev, 'besok') }))
}

async function grupIngatH0(now: Date): Promise<Grup[]> {
  const events = await eventHariIni(now)
  return events
    .filter((ev) => ingatH0Aktif(eventDateTime(ev.tglevent, ev.jamevent), now))
    .map((ev) => ({ kunci: `ingat-h0:${ev.id_event}`, pesan: () => pesanIngat(ev, 'hari-ini') }))
}

/** Event Online: absen dibuka 15 menit sebelum jam selesai. Dikirim ke pendaftar yang belum absen, sampai 3 jam sesudah dibuka. */
async function grupAbsenBuka(now: Date): Promise<Grup[]> {
  const events = await db.event.findMany({ where: { tgleventselesai: wibToday(now), ...DISETUJUI }, select: EVENT_SELECT })
  return events
    .filter((ev) => {
      if (!isOnlineEvent(ev.jenisevent)) return false
      const selesai = eventDateTime(ev.tgleventselesai, ev.jamselesaievent)
      if (!selesai) return false
      const { opensAt } = getOnlineAbsenWindow(selesai)
      const t = now.getTime()
      return t >= opensAt.getTime() && t < opensAt.getTime() + 3 * 60 * 60 * 1000
    })
    .map((ev) => ({
      kunci: `absen-buka:${ev.id_event}`,
      pesan: async () => {
        const regs = await db.registrasi.findMany({
          where: { id_event: ev.id_event, status: { in: ['confirmed', 'absence'] } },
          select: { id_peserta: true },
        })
        const ids = regs.map((r) => r.id_peserta)
        if (!ids.length) return []
        const sudah = await db.absen.findMany({
          where: { id_event_int: ev.id_event, id_peserta_int: { in: ids } },
          select: { id_peserta_int: true },
        })
        const hadir = new Set(sudah.map((a) => a.id_peserta_int))
        return [{
          to: { peserta: ids.filter((id) => !hadir.has(id)) },
          payload: { title: 'Absen sudah dibuka', body: `${ev.nama_event} — buka tiketmu lalu tekan Absen Event.`, url: '/dashboard/tiket', tag: `absen-${ev.id_event}` },
          opts: DEKAT,
        }]
      },
    }))
}

const JOBS: { nama: string; jendela?: 'ultah' | 'acara-hari-ini' | 'ingat-h1'; grup: (now: Date) => Promise<Grup[]> }[] = [
  { nama: 'ultah', jendela: 'ultah', grup: grupUltah },
  { nama: 'acara-hari-ini', jendela: 'acara-hari-ini', grup: grupAcaraHariIni },
  { nama: 'ingat-h1', jendela: 'ingat-h1', grup: grupIngatH1 },
  { nama: 'ingat-h0', grup: grupIngatH0 },
  { nama: 'absen-buka', grup: grupAbsenBuka },
]

/** Jalankan semua job yang jendelanya sedang buka. `dry`: hitung penerima saja, tanpa klaim dan tanpa kirim. */
export async function jalankanPushJobs(now: Date = new Date(), dry = false): Promise<{ aktif: boolean; jobs: LaporanJob[] }> {
  if (!pushAktif()) return { aktif: false, jobs: [] }
  const jobs: LaporanJob[] = []
  for (const job of JOBS) {
    if (job.jendela && !jendelaBuka(job.jendela, now)) {
      jobs.push({ job: job.nama, status: 'di-luar-jendela', grup: [] })
      continue
    }
    try {
      const grup: LaporanGrup[] = []
      for (const g of await job.grup(now)) grup.push(await jalankanGrup(g, dry))
      jobs.push({ job: job.nama, status: 'ok', grup })
    } catch (err) {
      console.error(`[push] job ${job.nama} gagal`, err)
      jobs.push({ job: job.nama, status: 'ok', grup: [] })
    }
  }
  if (!dry && (await klaimPush(`bersihkan:${wibIso(now)}`))) await bersihkanKlaim().catch((e: unknown) => console.error('[push] bersihkan gagal', e))
  return { aktif: true, jobs }
}

