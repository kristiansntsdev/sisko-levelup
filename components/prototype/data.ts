// Dummy data for /prototype — static, not connected to the database

export type Gender = 'L' | 'P'
export type Level = 'Umum' | 'Volunteer' | 'Squad' | 'Core' | 'Leader' | 'Tim Nasional'

// Same option lists as components/kota/event-form.tsx
export const TARGET_OPTIONS: Level[] = ['Umum', 'Volunteer', 'Squad', 'Core', 'Leader', 'Tim Nasional']
export const TARGET_PENGURUS_OPTIONS = ['Admin LK', 'BRIM']
export const WWTYPE_LABEL = { bulanan: 'Bulanan', jfe: 'JFE', nasional: 'Nasional' } as const
export type WwType = keyof typeof WWTYPE_LABEL

// Prototype clock: Jumat 23 Okt 2026 19:25 WIB — Igniting Leader sesi 2 sedang berjalan
export const TODAY = '2026-10-23'
export const NOW_HM = '19:25'
export const NOW_STAMP = `${TODAY} ${NOW_HM}`
export const NOW = new Date(Date.UTC(2026, 9, 23, 12, 25))

// LevelUP Kota = tabel `cabang` (urut nama, seperti getCabangs). Event nasional memakai id_cabang '0'
// (NASIONAL_EVENT_CABANG) dan tampil di semua kota
export const NASIONAL_CABANG = '0'
export const CABANGS = [
  { id: '9', nama: 'Deli Serdang' },
  { id: '14', nama: 'Kota Binjai' },
  { id: '12', nama: 'Kota Medan' },
  { id: '17', nama: 'Kota Pematangsiantar' },
  { id: '21', nama: 'Kota Tebing Tinggi' },
]

export const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES']
export const MONTH_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
export const DAY = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const capW = (w: string) => w.charAt(0) + w.slice(1).toLowerCase()
export const rp = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

// ---------------- Akun peserta ----------------

export interface Account {
  id: string
  pid: number
  name: string
  first: string
  g: Gender
  gender: string
  level: Level
  no: string
  pob: string
  dob: string
  dobShort: string
  church: string
  sinode: string
  city: string
  kotalevelup: string   // cabang id
  since: string
  email: string
  phone: string
  education: string
  major: string
  job: string
  admin: boolean
}

// Akun Google peserta contoh. Satu HP hanya memegang 1 sesi peserta + 1 sesi pengurus
export const ACCOUNTS: Account[] = [
  {
    id: 'yohanes', pid: 1042, name: 'Pdt. Yohanes Saputra', first: 'Yohanes', g: 'L', gender: 'Laki-laki', level: 'Core',
    no: '01JD8K2M-4QXZ', pob: 'Medan', dob: '12 April 1978', dobShort: '12-04-1978',
    church: 'GBI Kasih Karunia', sinode: 'GBI', city: 'Kota Medan', kotalevelup: '12', since: '05-01-2024',
    email: 'yohanes.saputra@example.com', phone: '+62 812-3456-7890',
    education: 'S2', major: 'Teologi', job: 'Gembala', admin: true,
  },
  {
    id: 'maria', pid: 1043, name: 'Ev. Maria Hutagalung', first: 'Maria', g: 'P', gender: 'Perempuan', level: 'Core',
    no: '01JD8K3P-9HRA', pob: 'Pematangsiantar', dob: '3 Maret 1981', dobShort: '03-03-1981',
    church: 'GBI Kasih Karunia', sinode: 'GBI', city: 'Kota Medan', kotalevelup: '12', since: '05-01-2024',
    email: 'maria.hutagalung@example.com', phone: '+62 813-7788-2024',
    education: 'S1', major: 'Pendidikan Agama Kristen', job: 'Guru', admin: false,
  },
]

// Akun pengurus (tabel `pengurus`, login email + password). Terhubung ke peserta `yohanes` lewat auth_users,
// jadi foto & absensi pribadinya memakai data peserta itu
export const PENGURUS = { key: 'yohanes', name: 'Pdt. Yohanes Saputra', email: 'yohanes@levelup.id', g: 'L' as Gender }

// ---------------- Peserta (Events / absen) + pengurus kota (tab Anggota Sekretariat) ----------------

export type PengurusRole = 'Admin LK' | 'BRIM'

export interface Person { key: string; name: string; g: Gender; church: string; city: string; email: string; level: Level }

// Tab Anggota = tabel `pengurus` (bukan peserta). Tidak ada status aktif — cukup email + password login
export interface KMember {
  key: string
  name: string
  g: Gender
  church: string
  city: string
  email: string
  password: string
  role: PengurusRole
  me?: boolean
}

