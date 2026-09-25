/**
 * Dijalankan sekali saat server instance boot (Next.js instrumentation hook).
 *
 * Vercel jalan UTC secara default. Beberapa query masih pakai batas hari /
 * bulan waktu lokal (`setHours(0,0,0,0)`, `new Date(y, m, 1)`) untuk
 * dibandingkan dengan kolom DATE yang berisi tanggal WIB — mis. auto-absence
 * dan "Tiket Aktif bulan ini". Tanpa pin ini, batasnya meleset 7 jam: antara
 * 00:00–07:00 WIB server masih menganggap hari/bulan kemarin.
 *
 * Jadwal absen online tidak bergantung pada ini — `lib/event-absen-window.ts`
 * menghitung WIB secara eksplisit.
 */
export function register() {
  process.env.TZ = 'Asia/Jakarta'
}
