'use client'
// Client-only "database" for /demo-preview. Tables mirror the real Prisma rows (same column names)
// so the shim actions can return exactly what lib/actions/* return and the real UI renders unchanged.
// State lives in memory + localStorage only. Never import lib/actions/*, next-auth, @/lib/db or prisma here.

export const STORAGE_KEY = 'levelup-demo-preview:v4'
const VERSION = 2
const DAY = 24 * 60 * 60 * 1000
const WIB = 7 * 60 * 60 * 1000

export type DbCabang = { id_cabang: number; namacabang: string; leadercabang: string }

export type DbPeserta = {
  id_peserta: number
  usercode: string
  nama: string
  nowa: string
  gereja: string
  pekerjaan: string
  userlevel: string
  kotalevelup: string
  gender: string
  tempatlahir: string
  tgllahir: string
  email: string
  password: string
  foto: string
  pendidikan: string
  jurusan: string
  provinsi: string
  kabupaten: string
  kecamatan: string
  desa: string
  alamat: string
}

export type DbPengurus = {
  id_pengurus: number
  nama: string
  username: string
  password: string
  divisi: string
  kotalevelup: string
}

export type DbEvent = {
  id_event: number
  nama_event: string
  jenisevent: string
  wwtype: 'bulanan' | 'jfe' | 'nasional'
  id_cabang: string
  target: string
  targetpengurus: string
  targetjumlah: number
  tglevent: string // yyyy-mm-dd (WIB calendar day)
  tgleventselesai: string
  jamevent: string
  jamselesaievent: string
  alamatevent: string
  longlatevent: string
  radius: number
  danaevent: string
  suratpemberitahuan: string
  khusus: string
  posterevent: string
  image_url: string
  linkevent: string
  approvenasional: string
  approvebrimnas: string
  notenasional: string
}

export type DbSesi = {
  id_sesi: number
  id_event: number
  nama: string
  tanggal: string
  jam_mulai: string
  jam_selesai: string
  wajib: boolean
  urutan: number
  id_lokasi: number | null
}

export type DbRegistrasi = {
  id_registrasi: number
  id_peserta: number
  id_event: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'attend' | 'absence'
}

export type DbAbsen = {
  id_absen: number
  id_peserta: number
  id_event: number
  id_sesi: number | null
  email: string
  timestamp: string // ISO instant
}

/** member '1' = Tamu→Volunteer request (demo-only step), '2' = Volunteer→Squad (the real `upgrade` row). */
export type DbUpgrade = { id_upgrade: number; id_peserta: number; member: '1' | '2'; at: string }

export type DbReimburseHistory = { stage: string; at: string; by: string; note?: string }

export type DbReimburse = {
  id_reimburse: number
  id_event: string
  ajukan: string
  namabank: string
  norek: string
  namarek: string
  danausul: string
  danariil: string
  laporan: string
  bukti: string
  /** Korwil PPHTGD (step 1): '' menunggu, '1' setuju, '0' tolak */
  approvepphtgd: string
  notepphtgd: string
  /** PIC LevelUP Pusat (step 2) */
  approvenasional: string
  notenasional: string
  /** Keuangan PPHTGD (step 3) = cair */
  approvekeuangan: string
  notekeuangan: string
  buktitf: string
  /** Snapshot korwil yang dipilih saat submit (reimburse_approval di app asli) */
  korwil: DemoKorwil | null
  korwil_at: string | null
  pic_at: string | null
  cair_at: string | null
  at: string // last time the request changed hands
  history: DbReimburseHistory[]
}

export type DbSession = {
  idPeserta: number | null
  idPengurus: number | null
  /** A Google account that has signed in but has no peserta row yet (needs /daftar). */
  google: { email: string; name: string } | null
}

export type DemoDb = {
  v: number
  seededAt: string
  cabang: DbCabang[]
  peserta: DbPeserta[]
  pengurus: DbPengurus[]
  event: DbEvent[]
  event_sesi: DbSesi[]
  registrasi: DbRegistrasi[]
  absen: DbAbsen[]
  upgrade: DbUpgrade[]
  reimburse: DbReimburse[]
  log: { id: number; at: string; msg: string }[]
  nextId: number
  session: DbSession
}

// ── Demo accounts shown on the login screen ──────────────────────────────────────────────────────