export const K_MEMBERS: KMember[] = [
  { key: 'yohanes', name: 'Pdt. Yohanes Saputra', g: 'L', church: 'GBI Kasih Karunia', city: 'Kota Medan', email: 'yohanes@levelup.id', password: 'levelup', role: 'Admin LK', me: true },
  { key: 'maria', name: 'Ev. Maria Hutagalung', g: 'P', church: 'GBI Kasih Karunia', city: 'Kota Medan', email: 'maria@levelup.id', password: 'levelup', role: 'Admin LK' },
  { key: 'samuel', name: 'Pdt. Samuel Siregar', g: 'L', church: 'GPdI Bukit Sion', city: 'Kota Medan', email: 'samuel@levelup.id', password: 'levelup', role: 'Admin LK' },
  { key: 'ruth', name: 'Pdm. Ruth Simanjuntak', g: 'P', church: 'GSJA Kristus Raja', city: 'Deli Serdang', email: 'ruth@levelup.id', password: 'levelup', role: 'BRIM' },
  { key: 'daniel', name: 'Pdt. Daniel Hutapea', g: 'L', church: 'GBI Rehobot', city: 'Binjai', email: 'daniel@levelup.id', password: 'levelup', role: 'Admin LK' },
  { key: 'yosua', name: 'Ev. Yosua Lubis', g: 'L', church: 'GPdI Filadelfia', city: 'Kota Medan', email: 'yosua@levelup.id', password: 'levelup', role: 'BRIM' },
]

export const GUESTS: Person[] = [
  { key: 'rina', name: 'Rina Sitompul', g: 'P', church: 'GBI Rehobot', city: 'Kota Binjai', email: 'rina.sitompul@gmail.com', level: 'Squad' },
  { key: 'jonathan', name: 'Jonathan Tarigan', g: 'L', church: 'GPdI Filadelfia', city: 'Kota Pematangsiantar', email: 'jonathan.tarigan@gmail.com', level: 'Core' },
  { key: 'grace', name: 'Grace Simbolon', g: 'P', church: 'GSJA Kristus Raja', city: 'Kota Tebing Tinggi', email: 'grace.simbolon@gmail.com', level: 'Core' },
  { key: 'kevin', name: 'Kevin Purba', g: 'L', church: 'GBI Kasih Karunia', city: 'Kota Binjai', email: 'kevin.purba@gmail.com', level: 'Volunteer' },
  { key: 'nadia', name: 'Nadia Sembiring', g: 'P', church: 'GBI Rehobot', city: 'Kota Pematangsiantar', email: 'nadia.sembiring@gmail.com', level: 'Squad' },
  { key: 'yoel', name: 'Yoel Ginting', g: 'L', church: 'GPdI Bukit Sion', city: 'Kota Tebing Tinggi', email: 'yoel.ginting@gmail.com', level: 'Core' },
  { key: 'priska', name: 'Priska Damanik', g: 'P', church: 'GPdI Filadelfia', city: 'Kota Binjai', email: 'priska.damanik@gmail.com', level: 'Leader' },
  { key: 'hana', name: 'Hana Sinaga', g: 'P', church: 'GSJA Kristus Raja', city: 'Kota Pematangsiantar', email: 'hana.sinaga@gmail.com', level: 'Squad' },
  { key: 'stefani', name: 'Stefani Purba', g: 'P', church: 'GBI Kasih Karunia', city: 'Kota Medan', email: 'stefani.purba@gmail.com', level: 'Volunteer' },
  { key: 'andre', name: 'Andre Lumbantobing', g: 'L', church: 'GPdI Bukit Sion', city: 'Kota Medan', email: 'andre.lumbantobing@gmail.com', level: 'Volunteer' },
]

// ---------------- Keanggotaan (alur sisko: daftar → Tamu → Volunteer → Squad) ----------------

// userlevel 0 Tamu · 1 Volunteer · 2 Squad · 3 Core · 4 PIC (Leader); approval baru sampai Squad (Core belum dibuka)
export const LEVEL_STEPS: [Level, string][] = [['Umum', 'Tamu'], ['Volunteer', 'Volunteer'], ['Squad', 'Squad'], ['Core', 'Core']]

// Tabel `upgrade`: pengajuan Squad, di-approve ALK kota yang dipilih (peserta.kotalevelup)
export interface Upgrade { id: number; key: string; cabang: string; usercode: string }

export const UPGRADES: Upgrade[] = [
  { id: 61, key: 'stefani', cabang: '12', usercode: 'LUP-1088' },
  { id: 63, key: 'andre', cabang: '12', usercode: 'LUP-1093' },
  { id: 64, key: 'kevin', cabang: '14', usercode: 'LUP-1071' },
]

