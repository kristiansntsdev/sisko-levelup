'use client'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toggleLikeArtikel } from '@/lib/actions/artikel-public'
import { formatTanggalArtikel } from '@/lib/artikel'
import type { ArtikelCard } from '@/lib/artikel-data'
import { LABEL, MONO } from '@/components/pwa/paper-ui'
import { EventThumb } from '@/components/pwa/ui'

export function ThumbUp({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-[19px] h-[19px]" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" aria-hidden>
      <path d="M7 10v10H4a1 1 0 01-1-1v-8a1 1 0 011-1zM7 10l4-7a2 2 0 012 2v4h5.6a2 2 0 012 2.3l-1.2 7a2 2 0 01-2 1.7H7" />
    </svg>
  )
}

/** Medium-style list row: meta, title, excerpt, stats + thumbs-up on the left, cover on the right. */
export function ArtikelRow({ a, liked: initialLiked }: { a: ArtikelCard; liked: boolean }) {
  const [liked, setLiked] = useState(initialLiked)
  const [likes, setLikes] = useState(a.likes)
  const [pending, start] = useTransition()

  function like() {
    // Optimistic; the server answer replaces it.
    const next = !liked
    setLiked(next)
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)))
    start(async () => {
      const r = await toggleLikeArtikel(a.id)
      if (r.ok) {
        setLiked(r.liked)
        setLikes(r.count)
      } else {
        setLiked(!next)
        setLikes((n) => Math.max(0, n + (next ? -1 : 1)))
      }
    })
  }

  return (
    <article className="relative rounded-[14px] border-2 border-[#161616] bg-[#fffdf7] p-4 shadow-[4px_4px_0_#161616] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#161616]">
      <Link href={`/dashboard/artikel/${a.slug}`} aria-label={a.judul} className="absolute inset-0 z-0 rounded-[14px]" />
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>
            BRIM LevelUP · {formatTanggalArtikel(a.publishedAt)}
          </p>
          <h3 className="mt-1.5 text-[18px] font-extrabold leading-[1.2] text-[#161616] line-clamp-3">{a.judul}</h3>
          {a.ringkasan && (
            <p className={`${MONO} mt-1.5 text-[12px] leading-relaxed text-[#57534e] line-clamp-2`}>{a.ringkasan}</p>
          )}
        </div>
        <EventThumb src={a.coverUrl} className="shrink-0 self-start w-[96px] h-[96px] rounded-[4px]" />
      </div>
      <div className={`${MONO} relative z-10 mt-3.5 pt-3 border-t-2 border-dotted border-[#161616]/25 flex items-center gap-4 text-[12px] font-bold text-[#57534e]`}>
        <button
          type="button"
          onClick={like}
          disabled={pending}
          aria-pressed={liked}
          aria-label={liked ? 'Batal suka' : 'Suka'}
          className={`flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 active:scale-95 transition disabled:opacity-60 ${liked ? 'border-[#e02a2f] bg-[#e02a2f] text-white' : 'border-[#161616] bg-[#fffdf7] text-[#161616] hover:bg-[#ffd83d]'}`}
        >
          <ThumbUp filled={liked} />
          {likes}
        </button>
        <Link
          href={`/dashboard/artikel/${a.slug}#komentar`}
          aria-label="Lihat komentar"
          className="flex items-center gap-1.5 rounded-full border-2 border-[#161616] bg-[#fffdf7] px-2.5 py-1 text-[#161616] active:scale-95 transition hover:bg-[#ffd83d]"
        >
          💬 {a.komentar}
        </Link>
        <span className="ml-auto">👁 {a.views}</span>
      </div>
    </article>
  )
}
