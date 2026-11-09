import type { Metadata } from 'next'
import { connection } from 'next/server'
import { listArtikelTerbit } from '@/lib/artikel-data'
import { ArtikelPolaroid } from '@/components/landing/artikel-card'
import { Brush, MK, Strip, ZineFooter, ZineHeader, ZinePage } from '@/components/landing/zine'

export const metadata: Metadata = {
  title: 'Artikel — LevelUP',
  description: 'Tulisan dan cerita dari tim BRIM LevelUP: penyembahan, pemuridan, dan kabar dari kota-kota LevelUP.',
}

export default async function ArtikelIndexPage() {
  await connection()
  const artikel = await listArtikelTerbit()
  return (
    <ZinePage>
      <ZineHeader />
      <section className="px-5 sm:px-8 pt-12 pb-24 max-w-6xl mx-auto">
        <h1 className={`${MK} relative inline-block text-[clamp(2.6rem,9vw,4.6rem)] leading-none uppercase`}>
          Artikel <span className="text-[#e02a2f]">LevelUP</span>
          <Brush className="-bottom-3 h-3" />
        </h1>
        <p className="mt-6 max-w-lg text-[15.5px] text-stone-700">Tulisan dan cerita dari tim BRIM — buat dibaca, dibagi, dan didiskusikan bareng.</p>
        {artikel.length === 0 ? (
          <div className="mt-12">
            <Strip tone="paper" seed={5} className="px-5 py-4 text-[15px] -rotate-1">
              Belum ada artikel. Tunggu ya!
            </Strip>
          </div>
        ) : (
          <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {artikel.map((a, i) => (
              <ArtikelPolaroid key={a.id} a={a} i={i} />
            ))}
          </div>
        )}
      </section>
      <ZineFooter />
    </ZinePage>
  )
}