// Akun Google yang belum pernah login — login pertama membuat peserta baru (auth.ts)
export const NEW_GOOGLE = { id: 'nathan', pid: 1101, name: 'Nathan Simatupang', email: 'nathan.simatupang@gmail.com', g: 'L' as Gender }

// ---------------- Event (dipakai sisi anggota dan Sekretariat) ----------------

export type EventStatus = 'draft' | 'review' | 'rejected' | 'approved' | 'live' | 'done'

export interface Sesi { id: number; nama: string; tanggal: string; mulai: string; selesai: string; wajib: boolean }

export interface PosterSpec { bg: string; lines: string[]; ink: string; accent: string; tag?: string; box?: string; strip?: string; img?: string; light?: boolean }

export interface Ev {
  id: string
  no: number            // id_event (QR payload `ev`)
  cabang: string        // id_cabang LevelUP Kota, '0' = nasional
  name: string
  category: string
  jenis: 'Offline' | 'Online'
  wwtype: WwType
  scope: '' | 'seluruh_kota' | 'khusus'
  target: Level[]
  targetPengurus: string[]
  quota: number         // targetjumlah
  booked: number        // registrasi di luar daftar peserta prototype
  tgl: string           // YYYY-MM-DD
  tglSelesai: string
  jam: string           // HH:mm WIB
  jamSelesai: string
  venue: string         // label lokasi singkat (filter chip)
  alamat: string
  latlng: string
  radius: number
  dana: number
  surat: string
  status: EventStatus
  reason?: string
  regOpen: string       // 'YYYY-MM-DD HH:mm' WIB
  regClose: string
  desc: string[]        // paragraf; **teks** = tebal
  note?: string
  speaker?: string
  theme?: string
  sesi: Sesi[]
  poster: PosterSpec
}

