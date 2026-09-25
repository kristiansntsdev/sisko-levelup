/**
 * Dijalankan sekali saat server instance boot (Next.js instrumentation hook).
 *
 * Vercel jalan UTC secara default. Semua perhitungan tanggal yang dibandingkan
 * dengan kolom `@db.Date` sudah eksplisit WIB (`lib/wib.ts`,
 * `lib/event-absen-window.ts`), jadi pin ini bukan penyangga utama — dia
 * jaring pengaman untuk kode baru yang tanpa sadar pakai `setHours()` /
 * `new Date(y, m, d)`, dan bikin timestamp log ikut WIB.
 *
 * Di Vercel bisa juga di-set lewat environment variable `TZ`; pin di sini
 * supaya perilakunya sama di lokal tanpa perlu ingat setting dashboard.
 */
export function register() {
  process.env.TZ = 'Asia/Jakarta'
}
