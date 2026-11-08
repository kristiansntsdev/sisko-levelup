/**
 * Event milik sebuah transaksi Kas Kota. Murni (aman di client, server, dan demo).
 *
 * Transaksi baru menyimpan `id_event`. Baris lama hanya punya keterangan "{nama_event} - {catatan}",
 * dan nama event bisa kembar (WW bulanan / WFE dengan nama sama tiap bulan), jadi untuk baris lama:
 * nama terpanjang yang cocok menang, lalu di antara event bernama sama dipilih yang tanggalnya
 * paling dekat dengan tanggal transaksi.
 */
export type KasEventRef = { id_event: number; nama_event: string; tglMs: number }

export type KasTxnRef = {
  kategori: string
  keterangan: string
  id_event: number | null
  tanggal: string | Date
}

const matchesName = (ket: string, nama: string) => ket === nama || ket.startsWith(`${nama} - `)

export function kasEventId(t: KasTxnRef, events: KasEventRef[]): number | null {
  if (t.kategori !== 'event') return null
  if (t.id_event != null) return t.id_event
  const at = new Date(t.tanggal).getTime()
  let best: KasEventRef | null = null
  for (const e of events) {
    if (!e.nama_event || !matchesName(t.keterangan, e.nama_event)) continue
    if (
      !best ||
      e.nama_event.length > best.nama_event.length ||
      (e.nama_event.length === best.nama_event.length && Math.abs(e.tglMs - at) < Math.abs(best.tglMs - at))
    ) {
      best = e
    }
  }
  return best?.id_event ?? null
}

/** Catatan tanpa awalan nama event, untuk diisi ulang di form edit. */
export function kasCatatan(keterangan: string, nama: string | undefined): string {
  if (!nama) return keterangan
  if (keterangan === nama) return ''
  return keterangan.startsWith(`${nama} - `) ? keterangan.slice(nama.length + 3) : keterangan
}