export const EVENTS: Ev[] = [
  {
    id: 'ignite', no: 412, cabang: '0', name: 'Igniting Leader', category: 'Leadership', jenis: 'Offline', wwtype: 'nasional', scope: 'seluruh_kota',
    target: ['Core', 'Leader'], targetPengurus: ['Admin LK'], quota: 40, booked: 9,
    tgl: '2026-10-23', tglSelesai: '2026-10-23', jam: '18:00', jamSelesai: '20:00',
    venue: 'GBI Kasih Karunia', alamat: 'GBI Kasih Karunia, Jl. Gatot Subroto No. 12, Medan', latlng: '3.5952,98.6722', radius: 300,
    dana: 3500000, surat: 'https://s.id/surat-igniting-leader', status: 'live',
    regOpen: '2026-10-10 09:00', regClose: '2026-10-23 17:00',
    desc: [
      '**Igniting Leader** adalah malam penyegaran bagi para leader LevelUP untuk kembali menyalakan api pelayanan di tengah generasi muda.',
      'Ada dua sesi wajib — Worship & Firman, lalu Breakout Leader. Prayer Room terbuka paralel bagi yang ingin didoakan.',
    ],
    note: 'Absensi dicatat per sesi. Tunjukkan QR tiket di setiap sesi.',
    speaker: 'Pdt. Yohanes Saputra · Medan', theme: 'Setia dalam Pelayanan',
    sesi: [
      { id: 1, nama: 'Worship & Firman', tanggal: '2026-10-23', mulai: '18:00', selesai: '19:00', wajib: true },
      { id: 2, nama: 'Breakout Leader', tanggal: '2026-10-23', mulai: '19:00', selesai: '20:00', wajib: true },
      { id: 3, nama: 'Prayer Room', tanggal: '2026-10-23', mulai: '19:00', selesai: '20:00', wajib: false },
    ],
    poster: { bg: 'linear-gradient(150deg,#160709 0%,#5a0f14 55%,#c9232c 100%)', lines: ['IGNITING', 'LEADER'], ink: '#ffffff', accent: '#e6cd7e', tag: 'Leadership Night', strip: 'Jumat, 23 Okt · 18.00' },
  },
  {
    id: 'doa', no: 415, cabang: '12', name: 'Doa Siang Online', category: 'Prayer', jenis: 'Online', wwtype: 'bulanan', scope: '',
    target: ['Umum'], targetPengurus: [], quota: 200, booked: 57,
    tgl: '2026-10-23', tglSelesai: '2026-10-23', jam: '12:00', jamSelesai: '12:45',
    venue: 'Online', alamat: 'Online melalui Zoom LevelUP (link ada di tiket)', latlng: '', radius: 0,
    dana: 250000, surat: '', status: 'done',
    regOpen: '2026-10-19 09:00', regClose: '2026-10-23 12:00',
    desc: ['**Doa Siang Online** — 45 menit berdoa bersama untuk kota, kampus, dan keluarga.'],
    sesi: [],
    poster: { bg: 'linear-gradient(160deg,#3b1417 0%,#7c1219 100%)', lines: ['DOA', 'SIANG'], ink: '#e6cd7e', accent: '#f1dc9a', tag: 'Online', strip: 'Jumat, 23 Okt · 12.00' },
  },
  {
    id: 'raya', no: 418, cabang: '12', name: 'Ibadah Raya Kota Medan', category: 'We Worship', jenis: 'Offline', wwtype: 'bulanan', scope: '',
    target: ['Umum'], targetPengurus: [], quota: 150, booked: 96,
    tgl: '2026-10-25', tglSelesai: '2026-10-25', jam: '09:00', jamSelesai: '11:00',
    venue: 'GPdI Bukit Sion', alamat: 'GPdI Bukit Sion, Jl. Sisingamangaraja No. 88, Medan', latlng: '3.5701,98.6914', radius: 500,
    dana: 1500000, surat: 'https://s.id/surat-ww-okt', status: 'approved',
    regOpen: '2026-10-15 09:00', regClose: '2026-10-25 08:00',
    desc: [
      '**Ibadah Raya** bulanan anggota LevelUP Kota Medan. Datang bersama teman kelompok selmu!',
      'Pintu dibuka 30 menit sebelum ibadah. Siapkan QR tiket untuk absen di pintu masuk.',
    ],
    note: 'Satu tiket untuk satu akun — ajak temanmu ambil tiket dari akunnya sendiri.',
    speaker: 'Pdt. Samuel Siregar · Medan', theme: 'Generasi yang Diutus',
    sesi: [],
    poster: { bg: 'linear-gradient(160deg,#b3202a 0%,#d73640 100%)', lines: ['IBADAH', 'RAYA'], ink: '#ffffff', accent: '#f1dc9a', tag: 'We Worship', strip: 'Minggu, 25 Okt · 09.00' },
  },
  {
    id: 'wpclass', no: 409, cabang: '12', name: 'Winner Principle Class - Batch 4', category: 'Pemuridan', jenis: 'Offline', wwtype: 'bulanan', scope: '',
    target: ['Squad', 'Core'], targetPengurus: [], quota: 30, booked: 27,
    tgl: '2026-11-01', tglSelesai: '2026-11-22', jam: '19:00', jamSelesai: '21:00',
    venue: 'GSJA Kristus Raja', alamat: 'GSJA Kristus Raja, Jl. Setia Budi No. 7, Medan', latlng: '3.5603,98.6295', radius: 300,
    dana: 1200000, surat: '', status: 'approved',
    regOpen: '2026-10-01 09:00', regClose: '2026-10-31 23:59',
    desc: ['Kelas pemuridan **Winner Principle** 4 pertemuan setiap Minggu malam. Kehadiran lengkap dibutuhkan untuk sertifikat.'],
    speaker: 'Ps. Andreas Lim · Jakarta', theme: 'Winning Habits',
    sesi: [
      { id: 11, nama: 'Pertemuan 1', tanggal: '2026-11-01', mulai: '19:00', selesai: '21:00', wajib: true },
      { id: 12, nama: 'Pertemuan 2', tanggal: '2026-11-08', mulai: '19:00', selesai: '21:00', wajib: true },
      { id: 13, nama: 'Pertemuan 3', tanggal: '2026-11-15', mulai: '19:00', selesai: '21:00', wajib: true },
      { id: 14, nama: 'Pertemuan 4', tanggal: '2026-11-22', mulai: '19:00', selesai: '21:00', wajib: true },
    ],
    poster: { bg: 'linear-gradient(160deg,#2a1416 0%,#4a1015 60%,#7c1219 100%)', lines: ['WINNER', 'PRINCIPLE'], ink: '#e6cd7e', accent: '#f1dc9a', tag: 'Batch 4', strip: '1 – 22 Nov · Minggu malam' },
  },
  {
    id: 'jfe', no: 421, cabang: '12', name: 'WW - Jesus For Everyone', category: 'WW JFE', jenis: 'Offline', wwtype: 'jfe', scope: '',
    target: ['Umum'], targetPengurus: [], quota: 500, booked: 212,
    tgl: '2026-11-08', tglSelesai: '2026-11-08', jam: '16:00', jamSelesai: '19:00',
    venue: 'Lapangan Merdeka', alamat: 'Lapangan Merdeka, Jl. Balai Kota, Medan', latlng: '3.5911,98.6776', radius: 500,
    dana: 6000000, surat: 'https://s.id/surat-jfe-nov', status: 'approved',
    regOpen: '2026-10-20 09:00', regClose: '2026-11-08 12:00',
    desc: ['**WW - Jesus For Everyone** serentak di kota-kota LevelUP. Ajak teman yang belum pernah datang ke ibadah!'],
    speaker: 'Tim Nasional LevelUP', theme: 'Jesus For Everyone',
    sesi: [],
    poster: { bg: 'linear-gradient(160deg,#e0c574 0%,#c3a54d 55%,#a98b35 100%)', lines: ['JESUS FOR', 'EVERYONE'], ink: '#5a0f14', accent: '#ffffff', tag: 'We Worship', strip: 'Minggu, 8 Nov · 16.00', light: true },
  },
  {
    id: 'align', no: 430, cabang: '0', name: 'Align Leader', category: 'Align', jenis: 'Online', wwtype: 'nasional', scope: 'khusus',
    target: ['Leader', 'Tim Nasional'], targetPengurus: [], quota: 300, booked: 141,
    tgl: '2026-11-11', tglSelesai: '2026-11-11', jam: '12:00', jamSelesai: '13:00',
    venue: 'Online', alamat: 'Online melalui sisko.levelupgen.com >> Events', latlng: '', radius: 0,
    dana: 0, surat: '', status: 'approved',
    regOpen: '2026-10-23 09:00', regClose: '2026-11-11 12:00',
    desc: [
      '**Align Leader** merupakan sesi penyelarasan bagi seluruh Leader LevelUP untuk memastikan setiap pemimpin bergerak *One Page and One Pace* dalam pergerakan pemuridan.',
      'Dalam sesi ini akan disampaikan arahan, pembaruan, serta penegasan fokus yang perlu dipahami bersama.',
    ],
    note: 'Setiap leader mendaftar dari akunnya masing-masing.',
    sesi: [],
    poster: { bg: 'linear-gradient(180deg,#f8f5ee 0%,#efe6d4 100%)', lines: ['ALIGN'], ink: '#ffffff', accent: '#e6cd7e', tag: 'Online', box: '#3b1417', strip: 'Rabu, 11 Nov · 12.00', light: true },
  },
  {
    id: 'raya-bnj', no: 424, cabang: '14', name: 'Ibadah Raya Kota Binjai', category: 'We Worship', jenis: 'Offline', wwtype: 'bulanan', scope: '',
    target: ['Umum'], targetPengurus: [], quota: 120, booked: 64,
    tgl: '2026-10-31', tglSelesai: '2026-10-31', jam: '18:30', jamSelesai: '20:30',
    venue: 'GBI Rehobot Binjai', alamat: 'GBI Rehobot, Jl. Soekarno-Hatta No. 45, Binjai', latlng: '3.6001,98.4854', radius: 400,
    dana: 1200000, surat: 'https://s.id/surat-ww-binjai', status: 'approved',
    regOpen: '2026-10-20 09:00', regClose: '2026-10-31 17:00',
    desc: ['**Ibadah Raya** bulanan LevelUP Kota Binjai. Terbuka untuk anggota dari kota mana pun.'],
    speaker: 'Pdt. Daniel Hutapea · Binjai', theme: 'Bangkit dan Bersinar',
    sesi: [],
    poster: { bg: 'linear-gradient(160deg,#7c1219 0%,#c9232c 100%)', lines: ['IBADAH', 'RAYA'], ink: '#ffffff', accent: '#e6cd7e', tag: 'Binjai', strip: 'Sabtu, 31 Okt · 18.30' },
  },
  {
    id: 'kampus-tt', no: 426, cabang: '21', name: 'Kebaktian Kampus Tebing Tinggi', category: 'Kampus', jenis: 'Offline', wwtype: 'bulanan', scope: '',
    target: ['Umum'], targetPengurus: [], quota: 60, booked: 18,
    tgl: '2026-10-29', tglSelesai: '2026-10-29', jam: '17:00', jamSelesai: '19:00',
    venue: 'Gedung Serbaguna Tebing Tinggi', alamat: 'Gedung Serbaguna, Jl. Sudirman No. 3, Tebing Tinggi', latlng: '3.3285,99.1625', radius: 300,
    dana: 600000, surat: '', status: 'approved',
    regOpen: '2026-10-15 09:00', regClose: '2026-10-29 15:00',
    desc: ['Kebaktian mahasiswa LevelUP Kota Tebing Tinggi — ajak teman satu kampusmu.'],
    sesi: [],
    poster: { bg: 'linear-gradient(160deg,#3b1417 0%,#7c1219 100%)', lines: ['KAMPUS', 'NIGHT'], ink: '#e6cd7e', accent: '#f1dc9a', tag: 'Tebing Tinggi', strip: 'Kamis, 29 Okt · 17.00' },
  },
  {
    id: 'ww-pms', no: 427, cabang: '17', name: 'WW Bulanan Pematangsiantar', category: 'We Worship', jenis: 'Offline', wwtype: 'bulanan', scope: '',
    target: ['Umum'], targetPengurus: [], quota: 100, booked: 43,
    tgl: '2026-11-01', tglSelesai: '2026-11-01', jam: '16:00', jamSelesai: '18:00',
    venue: 'GPdI Filadelfia Siantar', alamat: 'GPdI Filadelfia, Jl. Merdeka No. 120, Pematangsiantar', latlng: '2.9595,99.0687', radius: 400,
    dana: 1000000, surat: 'https://s.id/surat-ww-siantar', status: 'approved',
    regOpen: '2026-10-18 09:00', regClose: '2026-11-01 12:00',
    desc: ['We Worship bulanan LevelUP Kota Pematangsiantar.'],
    sesi: [],
    poster: { bg: 'linear-gradient(160deg,#e0c574 0%,#c3a54d 55%,#a98b35 100%)', lines: ['WE', 'WORSHIP'], ink: '#5a0f14', accent: '#ffffff', tag: 'Siantar', strip: 'Minggu, 1 Nov · 16.00', light: true },
  },
  {
    id: 'rakor', no: 433, cabang: '12', name: 'Rakor Pengurus Kota', category: 'Rapat', jenis: 'Offline', wwtype: 'bulanan', scope: '',
    target: [], targetPengurus: ['Admin LK', 'BRIM'], quota: 20, booked: 0,
    tgl: '2026-11-02', tglSelesai: '2026-11-02', jam: '10:00', jamSelesai: '12:00',
    venue: 'Sekretariat Kota Medan', alamat: 'Sekretariat LevelUP Kota Medan, Jl. Iskandar Muda No. 21', latlng: '3.5847,98.6575', radius: 200,
    dana: 300000, surat: 'https://s.id/surat-rakor-nov', status: 'review',
    regOpen: '2026-10-23 09:00', regClose: '2026-11-02 09:00',
    desc: ['Rapat koordinasi program kerja kuartal akhir.'],
    sesi: [],
    poster: { bg: 'linear-gradient(160deg,#3b1417 0%,#5a0f14 100%)', lines: ['RAKOR', 'PENGURUS'], ink: '#ffffff', accent: '#e6cd7e', strip: 'Senin, 2 Nov · 10.00' },
  },
  {
    id: 'retreat', no: 435, cabang: '12', name: 'Retreat Hamba Tuhan', category: 'Retreat', jenis: 'Offline', wwtype: 'bulanan', scope: '',
    target: ['Core', 'Leader'], targetPengurus: [], quota: 60, booked: 0,
    tgl: '2026-11-14', tglSelesai: '2026-11-14', jam: '08:00', jamSelesai: '16:00',
    venue: 'Wisma Doa Berastagi', alamat: 'Wisma Doa Berastagi, Jl. Jamin Ginting, Berastagi', latlng: '3.1919,98.5093', radius: 500,
    dana: 4500000, surat: 'https://s.id/surat-retreat', status: 'rejected',
    reason: 'Jadwal bentrok dengan Retreat Nasional. Mohon geser ke minggu berikutnya.',
    regOpen: '2026-10-25 09:00', regClose: '2026-11-13 18:00',
    desc: ['Retreat satu hari untuk pengurus dan hamba Tuhan.'],
    sesi: [],
    poster: { bg: 'linear-gradient(160deg,#7c1219 0%,#a51c24 100%)', lines: ['RETREAT'], ink: '#ffffff', accent: '#e6cd7e', strip: 'Sabtu, 14 Nov' },
  },
  {
    id: 'rayasep', no: 380, cabang: '12', name: 'Ibadah Raya Kota Medan', category: 'We Worship', jenis: 'Offline', wwtype: 'bulanan', scope: '',
    target: ['Umum'], targetPengurus: [], quota: 150, booked: 112,
    tgl: '2026-09-27', tglSelesai: '2026-09-27', jam: '09:00', jamSelesai: '11:00',
    venue: 'GPdI Bukit Sion', alamat: 'GPdI Bukit Sion, Jl. Sisingamangaraja No. 88, Medan', latlng: '3.5701,98.6914', radius: 500,
    dana: 1500000, surat: 'https://s.id/surat-ww-sep', status: 'done',
    regOpen: '2026-09-17 09:00', regClose: '2026-09-27 08:00',
    desc: ['Ibadah raya bulanan anggota LevelUP Kota Medan.'],
    sesi: [],
    poster: { bg: 'linear-gradient(160deg,#b3202a 0%,#d73640 100%)', lines: ['IBADAH', 'RAYA'], ink: '#ffffff', accent: '#f1dc9a', tag: 'We Worship', strip: 'Minggu, 27 Sep · 09.00' },
  },
  {
    id: 'seminar', no: 371, cabang: '12', name: 'Seminar Winner Principle', category: 'Seminar', jenis: 'Offline', wwtype: 'bulanan', scope: '',
    target: ['Umum'], targetPengurus: [], quota: 80, booked: 24,
    tgl: '2026-09-21', tglSelesai: '2026-09-21', jam: '09:00', jamSelesai: '13:00',
    venue: 'GSJA Kristus Raja', alamat: 'GSJA Kristus Raja, Jl. Setia Budi No. 7, Medan', latlng: '3.5603,98.6295', radius: 300,
    dana: 2450000, surat: 'https://s.id/surat-seminar-wp', status: 'done',
    regOpen: '2026-09-05 09:00', regClose: '2026-09-21 08:00',
    desc: ['Seminar kepemimpinan Winner Principle untuk leader muda.'],
    speaker: 'Ps. Andreas Lim · Jakarta', theme: 'Winning Habits',
    sesi: [],
    poster: { bg: 'linear-gradient(160deg,#5a0f14 0%,#b3202a 100%)', lines: ['SEMINAR', 'WINNER P.'], ink: '#e6cd7e', accent: '#f1dc9a', strip: 'Senin, 21 Sep · 09.00' },
  },
]

