/**
 * Kirim Web Push. Hanya untuk server.
 * Tabel push_subscription / push_kirim ditulis dan dibaca lewat raw SQL (bukan model Prisma) supaya ekstensi audit
 * app_log tidak kebanjiran, sama dengan view/like artikel.
 */
import * as webpush from 'web-push'
import { db } from '@/lib/db'
import { Prisma } from '@/lib/generated/client'

export type PushPayload = {
  title: string
  body: string
  /** Path relatif di app ini (mis. /join/12). */
  url: string
  /** Notifikasi dengan tag sama saling mengganti. */
  tag?: string
  /** Bunyi lagi walau menggantikan notifikasi bertag sama. */
  renotify?: boolean
  /** URL gambar besar (Android Chrome menampilkan; iOS mengabaikan). */
  image?: string
}

export type PushOpts = { ttl?: number; urgency?: 'very-low' | 'low' | 'normal' | 'high' }
export type Penerima = { peserta?: number[]; pengurus?: number[] }
export type HasilKirim = { terkirim: number; gagal: number; dihapus: number }

export const TTL_PENGINGAT = 24 * 60 * 60
export const TTL_BIASA = 3 * 24 * 60 * 60

const KOSONG: HasilKirim = { terkirim: 0, gagal: 0, dihapus: 0 }

let siap: boolean | null = null

/** Kunci VAPID wajib ada; tanpa nilai default. Kosong → log sekali, push dimatikan. */
export function pushAktif(): boolean {
  if (siap !== null) return siap
  const pub = process.env.VAPID_PUBLIC_KEY?.trim()
  const priv = process.env.VAPID_PRIVATE_KEY?.trim()
  const subject = process.env.VAPID_SUBJECT?.trim()
  if (!pub || !priv || !subject) {
    console.error('[push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT belum diisi; push dimatikan')
    siap = false
    return false
  }
  webpush.setVapidDetails(subject, pub, priv)
  siap = true
  return true
}

type SubRow = { id_sub: number; endpoint: string; p256dh: string; auth: string; encoding: string }

async function ambilSub(to: Penerima): Promise<SubRow[]> {
  const peserta = [...new Set(to.peserta ?? [])]
  const pengurus = [...new Set(to.pengurus ?? [])]
  const rows: SubRow[] = []
  if (peserta.length) {
    rows.push(
      ...(await db.$queryRaw<SubRow[]>`
        SELECT id_sub, endpoint, p256dh, auth, encoding FROM push_subscription
        WHERE id_peserta IN (${Prisma.join(peserta)})`),
    )
  }
  if (pengurus.length) {
    rows.push(
      ...(await db.$queryRaw<SubRow[]>`
        SELECT id_sub, endpoint, p256dh, auth, encoding FROM push_subscription
        WHERE id_pengurus IN (${Prisma.join(pengurus)})`),
    )
  }
  // Satu HP bisa membawa sesi peserta + pengurus: kirim sekali per endpoint.
  const seen = new Set<string>()
  return rows.filter((r) => (seen.has(r.endpoint) ? false : (seen.add(r.endpoint), true)))
}

/** id peserta / pengurus yang punya minimal satu perangkat terdaftar. */
export async function berlangganan(): Promise<{ peserta: number[]; pengurus: number[] }> {
  const [p, g] = await Promise.all([
    db.$queryRaw<{ id: number }[]>`SELECT DISTINCT id_peserta AS id FROM push_subscription WHERE id_peserta IS NOT NULL`,
    db.$queryRaw<{ id: number }[]>`SELECT DISTINCT id_pengurus AS id FROM push_subscription WHERE id_pengurus IS NOT NULL`,
  ])
  return { peserta: p.map((r) => Number(r.id)), pengurus: g.map((r) => Number(r.id)) }
}

export async function kirimPush(to: Penerima, payload: PushPayload, opts: PushOpts = {}): Promise<HasilKirim> {
  if (!pushAktif()) return KOSONG
  let subs: SubRow[]
  try {
    subs = await ambilSub(to)
  } catch (err) {
    console.error('[push] baca subscription gagal', err)
    return KOSONG
  }
  return kirimKeSubs(subs, payload, opts)
}

/** Kirim ke satu perangkat (baris push_subscription), mis. notifikasi percobaan saat baru diaktifkan. */
export async function kirimKeIdSub(idSub: number, payload: PushPayload, opts: PushOpts = {}): Promise<HasilKirim> {
  if (!pushAktif()) return KOSONG
  const subs = await db.$queryRaw<SubRow[]>`
    SELECT id_sub, endpoint, p256dh, auth, encoding FROM push_subscription WHERE id_sub = ${idSub} LIMIT 1`
  return kirimKeSubs(subs, payload, opts)
}

async function kirimKeSubs(subs: SubRow[], payload: PushPayload, opts: PushOpts): Promise<HasilKirim> {
  if (!subs.length) return KOSONG
  const body = JSON.stringify({
    title: payload.title.slice(0, 80),
    body: payload.body.slice(0, 180),
    icon: '/icons/icon-192.png',
    badge: '/icons/push-badge.png',
    tag: payload.tag,
    image: payload.image,
    // renotify tanpa tag melempar TypeError di showNotification.
    renotify: payload.renotify && payload.tag ? true : undefined,
    data: { url: payload.url },
  })
  const options = { TTL: opts.ttl ?? TTL_BIASA, urgency: opts.urgency ?? 'normal' }

  const hasil = { ...KOSONG }
  const mati: number[] = []
  for (let i = 0; i < subs.length; i += 20) {
    const batch = subs.slice(i, i + 20)
    const res = await Promise.allSettled(
      batch.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          { ...options, contentEncoding: s.encoding === 'aesgcm' ? 'aesgcm' : 'aes128gcm' },
        ),
      ),
    )
    res.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        hasil.terkirim++
        return
      }
      hasil.gagal++
      const code = (r.reason as { statusCode?: number })?.statusCode
      if (code === 404 || code === 410) mati.push(batch[idx].id_sub)
      else console.error('[push] kirim gagal', code, String((r.reason as Error)?.message ?? r.reason).slice(0, 160))
    })
  }
  if (mati.length) {
    await db.$executeRaw`DELETE FROM push_subscription WHERE id_sub IN (${Prisma.join(mati)})`.catch((e: unknown) =>
      console.error('[push] hapus subscription mati gagal', e),
    )
    hasil.dihapus = mati.length
  }
  return hasil
}

/** Klaim satu kunci dedup (INSERT IGNORE). true = baru diklaim, boleh kirim. */
export async function klaimPush(kunci: string): Promise<boolean> {
  const n = await db.$executeRaw`INSERT IGNORE INTO push_kirim (kunci) VALUES (${kunci.slice(0, 160)})`
  return n === 1
}

export async function bersihkanKlaim(): Promise<number> {
  return db.$executeRaw`DELETE FROM push_kirim WHERE created_at < (NOW() - INTERVAL 90 DAY)`
}
