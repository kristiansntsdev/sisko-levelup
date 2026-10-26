// Screen ids for /prototype — plain module (no 'use client') so the server page can validate ?s=
export const SCREEN_LIST = [
  { id: 'login', label: 'Masuk', group: 'pwa' },
  { id: 'daftar', label: 'Pendaftaran Anggota', group: 'pwa' },
  { id: 'home', label: 'Beranda + Daily Words', group: 'pwa' },
  { id: 'detail', label: 'Detail Kartu Anggota', group: 'pwa' },
  { id: 'events', label: 'Events', group: 'pwa' },
  { id: 'event', label: 'View Event', group: 'pwa' },
  { id: 'tickets', label: 'My Tickets', group: 'pwa' },
  { id: 'ticket', label: 'Tiket + QR', group: 'pwa' },
  { id: 'history', label: 'Milestone (Riwayat)', group: 'pwa' },
  { id: 'kesaksian', label: 'Kesaksian Saya', group: 'pwa' },
  { id: 'profile', label: 'Profil', group: 'pwa' },
  { id: 'k-home', label: 'Beranda Sekretariat', group: 'alk' },
  { id: 'k-members', label: 'LevelUP Kota (Pengurus)', group: 'alk' },
  { id: 'k-approval', label: 'Approval Member (Squad)', group: 'alk' },
  { id: 'k-member-new', label: 'Tambah Pengurus', group: 'alk' },
  { id: 'k-events', label: 'Pengajuan Event', group: 'alk' },
  { id: 'k-event', label: 'Detail Event + Presensi', group: 'alk' },
  { id: 'k-event-new', label: 'Buat Event', group: 'alk' },
  { id: 'k-reimburse', label: 'Pengajuan Reimburse', group: 'alk' },
  { id: 'k-scan', label: 'Scan Absensi (per sesi)', group: 'alk' },
  { id: 'k-more', label: 'Lainnya', group: 'alk' },
  { id: 'k-tickets', label: 'Pengaduan ke Pusat', group: 'alk' },
] as const

export type ScreenId = (typeof SCREEN_LIST)[number]['id']

export const isScreen = (s: unknown): s is ScreenId => SCREEN_LIST.some((x) => x.id === s)