// Registrasi (tiket) peserta yang ada di daftar prototype
export interface Reg { eventId: string; key: string }

const reg = (eventId: string, keys: string[]): Reg[] => keys.map((key) => ({ eventId, key }))

export const REGS: Reg[] = [
  ...reg('ignite', ['yohanes', 'maria', 'samuel', 'ruth', 'daniel', 'yosua', 'rina', 'jonathan', 'grace', 'nadia', 'yoel', 'priska', 'kevin', 'hana']),
  ...reg('doa', ['yohanes', 'ruth']),
  ...reg('raya', ['yohanes', 'samuel', 'daniel', 'rina']),
  ...reg('wpclass', ['maria', 'ruth', 'nadia']),
  ...reg('jfe', ['samuel', 'yosua']),
  ...reg('rayasep', ['yohanes', 'maria', 'samuel', 'ruth']),
  ...reg('seminar', ['yohanes', 'samuel', 'ruth', 'daniel', 'yosua', 'rina', 'jonathan', 'grace', 'kevin', 'hana']),
]

// Absen per event / sesi (sesiId null = event tanpa sesi)
export interface Absen { eventId: string; key: string; sesiId: number | null; date: string; time: string }

const absen = (eventId: string, sesiId: number | null, date: string, rows: [string, string][]): Absen[] =>
  rows.map(([key, time]) => ({ eventId, key, sesiId, date, time }))

