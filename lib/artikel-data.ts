import { db } from '@/lib/db'
import { wibToday } from '@/lib/wib'

const DAY_MS = 24 * 60 * 60 * 1000

export type ArtikelCard = {
  id: number
  slug: string
  judul: string
  ringkasan: string
  coverUrl: string
  publishedAt: string | null
  likes: number
  komentar: number
}

export type ArtikelFull = ArtikelCard & { isi: string }

export type KomentarItem = { id: number; nama: string; isi: string; createdAt: string; hidden: boolean }

async function countsFor(ids: number[]): Promise<{ likes: Map<number, number>; komentar: Map<number, number> }> {
  if (ids.length === 0) return { likes: new Map(), komentar: new Map() }
  const [likes, komentar] = await Promise.all([
    db.artikel_like.groupBy({ by: ['id_artikel'], where: { id_artikel: { in: ids } }, _count: { _all: true } }),
    db.artikel_komentar.groupBy({ by: ['id_artikel'], where: { id_artikel: { in: ids }, hidden: 0 }, _count: { _all: true } }),
  ])
  return {
    likes: new Map(likes.map((r) => [r.id_artikel, r._count._all])),
    komentar: new Map(komentar.map((r) => [r.id_artikel, r._count._all])),
  }
}

type Row = {
  id_artikel: number; slug: string; judul: string; ringkasan: string; cover_url: string; published_at: Date | null
}

function toCard(r: Row, c: Awaited<ReturnType<typeof countsFor>>): ArtikelCard {
  return {
    id: r.id_artikel,
    slug: r.slug,
    judul: r.judul,
    ringkasan: r.ringkasan,
    coverUrl: r.cover_url,
    publishedAt: r.published_at ? r.published_at.toISOString() : null,
    likes: c.likes.get(r.id_artikel) ?? 0,
    komentar: c.komentar.get(r.id_artikel) ?? 0,
  }
}

/** Public list. Never throws: before prod-migrate the tables are missing and the landing page must still render. */
export async function listArtikelTerbit(limit?: number): Promise<ArtikelCard[]> {
  try {
    const rows = await db.artikel.findMany({
      where: { status: 'published' },
      orderBy: { published_at: 'desc' },
      take: limit,
      select: { id_artikel: true, slug: true, judul: true, ringkasan: true, cover_url: true, published_at: true },
    })
    const c = await countsFor(rows.map((r) => r.id_artikel))
    return rows.map((r) => toCard(r, c))
  } catch (e) {
    console.error('listArtikelTerbit', e)
    return []
  }
}

export async function getArtikelBySlug(slug: string): Promise<ArtikelFull | null> {
  try {
    const r = await db.artikel.findUnique({ where: { slug } })
    if (!r || r.status !== 'published') return null
    const c = await countsFor([r.id_artikel])
    return { ...toCard(r, c), isi: r.isi }
  } catch (e) {
    console.error('getArtikelBySlug', e)
    return null
  }
}

export async function listKomentarPublik(idArtikel: number): Promise<KomentarItem[]> {
  try {
    const rows = await db.artikel_komentar.findMany({
      where: { id_artikel: idArtikel, hidden: 0 },
      orderBy: { id_komentar: 'desc' },
      take: 200,
    })
    return rows.map((r) => ({ id: r.id_komentar, nama: r.nama, isi: r.isi, createdAt: r.created_at.toISOString(), hidden: false }))
  } catch (e) {
    console.error('listKomentarPublik', e)
    return []
  }
}

export async function isLikedBy(idArtikel: number, visitor: string | undefined): Promise<boolean> {
  if (!visitor) return false
  try {
    const r = await db.artikel_like.findUnique({
      where: { id_artikel_visitor: { id_artikel: idArtikel, visitor } },
      select: { id_artikel: true },
    })
    return !!r
  } catch {
    return false
  }
}

// ── Admin (Brim Nasional) ───────────────────────────────────────

export type ArtikelAdminRow = ArtikelCard & {
  status: 'draft' | 'published'
  createdAt: string
  viewsTotal: number
  views30: number
  komentarSemua: number
}

function dayKeys(n: number): string[] {
  const today = wibToday().getTime()
  return Array.from({ length: n }, (_, i) => new Date(today - (n - 1 - i) * DAY_MS).toISOString().slice(0, 10))
}

