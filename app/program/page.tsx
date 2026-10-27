import type { Metadata } from 'next'
import { Brush, Crown, CtaButtons, Dot, Heading, Heart, MK, Smiley, Snap, Strip, Tape, Torn, ZineFooter, ZineHeader, ZinePage } from '@/components/landing/zine'

export const metadata: Metadata = {
  title: 'Program LevelUP — Penyembahan & Pemuridan',
  description: 'Dokumentasi program LevelUP: Penyembahan, membangun tahta bagi Kristus, dan Pemuridan, murid yang memuridkan.',
}

type DocPhoto = { src: string; caption: string }

type Program = {
  id: string
  name: string
  tagline: string
  cover: string
  coverAlt: string
  verseRef: string
  verse: string
  note?: string
  goals: readonly string[]
  docs: DocPhoto[]
}

/** Copy from LevelUP Community Profile (PROFILE_LUP.pdf), Fokus Kegiatan */
// ponytail: docs are sample photos from the PDF; replace with uploads from the BRIM Nasional dashboard once that exists
const PROGRAMS: Program[] = [
  {
    id: 'penyembahan',
    name: 'Penyembahan',
    tagline: 'Membangun tahta bagi Kristus',
    cover: '/program/penyembahan.jpg',
    coverAlt: 'Ribuan anak muda LevelUP mengangkat tangan dalam penyembahan',
    verseRef: 'Mazmur 22 : 4',
    verse: 'Padahal Engkaulah Yang Kudus yang bersemayam di atas puji-pujian orang Israel.',
    note: 'Penyembahan menyediakan “kursi besar” bagi Tuhan untuk duduk dan berkuasa di tengah umat-Nya.',
    goals: ['Generasi muda yang suka menyembah dan berdoa', 'Menciptakan penyembah yang berdoa dan pendoa yang menyembah'],
    docs: [
      { src: '/about/hero-worship.jpg', caption: 'Penyembahan bersama' },
      { src: '/about/tentang.jpg', caption: 'Bendera LevelUP di tengah ibadah' },
      { src: '/about/misi-worship.jpg', caption: 'Menyembah dengan sepenuh hati' },
      { src: '/about/misi-hands.jpg', caption: 'Tangan terangkat' },
      { src: '/about/visi-crowd.jpg', caption: 'Anak muda lintas gereja' },
      { src: '/about/hero-crowd.jpg', caption: 'Bendera LevelUP berkibar' },
      { src: '/about/value-pray.jpg', caption: 'Doa bersama' },
      { src: '/about/value-excellence.jpg', caption: 'Sorak-sorai bersama' },
    ],
  },
  {
    id: 'pemuridan',
    name: 'Pemuridan',
    tagline: 'Murid yang memuridkan',
    cover: '/program/pemuridan.jpg',
    coverAlt: 'Kelompok pemuridan LevelUP duduk melingkar',
    verseRef: 'Matius 28 : 19-20',
    verse:
      'Karena itu pergilah, jadikanlah semua bangsa murid-Ku dan baptislah mereka dalam nama Bapa dan Anak dan Roh Kudus, dan ajarlah mereka melakukan segala sesuatu yang telah Kuperintahkan kepadamu. Dan ketahuilah, Aku menyertai kamu senantiasa sampai kepada akhir zaman.',
    goals: [
      'Generasi muda yang berakar kuat di dalam Kristus, bertumbuh menjadi serupa dengan-Nya, hidup menghasilkan buah, dan memuridkan orang lain',
      'Mempersiapkan murid Kristus untuk penyelesaian Amanat Agung',
    ],
    docs: [
      { src: '/program/pemuridan.jpg', caption: 'Kelompok pemuridan' },
      { src: '/about/value-unity.jpg', caption: 'Saling mendoakan' },
      { src: '/program/kota.jpg', caption: 'LevelUP Kota bersama' },
      { src: '/about/visi-pray.jpg', caption: 'Doa bersama' },
      { src: '/about/value-respect.jpg', caption: 'Foto bersama' },
      { src: '/about/value-accountable.jpg', caption: 'Bertumbuh bersama' },
    ],
  },
]

const TILT = ['-rotate-2', 'rotate-1', 'rotate-2', '-rotate-1'] as const

