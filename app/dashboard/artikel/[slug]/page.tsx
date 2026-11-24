import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { getArtikelBySlug, isLikedBy, listKomentarPublik } from '@/lib/artikel-data'
import { ARTIKEL_BODY, formatTanggalArtikel } from '@/lib/artikel'
import { LABEL, PANEL, PaperHeader, PaperMain } from '@/components/pwa/paper-ui'
import { Icon } from '@/components/pwa/ui'
import { ArtikelDetailInteraksi } from '@/components/pwa/artikel-detail'

export default async function DashboardArtikelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection()
  const { slug } = await params
  const a = await getArtikelBySlug(slug)
  if (!a) notFound()
  const visitor = (await cookies()).get('lup_vid')?.value
  const [komentar, liked] = await Promise.all([listKomentarPublik(a.id), isLikedBy(a.id, visitor)])

  return (
    <PaperMain>
      <PaperHeader
        sticker="Artikel BRIM"
        title="Artikel"
        leading={
          <Link
            href="/dashboard/artikel"
            aria-label="Kembali ke daftar artikel"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[#161616] bg-[#fffdf7] active:scale-95 transition"
          >
            <Icon name="back" className="w-5 h-5" sw={2.2} />
          </Link>
        }
      />
      <article className="px-5 mt-4 pb-6">
        <h2 className="text-[26px] font-extrabold leading-[1.15] text-[#161616]">{a.judul}</h2>
        <p className={`${LABEL} mt-2.5 text-[10px] text-[#57534e]`}>
          BRIM LevelUP · {formatTanggalArtikel(a.publishedAt)} · 👁 {a.views}
        </p>
        {a.coverUrl && (
          <div className="mt-4 overflow-hidden rounded-[14px] border-2 border-[#161616] shadow-[4px_4px_0_#161616]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.coverUrl} alt="" className="block w-full h-auto" />
          </div>
        )}
        <div className={`mt-6 px-5 py-6 ${PANEL}`}>
          {/* HTML is sanitized on every save (lib/artikel-html.ts), never trusted from the editor as-is. */}
          <div className={ARTIKEL_BODY} dangerouslySetInnerHTML={{ __html: a.isi }} />
        </div>
        <ArtikelDetailInteraksi
          id={a.id}
          slug={a.slug}
          judul={a.judul}
          initialLikes={a.likes}
          initialLiked={liked}
          initialKomentar={komentar}
        />
      </article>
    </PaperMain>
  )
}
