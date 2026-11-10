'use client'
// Client-only "database" for /demo-preview. Tables mirror the real Prisma rows (same column names)
// so the shim actions can return exactly what lib/actions/* return and the real UI renders unchanged.
// State lives in memory + localStorage only. Never import lib/actions/*, next-auth, @/lib/db or prisma here.

export const STORAGE_KEY = 'levelup-demo-preview:v9'
const VERSION = 3
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
  /** Review Sekretariat Nasional (step 1, bersama BRIM): '' menunggu, '1' setuju, '0' tolak */
  approvesekre: string
  notesekre: string
  /** Review BRIM Nasional (step 1, bersama Sekretariat) */
  approvebrim: string
  notebrim: string
  /** Korwil PPHTGD (step 2): '' menunggu, '1' setuju, '0' tolak */
  approvepphtgd: string
  notepphtgd: string
  /** PIC LevelUP Pusat (step 3) */
  approvenasional: string
  notenasional: string
  /** Keuangan PPHTGD (step 4) = cair */
  approvekeuangan: string
  notekeuangan: string
  buktitf: string
  /** Snapshot korwil yang dipilih saat submit (reimburse_approval di app asli) */
  korwil: DemoKorwil | null
  sekre_at: string | null
  brim_at: string | null
  korwil_at: string | null
  pic_at: string | null
  cair_at: string | null
  at: string // last time the request changed hands
  history: DbReimburseHistory[]
}

/** kas_kota_txn; saldo is derived from these rows in the demo (the real app keeps it in kas_kota). */
export type DbKasTxn = {
  id_txn: number
  id_cabang: number
  /** yyyy-mm-dd, WIB calendar day */
  tanggal: string
  keterangan: string
  jumlah: number
  tipe: 'masuk' | 'keluar'
  kategori: 'harian' | 'event'
  id_event: number | null
}

/** Laporan WW (Air Hidup). `tanggal` = hari WIB WW dilaksanakan; `alir_ke` = id_cabang yang dialirkan. */
export type DbWwLaporan = {
  id_laporan: number
  id_cabang: number
  oleh: string
  tanggal: string
  jumlah: number
  isi: string
  foto: string
  alir_ke: number | null
  /** Amin dari anggota lain yang tidak ada di demo (angka awal seed) */
  amin_awal: number
  created_at: string
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
  kas_kota_txn: DbKasTxn[]
  ww_laporan: DbWwLaporan[]
  ww_amin: { id_laporan: number; id_peserta: number }[]
  /** Demo-only: lompatan hari untuk melihat air turun (hanya dipakai Air Hidup) */
  air_hari: number
  /** `${id_peserta}:${stage}` pop-up "Airmu mau kering" yang sudah ditutup */
  air_popup: string[]
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
  { key: 'pic', kind: 'peserta', label: 'PIC', note: 'Level 4 · dashboard PIC + lapor WW (Air Hidup)', email: 'pic@demo.levelup.id', phone: '0812-0000-0007', password: DEMO_PASSWORD },
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
  { id: 1, nama: 'Korwil Ngawi 2', koordinator: 'Pdt. Priyo Sejahtera', kota: 'Ngawi 2', wa: null },
  { id: 2, nama: 'Korwil Ngawi', koordinator: 'Pdt. Andreas Harahap', kota: 'Ngawi', wa: null },
  { id: 3, nama: 'Korwil Ngawi 3', koordinator: 'Pdt. Markus Purba', kota: 'Ngawi 3', wa: null },
]

export const HOME_CABANG = '12'

