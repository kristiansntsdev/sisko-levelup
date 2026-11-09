import Link from 'next/link'
import type { ArtikelCard } from '@/lib/artikel-data'
import { formatTanggalArtikel } from '@/lib/artikel'
import { EventThumb } from '@/components/pwa/ui'
import { Strip, Tape } from '@/components/landing/zine'

/** Polaroid-style article card for the landing page and /artikel. */
export function ArtikelPolaroid({ a, i = 0, className = '' }: { a: ArtikelCard; i?: number; className?: string }) {
  return (
    <Link
      href={`/artikel/${a.slug}`}
      className={`relative block ${i % 2 ? 'rotate-[1.2deg]' : '-rotate-[1.2deg]'} transition duration-300 hover:rotate-0 hover:-translate-y-1 ${className}`}
    >
      <Tape seed={i + 3} className={`-top-3 left-1/2 -translate-x-1/2 ${i % 2 ? 'rotate-3' : '-rotate-2'} h-6 w-20`} />
      <div className="bg-[#fffdf7] p-2.5 pb-4 shadow-[0_14px_22px_-12px_rgba(40,30,10,.5)]">
        <EventThumb src={a.coverUrl} className="w-full aspect-[16/10]" />
        <div className="px-1 pt-3">
          <Strip tone="yellow" seed={i + 21} className="px-2.5 py-1.5 text-[11.5px]">
            {formatTanggalArtikel(a.publishedAt)}
          </Strip>
          <h3 className="mt-2.5 text-[17px] font-extrabold leading-snug text-[#161616] line-clamp-2">{a.judul}</h3>
          {a.ringkasan && <p className="mt-1.5 text-[13.5px] leading-relaxed text-stone-600 line-clamp-3">{a.ringkasan}</p>}
          <p className="mt-3 flex items-center gap-3.5 text-[12.5px] font-bold text-stone-500">
            <span><span className="text-[#e02a2f]">♥</span> {a.likes}</span>
            <span>💬 {a.komentar}</span>
          </p>
        </div>
      </div>
    </Link>
  )
}