export const ABSEN: Absen[] = [
  ...absen('ignite', 1, '2026-10-23', [
    ['rina', '18:02'], ['yohanes', '18:05'], ['jonathan', '18:06'], ['grace', '18:09'], ['maria', '18:12'], ['nadia', '18:15'],
    ['yoel', '18:18'], ['samuel', '18:20'], ['ruth', '18:24'], ['priska', '18:27'], ['daniel', '18:31'], ['yosua', '18:35'],
  ]),
  ...absen('ignite', 2, '2026-10-23', [['yohanes', '19:04'], ['samuel', '19:06'], ['yosua', '19:08'], ['rina', '19:10'], ['grace', '19:15']]),
  ...absen('ignite', 3, '2026-10-23', [['maria', '19:05'], ['ruth', '19:07']]),
  ...absen('doa', null, '2026-10-23', [['ruth', '12:40']]),
  ...absen('rayasep', null, '2026-09-27', [['maria', '09:12'], ['samuel', '08:51'], ['ruth', '09:03']]),
  ...absen('seminar', null, '2026-09-21', [
    ['yohanes', '08:55'], ['samuel', '08:58'], ['ruth', '09:02'], ['daniel', '09:10'], ['yosua', '09:20'],
    ['rina', '08:49'], ['jonathan', '09:05'], ['grace', '09:07'],
  ]),
]