export type DemoAccount = {
  key: string
  kind: 'peserta' | 'pengurus' | 'google-new'
  label: string
  note: string
  email: string
  phone: string
  password: string
}

export const DEMO_PASSWORD = 'demo123'

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { key: 'tamu', kind: 'peserta', label: 'Tamu', note: 'Level 0 · Join Volunteer lalu tunggu approval admin', email: 'tamu@demo.levelup.id', phone: '0812-0000-0001', password: DEMO_PASSWORD },
  { key: 'volunteer', kind: 'peserta', label: 'Volunteer', note: 'Level 1 · Join Squad pilih LevelUP Kota', email: 'volunteer@demo.levelup.id', phone: '0812-0000-0002', password: DEMO_PASSWORD },
  { key: 'squad', kind: 'peserta', label: 'Squad', note: 'Level 2 · Join Core belum dibuka', email: 'squad@demo.levelup.id', phone: '0812-0000-0003', password: DEMO_PASSWORD },
  { key: 'core', kind: 'peserta', label: 'Core', note: 'Level 3 · bisa lihat event nasional', email: 'core@demo.levelup.id', phone: '0812-0000-0004', password: DEMO_PASSWORD },
  { key: 'baru', kind: 'google-new', label: 'Akun Google baru', note: 'Belum terdaftar · isi Daftar jadi Tamu', email: 'baru@demo.levelup.id', phone: '0812-0000-0005', password: DEMO_PASSWORD },
  { key: 'admin', kind: 'pengurus', label: 'Admin LK Medan', note: 'Sekretariat · approval volunteer & squad, buat event, scan, reimburse', email: 'admin@demo.levelup.id', phone: '0812-0000-0006', password: DEMO_PASSWORD },
]

export function normalizePhone(s: string): string {
  return s.replace(/\D/g, '')
}

// ── Seed ─────────────────────────────────────────────────────────────────────────────────────────

/** WIB calendar day (yyyy-mm-dd) `days` from today, same convention as @db.Date columns. */
export function wibDay(days = 0, now: Date = new Date()): string {
  const t = new Date(now.getTime() + WIB + days * DAY)
  return t.toISOString().slice(0, 10)
}

/** { date, jam } of the instant `minutesAgo` before `now`, as WIB wall clock. */
function wibWall(now: Date, minutesAgo: number): { date: string; jam: string } {
  const t = new Date(now.getTime() - minutesAgo * 60000 + WIB)
  return { date: t.toISOString().slice(0, 10), jam: t.toISOString().slice(11, 16) }
}

const ago = (now: Date, ms: number) => new Date(now.getTime() - ms).toISOString()

export type DemoKorwil = { id: number; nama: string; koordinator: string | null; kota: string | null; wa: string | null }

/**
 * Sample korwil list for the dana form + Surat Keuangan (the real app reads it from pphtgd-official). Fictional names.
 * wa is always null: the demo must never open wa.me to a real number.
 */
export const DEMO_KORWIL: DemoKorwil[] = [
  { id: 1, nama: 'Korwil Medan', koordinator: 'Pdt. Winsan Iksan, S.Th', kota: 'Medan', wa: null },
  { id: 2, nama: 'Korwil Binjai', koordinator: 'Pdt. Andreas Harahap', kota: 'Binjai', wa: null },
  { id: 3, nama: 'Korwil Pematangsiantar', koordinator: 'Pdt. Markus Purba', kota: 'Pematangsiantar', wa: null },
]

export const HOME_CABANG = '12'

