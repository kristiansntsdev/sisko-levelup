'use server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { sessionPesertaId } from '@/lib/peserta-session'
import { getPengurusFromCookie } from '@/lib/pengurus-session'
import { endpointDiizinkan } from '@/lib/push/endpoint'
import { lepasPeserta, PUSH_COOKIE } from '@/lib/push/lepas'

/** Kunci publik VAPID dibaca saat runtime (image di-build tanpa env produksi, jadi bukan NEXT_PUBLIC_*). */
export async function getPushConfig(): Promise<{ publicKey: string | null }> {
  return { publicKey: process.env.VAPID_PUBLIC_KEY?.trim() || null }
}

export type SimpanPushInput = { endpoint: string; p256dh: string; auth: string; encoding?: string; userAgent?: string }
type Hasil = { ok: true } | { ok: false; error: string }

/** Simpan / sinkron perangkat ini ke sesi yang sedang login. Semua id dari sesi, tidak pernah dari client. */
export async function simpanPush(input: SimpanPushInput): Promise<Hasil> {
  if (!endpointDiizinkan(input?.endpoint)) return { ok: false, error: 'Endpoint tidak dikenali.' }
  const p256dh = String(input.p256dh ?? '')
  const auth = String(input.auth ?? '')
  if (!p256dh || !auth || p256dh.length > 255 || auth.length > 255) return { ok: false, error: 'Kunci tidak valid.' }
  const encoding = input.encoding === 'aesgcm' ? 'aesgcm' : 'aes128gcm'
  const ua = String(input.userAgent ?? '').slice(0, 255)

  const [idPeserta, pengurus] = await Promise.all([sessionPesertaId(), getPengurusFromCookie()])
  const idPengurus = pengurus?.id_pengurus ?? null
  if (!idPeserta && !idPengurus) return { ok: false, error: 'Sesi berakhir. Masuk lagi.' }

  // Sesi yang tidak ada tidak menghapus nilai lama (cookie pengurus hanya 8 jam); dilepas saat logout.
  await db.$executeRaw`
    INSERT INTO push_subscription (endpoint, p256dh, auth, encoding, id_peserta, id_pengurus, user_agent)
    VALUES (${input.endpoint}, ${p256dh}, ${auth}, ${encoding}, ${idPeserta}, ${idPengurus}, ${ua})
    ON DUPLICATE KEY UPDATE
      p256dh = VALUES(p256dh), auth = VALUES(auth), encoding = VALUES(encoding), user_agent = VALUES(user_agent),
      id_peserta = COALESCE(VALUES(id_peserta), id_peserta),
      id_pengurus = COALESCE(VALUES(id_pengurus), id_pengurus)`
  const rows = await db.$queryRaw<{ id_sub: number }[]>`SELECT id_sub FROM push_subscription WHERE endpoint = ${input.endpoint} LIMIT 1`
  const idSub = rows[0]?.id_sub
  if (idSub) {
    ;(await cookies()).set(PUSH_COOKIE, String(idSub), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  }
  return { ok: true }
}

/** Matikan notifikasi di perangkat ini: hanya baris milik sesi yang sedang login. */
export async function hapusPush(endpoint: string): Promise<Hasil> {
  if (typeof endpoint !== 'string' || endpoint.length > 1024) return { ok: false, error: 'Endpoint tidak valid.' }
  const [idPeserta, pengurus] = await Promise.all([sessionPesertaId(), getPengurusFromCookie()])
  const idPengurus = pengurus?.id_pengurus ?? null
  if (!idPeserta && !idPengurus) return { ok: false, error: 'Sesi berakhir. Masuk lagi.' }
  await db.$executeRaw`
    DELETE FROM push_subscription
    WHERE endpoint = ${endpoint}
      AND ((id_peserta IS NOT NULL AND id_peserta <=> ${idPeserta}) OR (id_pengurus IS NOT NULL AND id_pengurus <=> ${idPengurus}))`
  return { ok: true }
}

/** Dipanggil di Profil sebelum signOut. */
export async function lepasPushPeserta(): Promise<void> {
  await lepasPeserta(await sessionPesertaId())
}