// ---------------- PWA Anggota (lainnya) ----------------

export type Attend = 'Hadir' | 'Terlambat' | 'Tidak hadir'

export const HISTORY: { d: string; m: string; title: string; note: string; status: Attend }[] = [
  { d: '19', m: 'OKT', title: 'Ibadah Raya Kota Medan', note: 'Check-in 09:12', status: 'Hadir' },
  { d: '12', m: 'OKT', title: 'Doa Bersama Hamba Tuhan', note: 'Check-in 18:47', status: 'Terlambat' },
  { d: '05', m: 'OKT', title: 'Rakor Pengurus Kota', note: 'Check-in 10:02', status: 'Hadir' },
  { d: '27', m: 'SEP', title: 'Ibadah Raya Kota Medan', note: 'Tidak ada check-in', status: 'Tidak hadir' },
  { d: '21', m: 'SEP', title: 'Seminar Winner Principle', note: 'Check-in 08:55', status: 'Hadir' },
]

export interface Testimony { title: string; meta: string; status: 'Dibaca' | 'Terkirim'; text: string }

export const TESTIMONIES: Testimony[] = [
  { title: 'We Worship', meta: '#TK-0042 · 14 Okt 2026', status: 'Dibaca', text: 'Lewat pujian malam itu saya dipulihkan dari rasa kecewa dalam pelayanan.' },
  { title: 'WW-Jesus For Everyone', meta: '#TK-0057 · 21 Okt 2026', status: 'Terkirim', text: 'Tiga teman kampus yang saya ajak akhirnya ikut kelompok sel.' },
  { title: 'Pemuridan WP Class', meta: '#TK-0061 · 21 Okt 2026', status: 'Terkirim', text: 'Materi Winner Principle menolong saya menyusun prioritas pelayanan.' },
]