export function buildSeed(now: Date = new Date()): DemoDb {
  let n = 1
  const id = () => n++

  const cabang: DbCabang[] = [
    { id_cabang: 9, namacabang: 'LevelUP Deli Serdang', leadercabang: 'Yohanes Sitepu' },
    { id_cabang: 12, namacabang: 'LevelUP Medan', leadercabang: 'Esra Londa' },
    { id_cabang: 14, namacabang: 'LevelUP Binjai', leadercabang: 'Daniel Ginting' },
    { id_cabang: 17, namacabang: 'LevelUP Pematangsiantar', leadercabang: 'Samuel Simanjuntak' },
    { id_cabang: 21, namacabang: 'LevelUP Tebing Tinggi', leadercabang: 'Martha Silalahi' },
  ]

  const mk = (p: Partial<DbPeserta> & Pick<DbPeserta, 'nama' | 'email' | 'userlevel'>): DbPeserta => {
    const pid = id()
    return {
      id_peserta: pid,
      usercode: `LUP-${1000 + pid}`,
      nowa: '',
      gereja: 'GBI Medan Plaza',
      pekerjaan: 'Mahasiswa',
      kotalevelup: HOME_CABANG,
      gender: 'L',
      tempatlahir: 'Medan',
      tgllahir: '2003-05-14',
      password: DEMO_PASSWORD,
      foto: '',
      pendidikan: 'S1',
      jurusan: '',
      provinsi: '12',
      kabupaten: '1275',
      kecamatan: '',
      desa: '',
      alamat: '',
      ...p,
    }
  }

  const tamu = mk({ nama: 'Tamara Sitompul', email: 'tamu@demo.levelup.id', nowa: '081200000001', userlevel: '0', gender: 'P', tgllahir: '2006-03-14' })
  const volunteer = mk({ nama: 'Vino Pardede', email: 'volunteer@demo.levelup.id', nowa: '081200000002', userlevel: '1', gereja: 'GBI Setiabudi', tgllahir: '2004-07-22' })
  const squad = mk({ nama: 'Sasa Hutagalung', email: 'squad@demo.levelup.id', nowa: '081200000003', userlevel: '2', gender: 'P', gereja: 'GBI Binjai', tempatlahir: 'Binjai', tgllahir: '2003-01-09' })
  const core = mk({ nama: 'Rio Simanjuntak', email: 'core@demo.levelup.id', nowa: '081200000004', userlevel: '3', tgllahir: '2000-11-02' })
  const kevin = mk({ nama: 'Kevin Nadapdap', email: 'kevin@demo.levelup.id', userlevel: '0', tgllahir: '2005-04-18' })
  const stefani = mk({ nama: 'Stefani Tampubolon', email: 'stefani@demo.levelup.id', userlevel: '0', gender: 'P', gereja: 'GBI Binjai', tgllahir: '2005-06-30' })
  const andre = mk({ nama: 'Andre Simatupang', email: 'andre@demo.levelup.id', userlevel: '1', gereja: 'GBI Setiabudi', tgllahir: '2004-10-05' })
  const nadia = mk({ nama: 'Nadia Panjaitan', email: 'nadia@demo.levelup.id', userlevel: '1', gender: 'P', tgllahir: '2003-02-14' })
  const jonathan = mk({ nama: 'Jonathan Marpaung', email: 'jonathan@demo.levelup.id', userlevel: '2', gereja: 'GBI Setiabudi', tgllahir: '2001-07-07' })
  const priska = mk({ nama: 'Priska Siregar', email: 'priska@demo.levelup.id', userlevel: '3', gender: 'P', tgllahir: '1999-03-22' })
  const peserta = [tamu, volunteer, squad, core, kevin, stefani, andre, nadia, jonathan, priska]

  const pengurus: DbPengurus[] = [
    { id_pengurus: 1, nama: 'Admin LK Medan', username: 'admin@demo.levelup.id', password: DEMO_PASSWORD, divisi: 'alk', kotalevelup: HOME_CABANG },
  ]

  const ev = (e: Partial<DbEvent> & Pick<DbEvent, 'nama_event' | 'tglevent' | 'tgleventselesai' | 'wwtype'>): DbEvent => {
    const eid = id()
    return {
      id_event: eid,
      jenisevent: 'Offline',
      id_cabang: HOME_CABANG,
      target: '0,1,2,3',
      targetpengurus: '',
      targetjumlah: 0,
      jamevent: '18:30',
      jamselesaievent: '20:30',
      alamatevent: 'Gedung Serba Guna, Jl. Setiabudi, Medan',
      longlatevent: '',
      radius: 0,
      danaevent: '1500000',
      suratpemberitahuan: '',
      khusus: '',
      posterevent: '',
      image_url: '/program/penyembahan.jpg',
      linkevent: '',
      approvenasional: '1',
      approvebrimnas: '1',
      notenasional: '',
      ...e,
    }
  }

  const online = wibWall(now, 60) // ended 60 min ago → self check-in window is open right now
  const bulanIni = ev({ nama_event: 'WW Bulanan Medan', wwtype: 'bulanan', tglevent: wibDay(0, now), tgleventselesai: wibDay(0, now), jamevent: '00:00', jamselesaievent: '23:00' })
  const wwOnline = ev({ nama_event: 'We Worship Online', wwtype: 'bulanan', jenisevent: 'Online', id_cabang: '0', tglevent: online.date, tgleventselesai: online.date, jamevent: '19:00', jamselesaievent: online.jam, alamatevent: '', danaevent: '0', image_url: '/program/pemuridan.jpg' })
  const jfe = ev({ nama_event: 'JFE Medan', wwtype: 'jfe', target: '1,2,3', targetjumlah: 3, tglevent: wibDay(7, now), tgleventselesai: wibDay(7, now), jamevent: '09:00', jamselesaievent: '17:00', alamatevent: 'Lapangan Benteng, Medan', danaevent: '5000000', image_url: '/about/hero-crowd.jpg' })
  const nasional = ev({ nama_event: 'Igniting Leaders', wwtype: 'nasional', id_cabang: '0', khusus: '1', target: '3,4,5', tglevent: wibDay(3, now), tgleventselesai: wibDay(4, now), jamevent: '08:00', jamselesaievent: '21:00', alamatevent: 'Balai Kartini, Jakarta', danaevent: '20000000', image_url: '/about/visi-crowd.jpg' })
  const lalu1 = ev({ nama_event: 'WW Bulanan Medan (Bulan Lalu)', wwtype: 'bulanan', tglevent: wibDay(-30, now), tgleventselesai: wibDay(-30, now), danaevent: '1200000' })
  const lalu2 = ev({ nama_event: 'WW Bulanan Medan (2 Bulan Lalu)', wwtype: 'bulanan', tglevent: wibDay(-60, now), tgleventselesai: wibDay(-60, now), danaevent: '1200000' })
  const event = [bulanIni, wwOnline, jfe, nasional, lalu1, lalu2]

  const event_sesi: DbSesi[] = [
    { id_sesi: id(), id_event: nasional.id_event, nama: 'Sesi Pagi', tanggal: wibDay(3, now), jam_mulai: '08:00', jam_selesai: '12:00', wajib: true, urutan: 0, id_lokasi: null },
    { id_sesi: id(), id_event: nasional.id_event, nama: 'Sesi Malam', tanggal: wibDay(4, now), jam_mulai: '18:00', jam_selesai: '21:00', wajib: true, urutan: 1, id_lokasi: null },
  ]

  const reg = (p: DbPeserta, e: DbEvent, status: DbRegistrasi['status']): DbRegistrasi => ({ id_registrasi: id(), id_peserta: p.id_peserta, id_event: e.id_event, status })
  const registrasi: DbRegistrasi[] = [
    reg(core, bulanIni, 'confirmed'),
    reg(squad, bulanIni, 'confirmed'),
    reg(jonathan, bulanIni, 'confirmed'),
    reg(volunteer, wwOnline, 'confirmed'),
    reg(squad, jfe, 'confirmed'),
    reg(core, jfe, 'confirmed'),
    reg(jonathan, jfe, 'confirmed'), // quota 3 reached → FULL
    reg(core, nasional, 'confirmed'),
    reg(core, lalu1, 'attend'),
    reg(squad, lalu1, 'absence'),
    reg(core, lalu2, 'attend'),
    reg(priska, lalu2, 'attend'),
  ]

  const ab = (p: DbPeserta, e: DbEvent, msAgo: number): DbAbsen => ({ id_absen: id(), id_peserta: p.id_peserta, id_event: e.id_event, id_sesi: null, email: p.email, timestamp: ago(now, msAgo) })
  const absen: DbAbsen[] = [ab(core, lalu1, 30 * DAY), ab(core, lalu2, 60 * DAY), ab(priska, lalu2, 60 * DAY)]

  const upgrade: DbUpgrade[] = [
    { id_upgrade: id(), id_peserta: kevin.id_peserta, member: '1', at: ago(now, 3 * DAY) },
    { id_upgrade: id(), id_peserta: stefani.id_peserta, member: '1', at: ago(now, DAY) },
    { id_upgrade: id(), id_peserta: andre.id_peserta, member: '2', at: ago(now, 2 * DAY) },
    { id_upgrade: id(), id_peserta: nadia.id_peserta, member: '2', at: ago(now, 5 * 60 * 60 * 1000) },
  ]

  const reimburse: DbReimburse[] = [
    {
      id_reimburse: id(), id_event: String(lalu1.id_event), ajukan: 'Ajukan', namabank: 'BCA', norek: '1234567890', namarek: 'ALK LevelUP Medan',
      danausul: '1200000', danariil: '1150000', laporan: 'https://drive.google.com/demo-lpj', bukti: 'https://drive.google.com/demo-dokumentasi',
      approvepphtgd: '1', notepphtgd: '', approvenasional: '1', notenasional: '', approvekeuangan: '1', notekeuangan: '', buktitf: '',
      korwil: DEMO_KORWIL[0], korwil_at: ago(now, 29 * DAY), pic_at: ago(now, 27 * DAY), cair_at: ago(now, 24 * DAY),
      at: ago(now, 24 * DAY),
      history: [
        { stage: 'Diajukan oleh ALK Kota', at: ago(now, 30 * DAY), by: 'Admin LK Medan' },
        { stage: 'Disetujui Korwil PPHTGD', at: ago(now, 29 * DAY), by: 'Korwil Medan' },
        { stage: 'Disetujui PIC LevelUP Pusat', at: ago(now, 27 * DAY), by: 'PIC LevelUP Pusat' },
        { stage: 'Dana ditransfer', at: ago(now, 24 * DAY), by: 'Keuangan PPHTGD' },
      ],
    },
    {
      id_reimburse: id(), id_event: String(lalu2.id_event), ajukan: 'Ajukan', namabank: 'BCA', norek: '1234567890', namarek: 'ALK LevelUP Medan',
      danausul: '1200000', danariil: '', laporan: '', bukti: 'https://drive.google.com/demo-dokumentasi-2',
      approvepphtgd: '', notepphtgd: '', approvenasional: '', notenasional: '', approvekeuangan: '', notekeuangan: '', buktitf: '',
      korwil: DEMO_KORWIL[0], korwil_at: null, pic_at: null, cair_at: null,
      at: ago(now, 3 * DAY),
      history: [{ stage: 'Diajukan oleh ALK Kota · menunggu Korwil', at: ago(now, 3 * DAY), by: 'Admin LK Medan' }],
    },
  ]

  return {
    v: VERSION,
    seededAt: now.toISOString(),
    cabang,
    peserta,
    pengurus,
    event,
    event_sesi,
    registrasi,
    absen,
    upgrade,
    reimburse,
    log: [{ id: id(), at: now.toISOString(), msg: 'Demo siap — data awal dimuat' }],
    nextId: n,
    session: { idPeserta: null, idPengurus: null, google: null },
  }
}

