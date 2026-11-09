import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { getArtikelBySlug, isLikedBy, listKomentarPublik } from '@/lib/artikel-data'
import { ARTIKEL_BODY, formatTanggalArtikel } from '@/lib/artikel'
import { ArtikelInteraksi } from './artikel-interaksi'
import { Strip, Tape, ZineFooter, ZineHeader, ZinePage, LIFT, PRESS, MK } from '@/components/landing/zine'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const a = await getArtikelBySlug(slug)
  if (!a) return { title: 'Artikel tidak ditemukan — LevelUP' }
  return {
    title: `${a.judul} — LevelUP`,
    description: a.ringkasan,
    openGraph: {
      title: a.judul,
      description: a.ringkasan,
      type: 'article',
      ...(a.publishedAt ? { publishedTime: a.publishedAt } : {}),
      ...(a.coverUrl ? { images: [a.coverUrl] } : {}),
    },
  }
}

export default async function ArtikelPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection()
  const { slug } = await params
  const a = await getArtikelBySlug(slug)
  if (!a) notFound()
  const visitor = (await cookies()).get('lup_vid')?.value
  const [komentar, liked] = await Promise.all([listKomentarPublik(a.id), isLikedBy(a.id, visitor)])

  return (
    <ZinePage>
      <ZineHeader />
      <article className="px-5 sm:px-8 pt-10 pb-16 max-w-3xl mx-auto">
        <Link href="/artikel" className={`inline-block ${LIFT} ${PRESS}`}>
          <Strip tone="paper" seed={7} className="px-3.5 py-2 text-[13px] -rotate-1">← Semua artikel</Strip>
        </Link>

        <h1 className={`${MK} mt-8 text-[clamp(2rem,6.5vw,3.4rem)] leading-[1.05]`}>{a.judul}</h1>
        <p className="mt-4 text-[14px] font-bold text-stone-600">BRIM LevelUP · {formatTanggalArtikel(a.publishedAt)}</p>

        {a.coverUrl && (
          <figure className="relative mt-8 bg-[#fffdf7] p-2.5 pb-3 shadow-[0_14px_24px_-10px_rgba(40,30,10,.5)] -rotate-[.6deg]">
            <Tape seed={9} className="-top-3 left-1/2 -translate-x-1/2 rotate-2 h-6 w-24" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.coverUrl} alt="" className="block w-full h-auto" />
          </figure>
        )}

        {/* HTML is sanitized on every save (lib/artikel-html.ts), never trusted from the editor as-is. */}
        <div className={`mt-9 ${ARTIKEL_BODY}`} dangerouslySetInnerHTML={{ __html: a.isi }} />

        <ArtikelInteraksi id={a.id} judul={a.judul} initialLikes={a.likes} initialLiked={liked} initialKomentar={komentar} />
      </article>
      <ZineFooter />
    </ZinePage>
  )
}