export async function listArtikelAdmin(): Promise<ArtikelAdminRow[]> {
  const rows = await db.artikel.findMany({
    orderBy: [{ created_at: 'desc' }],
    select: { id_artikel: true, slug: true, judul: true, ringkasan: true, cover_url: true, published_at: true, status: true, created_at: true },
  })
  const ids = rows.map((r) => r.id_artikel)
  if (ids.length === 0) return []
  const since = new Date(wibToday().getTime() - 29 * DAY_MS)
  const [c, total, recent, komentarSemua] = await Promise.all([
    countsFor(ids),
    db.artikel_view.groupBy({ by: ['id_artikel'], where: { id_artikel: { in: ids } }, _sum: { views: true } }),
    db.artikel_view.groupBy({ by: ['id_artikel'], where: { id_artikel: { in: ids }, tanggal: { gte: since } }, _sum: { views: true } }),
    db.artikel_komentar.groupBy({ by: ['id_artikel'], where: { id_artikel: { in: ids } }, _count: { _all: true } }),
  ])
  const t = new Map(total.map((r) => [r.id_artikel, r._sum.views ?? 0]))
  const r30 = new Map(recent.map((r) => [r.id_artikel, r._sum.views ?? 0]))
  const ks = new Map(komentarSemua.map((r) => [r.id_artikel, r._count._all]))
  return rows.map((r) => ({
    ...toCard(r, c),
    status: r.status === 'published' ? 'published' : 'draft',
    createdAt: r.created_at.toISOString(),
    viewsTotal: t.get(r.id_artikel) ?? 0,
    views30: r30.get(r.id_artikel) ?? 0,
    komentarSemua: ks.get(r.id_artikel) ?? 0,
  }))
}

export type ArtikelAdminDetail = {
  id: number
  slug: string
  judul: string
  ringkasan: string
  coverUrl: string
  isi: string
  status: 'draft' | 'published'
  publishedAt: string | null
  likes: number
  viewsTotal: number
  views7: number
  views30: number
  harian: { tanggal: string; views: number }[]
  komentar: KomentarItem[]
}

export async function getArtikelAdminDetail(id: number): Promise<ArtikelAdminDetail | null> {
  const r = await db.artikel.findUnique({ where: { id_artikel: id } })
  if (!r) return null
  const keys = dayKeys(30)
  const [views, total, likes, komentar] = await Promise.all([
    db.artikel_view.findMany({ where: { id_artikel: id, tanggal: { gte: new Date(`${keys[0]}T00:00:00Z`) } } }),
    db.artikel_view.aggregate({ where: { id_artikel: id }, _sum: { views: true } }),
    db.artikel_like.count({ where: { id_artikel: id } }),
    db.artikel_komentar.findMany({ where: { id_artikel: id }, orderBy: { id_komentar: 'desc' }, take: 500 }),
  ])
  const byDay = new Map(views.map((v) => [v.tanggal.toISOString().slice(0, 10), v.views]))
  const harian = keys.map((tanggal) => ({ tanggal, views: byDay.get(tanggal) ?? 0 }))
  return {
    id: r.id_artikel,
    slug: r.slug,
    judul: r.judul,
    ringkasan: r.ringkasan,
    coverUrl: r.cover_url,
    isi: r.isi,
    status: r.status === 'published' ? 'published' : 'draft',
    publishedAt: r.published_at ? r.published_at.toISOString() : null,
    likes,
    viewsTotal: total._sum.views ?? 0,
    views7: harian.slice(-7).reduce((a, h) => a + h.views, 0),
    views30: harian.reduce((a, h) => a + h.views, 0),
    harian,
    komentar: komentar.map((k) => ({ id: k.id_komentar, nama: k.nama, isi: k.isi, createdAt: k.created_at.toISOString(), hidden: k.hidden === 1 })),
  }
}

export type BrimArtikelStats = {
  terbit: number
  draft: number
  views7: number
  likes: number
  komentar7: number
  top: { id: number; judul: string; views30: number }[]
}

export async function getBrimArtikelStats(): Promise<BrimArtikelStats> {
  const empty: BrimArtikelStats = { terbit: 0, draft: 0, views7: 0, likes: 0, komentar7: 0, top: [] }
  try {
    const today = wibToday().getTime()
    const since30 = new Date(today - 29 * DAY_MS)
    const since7 = new Date(today - 6 * DAY_MS)
    const [terbit, draft, views7, likes, komentar7, top] = await Promise.all([
      db.artikel.count({ where: { status: 'published' } }),
      db.artikel.count({ where: { status: 'draft' } }),
      db.artikel_view.aggregate({ where: { tanggal: { gte: since7 } }, _sum: { views: true } }),
      db.artikel_like.count(),
      db.artikel_komentar.count({ where: { created_at: { gte: new Date(Date.now() - 7 * DAY_MS) } } }),
      db.artikel_view.groupBy({
        by: ['id_artikel'], where: { tanggal: { gte: since30 } }, _sum: { views: true },
        orderBy: { _sum: { views: 'desc' } }, take: 5,
      }),
    ])
    const titles = await db.artikel.findMany({
      where: { id_artikel: { in: top.map((t) => t.id_artikel) } },
      select: { id_artikel: true, judul: true },
    })
    const tm = new Map(titles.map((t) => [t.id_artikel, t.judul]))
    return {
      terbit, draft, views7: views7._sum.views ?? 0, likes, komentar7,
      top: top.filter((t) => tm.has(t.id_artikel)).map((t) => ({ id: t.id_artikel, judul: tm.get(t.id_artikel)!, views30: t._sum.views ?? 0 })),
    }
  } catch (e) {
    console.error('getBrimArtikelStats', e)
    return empty
  }
}