export function buildSeed(now: Date = new Date()): DemoDb {
  let n = 1
  const id = () => n++

  const cabang: DbCabang[] = [
    { id_cabang: 9, namacabang: 'LevelUP Ngawi cabang Malang Kota', leadercabang: 'Yohanes Sitepu' },
    { id_cabang: 12, namacabang: 'LevelUP Ngawi cabang Surabaya', leadercabang: 'Esra Londa' },
    { id_cabang: 14, namacabang: 'LevelUP Ngawi', leadercabang: 'Daniel Ginting' },
    { id_cabang: 17, namacabang: 'LevelUP Ngawi cabang Solo', leadercabang: 'Samuel Simanjuntak' },
    { id_cabang: 21, namacabang: 'LevelUP Ngawi cabang Malkot', leadercabang: 'Martha Silalahi' },
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
  const pic = mk({ nama: 'Esra Londa', email: 'pic@demo.levelup.id', nowa: '081200000007', userlevel: '4', gereja: 'GBI Medan Plaza', tgllahir: '1997-09-12' })
  const peserta = [tamu, volunteer, squad, core, kevin, stefani, andre, nadia, jonathan, priska, pic]

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
      approvesekre: '1', notesekre: '', approvebrim: '1', notebrim: '',
      approvepphtgd: '1', notepphtgd: '', approvenasional: '1', notenasional: '', approvekeuangan: '1', notekeuangan: '', buktitf: '',
      korwil: DEMO_KORWIL[0], sekre_at: ago(now, 30 * DAY - 6 * 3600000), brim_at: ago(now, 30 * DAY - 4 * 3600000),
      korwil_at: ago(now, 29 * DAY), pic_at: ago(now, 27 * DAY), cair_at: ago(now, 24 * DAY),
      at: ago(now, 24 * DAY),
      history: [
        { stage: 'Diajukan oleh ALK Kota', at: ago(now, 30 * DAY), by: 'Admin LK Medan' },
        { stage: 'Disetujui Sekretariat Nasional', at: ago(now, 30 * DAY - 6 * 3600000), by: 'Sekretariat Nasional' },
        { stage: 'Disetujui BRIM Nasional', at: ago(now, 30 * DAY - 4 * 3600000), by: 'BRIM Nasional' },
        { stage: 'Disetujui Korwil PPHTGD', at: ago(now, 29 * DAY), by: 'Korwil Medan' },
        { stage: 'Disetujui PIC LevelUP Pusat', at: ago(now, 27 * DAY), by: 'PIC LevelUP Pusat' },
        { stage: 'Dana ditransfer', at: ago(now, 24 * DAY), by: 'Keuangan PPHTGD' },
      ],
    },
    {
      id_reimburse: id(), id_event: String(lalu2.id_event), ajukan: 'Ajukan', namabank: 'BCA', norek: '1234567890', namarek: 'ALK LevelUP Medan',
      danausul: '1200000', danariil: '', laporan: '', bukti: 'https://drive.google.com/demo-dokumentasi-2',
      approvesekre: '1', notesekre: '', approvebrim: '', notebrim: '',
      approvepphtgd: '', notepphtgd: '', approvenasional: '', notenasional: '', approvekeuangan: '', notekeuangan: '', buktitf: '',
      korwil: DEMO_KORWIL[0], sekre_at: ago(now, 2 * DAY), brim_at: null, korwil_at: null, pic_at: null, cair_at: null,
      at: ago(now, 2 * DAY),
      history: [
        { stage: 'Diajukan oleh ALK Kota · menunggu review Sekretariat & BRIM Nasional', at: ago(now, 3 * DAY), by: 'Admin LK Medan' },
        { stage: 'Disetujui Sekretariat Nasional', at: ago(now, 2 * DAY), by: 'Sekretariat Nasional' },
      ],
    },
  ]

  const kas = (days: number, tipe: DbKasTxn['tipe'], e: DbEvent | null, keterangan: string, jumlah: number): DbKasTxn => ({
    id_txn: id(), id_cabang: Number(HOME_CABANG), tanggal: wibDay(days, now), tipe, jumlah,
    kategori: e ? 'event' : 'harian', id_event: e?.id_event ?? null,
    keterangan: e ? `${e.nama_event} - ${keterangan}` : keterangan,
  })
  // Sums to Rp 4.250.000, the saldo the Beranda tile showed before Kas existed in the demo.
  const kas_kota_txn: DbKasTxn[] = [
    kas(-75, 'masuk', null, 'Saldo awal kas', 3000000),
    kas(-60, 'keluar', lalu2, 'Cetak flyer', 350000),
    kas(-31, 'keluar', lalu1, 'Sewa sound system', 650000),
    kas(-30, 'masuk', lalu1, 'Persembahan', 1500000),
    kas(-24, 'masuk', lalu1, 'Dana support PPHTGD', 1000000),
    kas(-10, 'keluar', null, 'Konsumsi rapat pengurus', 250000),
  ]

  // Air Hidup: setiap tahap terlihat. Medan Haus (pop-up muncul saat PIC/Core masuk), Binjai Melimpah (mengalirkan ke Medan),
  // Deli Serdang Segar, Pematangsiantar Kering, Tebing Tinggi belum pernah.
  const ww = (cabangId: number, oleh: string, days: number, jumlah: number, isi: string, foto: string, alir: number | null = null, amin = 0): DbWwLaporan => ({
    id_laporan: id(), id_cabang: cabangId, oleh, tanggal: wibDay(-days, now), jumlah, isi, foto, alir_ke: alir, amin_awal: amin, created_at: ago(now, days * DAY),
  })
  const ww_laporan: DbWwLaporan[] = [
    ww(14, 'Daniel Ginting', 2, 22, 'Kami datang capek habis pelayanan, pulang dengan hati yang penuh lagi. Tuhan hadir sangat nyata.', '/about/hero-worship.jpg', 12, 9),
    ww(9, 'Yohanes Sitepu', 12, 9, 'Sedikit yang datang, tapi doa kami dipecahkan. Ada yang menangis dipulihkan.', '/program/penyembahan.jpg', null, 5),
    ww(12, 'Esra Londa', 31, 14, 'Lagu terakhir kami nyanyi tanpa musik, dan Tuhan memenuhi ruangan.', '/about/misi-worship.jpg', null, 6),
    ww(14, 'Daniel Ginting', 33, 18, 'Kami belajar bahwa sebelum melayani, kami perlu diisi dulu.', '/about/visi-pray.jpg', null, 3),
    ww(17, 'Samuel Simanjuntak', 44, 11, 'Malam yang sederhana di rumah salah satu anggota, tapi penuh hadirat.', '/program/kota.jpg', null, 2),
    ww(12, 'Esra Londa', 62, 16, 'WW bulan lalu: kami diingatkan bahwa Dia sumber air hidup.', '/about/hero-crowd.jpg', null, 4),
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
    kas_kota_txn,
    ww_laporan,
    ww_amin: [],
    air_hari: 0,
    air_popup: [],
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