// ── Store (module singleton, localStorage-backed) ────────────────────────────────────────────────

let state: DemoDb | null = null
let storageFailed = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function read(): DemoDb | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoDb
    return parsed.v === VERSION && Array.isArray(parsed.event) ? parsed : null
  } catch {
    return null
  }
}

function persist(next: DemoDb) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    storageFailed = false
  } catch {
    // Private mode, blocked storage or quota: keep running from memory.
    storageFailed = true
  }
}

/** Current database (client only). Loads from localStorage, or seeds, on first call. */
export function getDb(): DemoDb {
  if (!state) {
    state = read() ?? buildSeed()
    persist(state)
  }
  return state
}

/** Same as getDb but safe on the server: returns null there, and is stable between mutations. */
export function snapshot(): DemoDb | null {
  return typeof window === 'undefined' ? null : getDb()
}

export function mutate(fn: (draft: DemoDb) => void): void {
  const current = getDb()
  const draft = structuredClone(current)
  fn(draft)
  if (JSON.stringify(draft) === JSON.stringify(current)) return
  state = draft
  persist(draft)
  emit()
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return
    state = read() ?? state
    cb()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

export function resetDb(): void {
  state = buildSeed()
  persist(state)
  emit()
}

export function isStorageFailing(): boolean {
  return storageFailed
}

export function addLog(d: DemoDb, msg: string): void {
  d.log = [{ id: d.nextId++, at: new Date().toISOString(), msg }, ...d.log].slice(0, 40)
}