export const TESTIMONY_EVENTS = ['We Worship', 'WW-Jesus For Everyone', 'Pemuridan WP Class', 'Igniting Leader', 'Ibadah Raya Kota Medan']

export const NOTIFS = [
  { t: 'Igniting Leader malam ini', s: 'Sesi 2 Breakout Leader dimulai 19:00 WIB', when: 'Hari ini' },
  { t: 'Pendaftaran WW - Jesus For Everyone', s: 'Ambil tiket dari menu Event sebelum 8 Nov', when: '2 hari lalu' },
  { t: 'Materi Pemuridan baru', s: 'Kelas Winner Principle sesi 4 sudah tersedia', when: '5 hari lalu' },
]

export const DAILY_WORDS = {
  date: 'Jumat, 23 Oktober 2026',
  verse: 'Janganlah katakan: Aku ini masih muda, tetapi kepada siapapun engkau Kuutus, haruslah engkau pergi.',
  ref: 'Yeremia 1:7',
  note: 'Usia muda bukan alasan untuk diam. Hari ini, ambil satu langkah taat di tempat Tuhan menempatkanmu.',
}

// ---------------- Sekretariat (lainnya) ----------------

// members/core = ringkasan peserta kota (bukan count tab Anggota = pengurus)
export const KOTA = { name: 'LevelUP Kota Medan', short: 'Kota Medan', cabang: '12', churches: 5, sinodes: 3, volunteers: 4, members: 28, core: 12 }

export type ReimbStatus = 'belum' | 'diajukan' | 'direview' | 'cair'

export interface Reimburse { id: string; eventId: string; amount?: number; status: ReimbStatus; note: string }

export const K_REIMBURSE: Reimburse[] = [
  { id: 'rb-4', eventId: 'ignite', status: 'belum', note: 'Belum diajukan' },
  { id: 'rb-3', eventId: 'doa', amount: 250000, status: 'diajukan', note: 'Diajukan 23 Okt' },
  { id: 'rb-2', eventId: 'rayasep', amount: 1500000, status: 'direview', note: 'Direview sejak 2 Okt' },
  { id: 'rb-1', eventId: 'seminar', amount: 2450000, status: 'cair', note: 'Cair 30 Sep' },
]

export interface KTicket { id: number; subject: string; meta: string; status: 'Dibalas' | 'Menunggu' | 'Selesai'; last: string; unread?: boolean }

export const K_TICKETS: KTicket[] = [
  { id: 118, subject: 'Barcode anggota tidak terkirim', meta: '#118 · 20 Okt 2026', status: 'Dibalas', last: 'Pusat: Sudah kami kirim ulang, mohon dicek kembali.', unread: true },
  { id: 104, subject: 'Salah input gereja anggota', meta: '#104 · 2 Okt 2026', status: 'Selesai', last: 'Data sudah diperbarui oleh pusat.' },
]

export const REG_LINK = 'https://sisko.levelupgen.com/daftar'