function Gallery({ docs }: { docs: DocPhoto[] }) {
  if (!docs.length) {
    return (
      <div className="relative mt-10 max-w-md bg-[#ffe36e] -rotate-1 px-6 pt-8 pb-7 shadow-[0_16px_22px_-14px_rgba(40,30,10,.55)]">
        <Tape seed={7} className="-top-3 left-1/2 -translate-x-1/2 -rotate-3 h-6 w-20" />
        <p className={`${MK} text-[22px] uppercase leading-tight`}>Dokumentasi segera hadir</p>
        <p className="mt-2 text-[14px] text-stone-700">Foto program dari kota-kota LevelUP bakal muncul di sini.</p>
      </div>
    )
  }
  return (
    <ul className="mt-10 columns-2 sm:columns-3 lg:columns-4 gap-4 sm:gap-6">
      {docs.map((d, j) => (
        <li key={d.src} className={`pt-3 mb-3 sm:mb-5 break-inside-avoid ${TILT[j % TILT.length]} transition duration-300 hover:rotate-0 hover:-translate-y-1`}>
          <figure className="relative bg-[#fffdf7] p-1.5 sm:p-2 pb-2.5 shadow-[0_14px_22px_-12px_rgba(40,30,10,.5)]">
            {j % 2 === 0 && <Tape seed={30 + j} className="-top-2.5 left-1/2 -translate-x-1/2 -rotate-2 h-5 w-16" />}
            {/* eslint-disable-next-line @next/next/no-img-element -- uploaded docs, unknown size; natural height for masonry */}
            <img src={d.src} alt={d.caption} loading="lazy" className="block w-full h-auto bg-stone-200" />
            <figcaption className="px-1 pt-2 text-[12px] sm:text-[13px] font-semibold leading-snug text-stone-600">{d.caption}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  )
}

export default function ProgramPage() {
  return (
    <ZinePage>
      {/* Hero */}
      <section className="relative">
        <ZineHeader />
        <div className="px-5 sm:px-8 pt-12 sm:pt-16 pb-20 max-w-6xl mx-auto">
          <div className="relative opacity-0 animate-[fadeUp_0.6s_ease_forwards]">
            <Strip tone="ink" seed={2} className="px-3.5 py-2 text-[14px] -rotate-2">
              Fokus kegiatan
            </Strip>
            <h1 className={`${MK} mt-6 text-[clamp(3.4rem,11vw,6rem)] leading-[.9] uppercase`}>
              Program <span className="inline-block text-[#e02a2f] -rotate-3">LevelUP</span>
            </h1>
            <p className="mt-6 max-w-lg text-[16px] sm:text-[17px] leading-relaxed text-stone-700">
              Dua fokus kegiatan LevelUP: <b className="text-[#161616]">Penyembahan</b> dan <b className="text-[#161616]">Pemuridan</b>. Ini dokumentasinya dari
              kota-kota LevelUP.
            </p>
            <Crown className="absolute right-[6%] -top-4 w-14 rotate-12 hidden sm:block" />
            <Smiley className="absolute right-[2%] bottom-0 w-16 h-16 -rotate-12 hidden lg:block animate-[float_7s_ease-in-out_infinite]" />
          </div>

          <div className="mt-14 grid sm:grid-cols-2 gap-10 sm:gap-8 opacity-0 animate-[fadeUp_0.6s_ease_forwards]" style={{ animationDelay: '150ms' }}>
            {PROGRAMS.map((p, i) => (
              <a
                key={p.id}
                href={`#${p.id}`}
                className={`block rounded-sm ${i ? 'rotate-[1.5deg] sm:translate-y-6' : '-rotate-[1.5deg]'} transition duration-300 hover:rotate-0 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#161616]`}
              >
                <Snap src={p.cover} alt={p.coverAlt} ratio="aspect-[16/10]" sizes="(max-width: 640px) 92vw, 540px" seed={10 + i}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Strip tone={i ? 'ink' : 'red'} seed={14 + i} className="px-3 py-2 text-[18px] -rotate-1">
                        <span className="opacity-60">{`0${i + 1}`}</span>
                        {p.name}
                      </Strip>
                      <p className="mt-3 text-[15px] font-bold text-stone-800">{p.tagline}</p>
                    </div>
                    <span className="shrink-0 pt-1 text-[13px] font-semibold text-stone-500">{p.docs.length} foto ↓</span>
                  </div>
                </Snap>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      {PROGRAMS.map((p, i) => {
        const flip = i % 2 === 1
        return (
          <section key={p.id} id={p.id} className="scroll-mt-6 px-5 sm:px-8 pb-24 max-w-6xl mx-auto">
            <Heading n={`0${i + 1}`}>{p.name}</Heading>
            <div className={`mt-10 grid items-center gap-10 ${flip ? 'lg:grid-cols-[.85fr_1.15fr]' : 'lg:grid-cols-[1.15fr_.85fr]'}`}>
              <div className={`relative ${flip ? 'lg:order-2' : ''}`}>
                <Tape seed={41 + i} className="-top-3 left-8 -rotate-6 h-7 w-24" />
                <Torn
                  seed={40 + i}
                  className={flip ? 'rotate-1' : '-rotate-1'}
                  inner="relative bg-[#fffdf7] px-6 sm:px-10 pt-12 pb-12 sm:pt-14 sm:pb-14"
                  bg="repeating-linear-gradient(transparent 0 37px, rgba(70,100,170,.16) 37px 38px)"
                >
                  <p className={`${MK} text-[clamp(1.5rem,4vw,2.2rem)] uppercase leading-tight text-[#e02a2f]`}>{p.tagline}</p>
                  <blockquote className="mt-6 text-[clamp(1.05rem,2.2vw,1.3rem)] font-extrabold leading-[1.5] tracking-[-.01em]">&ldquo;{p.verse}&rdquo;</blockquote>
                  <Strip tone="yellow" seed={44 + i} className="mt-5 px-3 py-1.5 text-[13px] -rotate-1">
                    {p.verseRef}
                  </Strip>
                  {p.note && <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-stone-700">{p.note}</p>}
                </Torn>
              </div>
              <Torn seed={46 + i} sides="tblr" amp={8} className={flip ? '-rotate-2' : 'rotate-2'} inner="relative bg-[#161616] pl-6 pr-12 sm:pl-8 sm:pr-14 py-9 sm:py-10 text-[#fbf6ec]">
                <Strip tone="yellow" seed={48 + i} className="px-3 py-1.5 text-[12.5px] -rotate-2">
                  Tujuan
                </Strip>
                <ul className="mt-5 space-y-4">
                  {p.goals.map((g) => (
                    <li key={g} className={`${MK} flex gap-3 text-[clamp(1.05rem,2.4vw,1.3rem)] leading-snug`}>
                      <span aria-hidden className="text-[#e02a2f]">
                        ✦
                      </span>
                      {g}
                    </li>
                  ))}
                </ul>
                <Heart className="absolute right-4 bottom-5 w-8 text-[#e02a2f] rotate-12" />
              </Torn>
            </div>

            <div className="mt-16 flex items-end justify-between gap-4">
              <h3 className={`${MK} relative text-[clamp(1.6rem,4.5vw,2.4rem)] leading-none uppercase`}>
                Dokumentasi
                <Brush className="-bottom-3 h-3" />
              </h3>
              <Strip tone="ink" seed={52 + i} className="shrink-0 px-3 py-2 text-[13px] rotate-2">
                {p.docs.length} foto
              </Strip>
            </div>
            <Gallery docs={p.docs} />
          </section>
        )
      })}

      {/* CTA */}
      <section className="px-5 sm:px-8 pb-16 max-w-5xl mx-auto">
        <div className="relative">
          <Tape seed={81} className="-top-3 left-6 -rotate-12 h-7 w-24" />
          <Tape seed={82} className="-top-3 right-6 rotate-12 h-7 w-24" />
          <Torn seed={86} amp={12} className="rotate-1" inner="relative bg-[#fffdf7] px-6 py-14 sm:py-16 text-center">
            <h2 className={`${MK} text-[clamp(2.2rem,7vw,4rem)] leading-[.95] uppercase`}>
              Ambil{' '}
              <span className="relative inline-block text-[#e02a2f]">
                bagian
                <Brush className="-bottom-2 h-3.5" />
              </span>
              <Dot />
            </h2>
            <p className="mt-7 text-[15.5px] text-stone-700 max-w-sm mx-auto">Ikut penyembahan dan pemuridan bareng LevelUP di kotamu.</p>
            <CtaButtons className="mt-8 justify-center" />
            <Smiley className="absolute left-4 top-6 sm:left-10 sm:top-8 w-14 h-14 -rotate-12" />
            <Heart className="absolute right-5 bottom-6 sm:right-12 sm:bottom-8 w-11 text-[#e02a2f] rotate-12" />
          </Torn>
        </div>
      </section>

      <ZineFooter />
    </ZinePage>
  )
}
