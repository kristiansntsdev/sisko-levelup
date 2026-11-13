import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { getArtikelBySlug, isLikedBy, listKomentarPublik } from '@/lib/artikel-data'
import { ARTIKEL_BODY, formatTanggalArtikel } from '@/lib/artikel'
import { ArtikelInteraksi } from './artikel-interaksi'
import { Brush, Crown, Heart, Scribble, Smiley, Strip, Tape, Torn, ZineFooter, ZineHeader, ZinePage, LIFT, PRESS, MK } from '@/components/landing/zine'

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
      <article className="relative px-5 sm:px-8 pt-10 pb-20 max-w-3xl mx-auto">
        <Link href="/artikel" className={`inline-block ${LIFT} ${PRESS}`}>
          <Strip tone="paper" seed={7} className="px-3.5 py-2 text-[13px] -rotate-1">← Semua artikel</Strip>
        </Link>

        {/* Masthead */}
        <header className="relative mt-9">
          <Crown className="absolute -top-6 right-0 w-14 sm:w-16 rotate-12 hidden sm:block" />
          <Scribble className="absolute -left-7 top-10 w-9 text-[#e02a2f] hidden lg:block" />
          <div className="opacity-0 animate-[fadeUp_0.6s_ease_forwards]">
            <Strip tone="red" seed={3} className="px-3.5 py-2 text-[13.5px] -rotate-2">Artikel BRIM</Strip>
          </div>
          <h1
            className={`${MK} relative mt-5 inline uppercase text-[clamp(2.1rem,7vw,3.6rem)] leading-[1.02] bg-[linear-gradient(transparent_80%,#ffd83d_80%)] [box-decoration-break:clone] px-1 opacity-0 animate-[fadeUp_0.6s_ease_forwards]`}
            style={{ animationDelay: '80ms' }}
          >
            {a.judul}
          </h1>
          <div className="relative mt-5 flex flex-wrap items-center gap-3 opacity-0 animate-[fadeUp_0.6s_ease_forwards]" style={{ animationDelay: '160ms' }}>
            <Strip tone="ink" seed={11} className="px-3 py-2 text-[12.5px] rotate-1">BRIM LevelUP</Strip>
            <Strip tone="yellow" seed={13} className="px-3 py-2 text-[12.5px] -rotate-1">{formatTanggalArtikel(a.publishedAt)}</Strip>
            <Brush className="-bottom-4 h-2.5 w-40 left-0" />
          </div>
        </header>

        {/* Cover: photo taped on the page */}
        {a.coverUrl && (
          <figure className="relative mt-12 bg-[#fffdf7] p-2.5 pb-5 shadow-[0_18px_30px_-12px_rgba(40,30,10,.55)] -rotate-[1.2deg]">
            <Tape seed={9} className="-top-3 -left-4 -rotate-[30deg] h-6 w-24" />
            <Tape seed={14} className="-top-3 -right-4 rotate-[30deg] h-6 w-24" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.coverUrl} alt="" className="block w-full h-auto" />
            <Heart className="absolute -right-3 -bottom-4 w-10 text-[#e02a2f] rotate-12" />
          </figure>
        )}

        {/* Body on a torn sheet */}
        <div className="relative mt-12 -mx-2 sm:mx-0">
          <Tape seed={21} className="-top-3 left-[12%] -rotate-3 h-6 w-24" />
          <Tape seed={22} className="-top-3 right-[14%] rotate-2 h-6 w-20 hidden sm:block" />
          <Torn seed={23} amp={10} sides="tb" inner="relative bg-[#fffdf7] px-5 sm:px-10 pt-11 sm:pt-12 pb-12 sm:pb-14">
            {/* HTML is sanitized on every save (lib/artikel-html.ts), never trusted from the editor as-is. */}
            <div className={ARTIKEL_BODY} dangerouslySetInnerHTML={{ __html: a.isi }} />
            <div className="mt-10 flex items-center gap-3">
              <span className="h-1.5 w-16 bg-[#161616] -rotate-2" aria-hidden />
              <Strip tone="ink" seed={25} className="px-3 py-1.5 text-[12px] rotate-1">Selesai</Strip>
              <Smiley className="ml-auto w-12 h-12 rotate-12" />
            </div>
          </Torn>
        </div>

        <ArtikelInteraksi id={a.id} judul={a.judul} initialLikes={a.likes} initialLiked={liked} initialKomentar={komentar} />
      </article>
      <ZineFooter />
    </ZinePage>
  )
}
