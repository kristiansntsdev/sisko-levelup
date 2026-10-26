import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Permanent_Marker } from 'next/font/google'
import { InstallApp } from '@/components/install-app'
import { getEventsByKotalevelup, type EventListItem } from '@/lib/actions/event'
import { EventThumb } from '@/components/pwa/ui'

const marker = Permanent_Marker({ weight: '400', subsets: ['latin'], variable: '--font-marker', display: 'swap' })

const LOGO = '/prototype/levelup-logo.png'
const PREVIEW_N = 6

/** Copy from levelupgen.com */
const TAGLINE = 'Building a Throne for God, Through the Restoration of the Tabernacle of David.'
const MINISTRIES_INTRO =
  'Sebuah kesempatan bagi kamu untuk mengambil bagian di dalam pelayanan yang tersedia sesuai dengan bakat dan talenta yang dimilikimu.'

const MINISTRIES = [
  ['WFE', 'Worship For Everyone', 'wfe'],
  ['VOL', 'Voice of LevelUP', 'voice-of-levelup'],
  ['BRIM', 'Branding & Multimedia', 'brim'],
  ['PRAYER', 'Prayer Team', 'prayer'],
  ['ICT', 'Tech & Infrastructure', 'it'],
  ['EDU', 'Education', 'education'],
  ['LLTC', '', 'lltc'],
  ['EMBUN', '', 'embun'],
] as const

const TAPE = ['Worship For Everyone', 'Voice of LevelUP', 'BRIM', 'Prayer', 'ICT', 'Education', 'The Jeremiah Generation']

const STATS = [
  { n: '28', l: 'kota LevelUP ibadah serentak', note: 'bg-[#ffe36e] -rotate-3' },
  { n: '3.789', l: 'anak muda hadir di WFE', note: 'bg-[#fffdf7] rotate-2 sm:translate-y-4' },
  { n: '603', l: 'gereja jalan bareng', note: 'bg-[#d9ccff] -rotate-1' },
] as const

const SOCIALS = [
  ['Instagram', 'https://www.instagram.com/levelup.gen/'],
  ['TikTok', 'https://www.tiktok.com/@levelup.pphtgd/'],
  ['YouTube', 'https://www.youtube.com/@LevelUPGen'],
] as const

const MK = 'font-[family-name:var(--font-marker)]'
const LIFT = 'drop-shadow-[0_5px_8px_rgba(40,30,10,.28)]'
const PRESS = 'rounded-sm transition hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#161616]'

const CRUMPLE = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='480' height='480'><filter id='c'><feTurbulence type='fractalNoise' baseFrequency='.009' numOctaves='5' seed='7' stitchTiles='stitch'/><feDiffuseLighting lighting-color='#fff' surfaceScale='3'><feDistantLight azimuth='225' elevation='55'/></feDiffuseLighting><feComponentTransfer><feFuncR type='linear' slope='.45' intercept='.6'/><feFuncG type='linear' slope='.45' intercept='.6'/><feFuncB type='linear' slope='.45' intercept='.6'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(#c)'/></svg>",
)}")`

function paper(extra?: string) {
  return { backgroundImage: extra ? `${CRUMPLE}, ${extra}` : CRUMPLE, backgroundBlendMode: 'multiply' }
}

// ponytail: deterministic pseudo-random polygon; jaggedness scales with n, not with element size
function torn(seed: number, amp: number, sides: string, n = 24) {
  const j = (i: number, on: boolean) => {
    if (!on) return '0'
    const x = Math.sin(seed * 97.13 + i * 12.9898) * 43758.5453
    return ((x - Math.floor(x)) * amp).toFixed(1)
  }
  const [t, r, b, l] = ['t', 'r', 'b', 'l'].map((s) => sides.includes(s))
  const m = 6
  const p: string[] = []
  for (let k = 0; k <= n; k++) p.push(`${((k / n) * 100).toFixed(2)}% ${j(k, t)}px`)
  for (let k = 1; k < m; k++) p.push(`calc(100% - ${j(100 + k, r)}px) ${((k / m) * 100).toFixed(2)}%`)
  for (let k = n; k >= 0; k--) p.push(`${((k / n) * 100).toFixed(2)}% calc(100% - ${j(200 + k, b)}px)`)
  for (let k = m - 1; k > 0; k--) p.push(`${j(300 + k, l)}px ${((k / m) * 100).toFixed(2)}%`)
  return `polygon(${p.join(',')})`
}

const TONES = {
  ink: 'bg-[#161616] text-[#fbf6ec]',
  red: 'bg-[#e02a2f] text-white',
  yellow: 'bg-[#ffd83d] text-[#161616]',
  paper: 'bg-[#fffdf7] text-[#161616]',
} as const

function Strip({ tone, seed = 1, className = '', children }: { tone: keyof typeof TONES; seed?: number; className?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center justify-center gap-2 ${MK} uppercase leading-none ${TONES[tone]} ${className}`} style={{ clipPath: torn(seed, 4, 'lr', 2) }}>
      {children}
    </span>
  )
}

function Tape({ seed = 5, className = '' }: { seed?: number; className?: string }) {
  return <span aria-hidden className={`absolute z-20 bg-[#efe2bd]/80 ${className}`} style={{ clipPath: torn(seed, 3, 'lr', 2) }} />
}

const Dot = () => <i className="not-italic text-[#e02a2f]">.</i>

function Crown({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M8 35 L10 12 L21 23 L30 5 L39 23 L50 12 L50 35 Z" />
      <path d="M55 9 l6 -5 M56 18 h7" />
    </svg>
  )
}

function Heart({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 46" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M24 41 C 10 31, 3 21, 7 12 C 11 4, 21 5, 24 14 C 27 5, 38 4, 41 12 C 45 21, 38 31, 24 41 C 20 37, 19 34, 22 33" />
    </svg>
  )
}

function Scribble({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" className={className} aria-hidden>
      <path d="M4 16 L28 5 M6 26 L34 13 M10 36 L36 23" />
    </svg>
  )
}

function Smiley({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`drop-shadow-[0_3px_4px_rgba(40,30,10,.3)] ${className}`} aria-hidden>
      <circle cx="32" cy="32" r="29" fill="#ffd83d" stroke="#161616" strokeWidth="2.5" />
      <ellipse cx="23" cy="25" rx="3.2" ry="5.6" fill="#161616" />
      <ellipse cx="41" cy="25" rx="3.2" ry="5.6" fill="#161616" />
      <path d="M16 36 C 22 50, 42 50, 48 36" fill="none" stroke="#161616" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M13 33 l5 4 M51 33 l-5 4" stroke="#161616" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

function Ring() {
  return (
    <svg viewBox="0 0 240 70" preserveAspectRatio="none" className="absolute -inset-x-3 -inset-y-2 w-[calc(100%+1.5rem)] h-[calc(100%+1rem)] text-[#e02a2f] pointer-events-none" aria-hidden>
      <path d="M30 14 C 90 2, 200 4, 230 24 C 244 38, 214 62, 130 64 C 60 66, 8 56, 6 36 C 4 20, 40 10, 92 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Brush({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 20" preserveAspectRatio="none" className={`absolute left-0 w-full text-[#e02a2f] ${className}`} aria-hidden>
      <path d="M4 12 C 70 5, 160 15, 296 7" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <path d="M30 16 C 120 11, 200 17, 270 13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".7" />
    </svg>
  )
}

function Torn({ seed, sides = 'tb', amp = 10, className = '', inner = '', bg, children }: { seed: number; sides?: string; amp?: number; className?: string; inner?: string; bg?: string; children: ReactNode }) {
  return (
    <div className={`${LIFT} ${className}`}>
      <div className={inner} style={{ clipPath: torn(seed, amp, sides, 56), ...paper(bg) }}>
        {children}
      </div>
    </div>
  )
}

const ticketHref = (id: number | string) => `/login?callbackUrl=${encodeURIComponent(`/join/${id}`)}`

function Collage({ events }: { events: EventListItem[] }) {
  const spots = [
    'left-[3%] top-[7%] w-[45%] -rotate-[7deg]',
    'right-[2%] top-0 w-[44%] rotate-[5deg]',
    'left-[26%] bottom-[1%] w-[46%] -rotate-1 z-10',
  ]
  const shown = events.slice(0, 3)
  return (
    <div className="relative h-[420px] sm:h-[500px] w-full max-w-[460px] mx-auto">
      <div aria-hidden className="absolute left-[8%] top-[20%] w-[78%] h-[56%] bg-[#b9a3ff] rotate-[9deg]" style={{ clipPath: torn(21, 8, 'tblr', 26) }} />
      {shown.length ? (
        shown.map((e, i) => (
          <Link
            key={e.id_event}
            href={ticketHref(e.id_event)}
            aria-label={`Get Ticket ${e.nama_event}`}
            className={`absolute ${spots[i]} bg-[#fffdf7] p-2 pb-3 shadow-[0_14px_24px_-10px_rgba(40,30,10,.5)] transition duration-300 hover:rotate-0 hover:-translate-y-2 hover:z-20`}
          >
            <Tape seed={i + 2} className="-top-3 left-1/2 -translate-x-1/2 -rotate-3 h-6 w-20" />
            <EventThumb src={e.posterUrl} className="w-full aspect-[3/4]" />
          </Link>
        ))
      ) : (
        <div className="absolute inset-x-[14%] top-[18%] -rotate-3 bg-[#e02a2f] p-8 shadow-[0_14px_24px_-10px_rgba(40,30,10,.5)]">
          <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-2 h-6 w-24" />
          <Image src={LOGO} alt="" width={623} height={243} className="w-full h-auto" />
        </div>
      )}

      <Torn seed={33} sides="tblr" amp={6} className="absolute -right-1 top-[46%] z-20 rotate-[5deg]" inner="relative bg-[#161616] pl-4 pr-10 py-3">
        <p className={`${MK} text-[15px] leading-tight uppercase text-[#fbf6ec]`}>
          Worship
          <br />
          for everyone
        </p>
        <Heart className="absolute right-2.5 bottom-2.5 w-6 text-[#e02a2f]" />
      </Torn>
      <Smiley className="absolute -left-2 bottom-[16%] z-20 w-16 h-16 sm:w-[72px] sm:h-[72px] -rotate-12 animate-[float_7s_ease-in-out_infinite]" />
      <Scribble className="absolute left-[1%] -top-2 z-20 w-12 text-[#e02a2f]" />
      <Heart className="absolute right-[10%] bottom-[4%] z-20 w-10 text-[#161616] rotate-12" />
    </div>
  )
}

function Polaroid({ e, i }: { e: EventListItem; i: number }) {
  const open = e.regState === 'OPEN'
  return (
    <div className={`relative snap-start shrink-0 w-[232px] sm:w-[252px] ${i % 2 ? 'rotate-[1.5deg]' : '-rotate-[1.5deg]'} transition duration-300 hover:rotate-0 hover:-translate-y-1`}>
      <Tape seed={i + 7} className={`-top-3 left-1/2 -translate-x-1/2 ${i % 2 ? 'rotate-3' : '-rotate-2'} h-6 w-20`} />
      <div className="bg-[#fffdf7] p-2.5 pb-4 shadow-[0_14px_22px_-12px_rgba(40,30,10,.5)]">
        <EventThumb src={e.posterUrl} className="w-full aspect-[4/5]" />
        <div className="px-1 pt-3">
          <Strip tone="yellow" seed={i + 11} className="px-2.5 py-1.5 text-[11.5px]">
            {e.category}
          </Strip>
          <p className="mt-2 text-[15px] font-extrabold leading-snug text-[#161616] line-clamp-2">{e.nama_event}</p>
          <p className="mt-1 text-[12.5px] text-stone-500">
            {e.tglRange} · {e.cabangName}
          </p>
          {open ? (
            <Link href={ticketHref(e.id_event)} className={`mt-4 block ${PRESS}`}>
              <Strip tone="red" seed={i + 17} className="w-full h-11 text-[15px]">
                Get Ticket
              </Strip>
            </Link>
          ) : (
            <span className={`mt-4 flex h-11 items-center justify-center bg-stone-100 ${MK} uppercase text-[15px] text-stone-400`}>
              {e.regState === 'FULL' ? 'Full' : 'Closed'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function CtaButtons({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <Link href="/daftar" className={`${LIFT} ${PRESS}`}>
        <Strip tone="red" seed={6} className="h-13 px-7 text-[17px] -rotate-2">
          Gabung LevelUP
        </Strip>
      </Link>
      <Link href="/login" className={`${LIFT} ${PRESS}`}>
        <Strip tone="paper" seed={8} className="h-13 px-6 text-[17px] rotate-1">
          Aku udah anggota
        </Strip>
      </Link>
    </div>
  )
}

export default async function LandingPage() {
  const { events } = await getEventsByKotalevelup('all', 1)
  const open = events.filter((e) => e.regState === 'OPEN')
  const preview = (open.length ? open : events).slice(0, PREVIEW_N)

  return (
    <main
      className={`${marker.variable} relative min-h-screen bg-[#efe8da] text-[#161616] font-[family-name:var(--font-proto)] overflow-x-hidden`}
      style={paper()}
    >
      {/* Hero */}
      <section className="relative">
        <header className="relative z-30 flex items-center justify-between px-5 sm:px-8 pt-[max(1.1rem,env(safe-area-inset-top))] max-w-6xl mx-auto">
          <span className={`relative -rotate-3 ${LIFT}`}>
            <span className="block bg-[#e02a2f] px-3 py-2" style={{ clipPath: torn(3, 4, 'tblr', 8) }}>
              <Image src={LOGO} alt="LevelUP" width={623} height={243} priority className="h-7 sm:h-8 w-auto" />
            </span>
            <Tape className="-top-2.5 left-1/2 -translate-x-1/2 rotate-2 h-5 w-14" />
          </span>
          <Link href="/login" className={`${LIFT} ${PRESS}`}>
            <Strip tone="ink" seed={9} className="h-10 px-5 text-[15px] rotate-2">
              Masuk
            </Strip>
          </Link>
        </header>

        <div className="grid lg:grid-cols-[1.1fr_.9fr] items-center gap-10 px-5 sm:px-8 pt-12 sm:pt-16 pb-14 max-w-6xl mx-auto">
          <div className="relative">
            <Crown className="absolute -top-9 left-1 w-16 sm:w-20 -rotate-12" />
            <h1
              className={`${MK} pt-4 text-[clamp(4rem,17vw,7.5rem)] leading-[.9] uppercase opacity-0 animate-[fadeUp_0.6s_ease_forwards]`}
            >
              Level{' '}
              <span className="relative inline-block text-[#e02a2f] text-[1.28em] -rotate-6 translate-y-1">UP</span>
            </h1>

            <div className="mt-5 flex flex-col items-start gap-3 opacity-0 animate-[fadeUp_0.6s_ease_forwards]" style={{ animationDelay: '120ms' }}>
              <Strip tone="ink" seed={2} className="px-5 py-3 text-[clamp(1.15rem,3.8vw,1.7rem)] -rotate-1">
                <span>
                  Doa<Dot /> Puji<Dot /> Sembah<Dot />
                </span>
              </Strip>
              <Strip tone="yellow" seed={4} className="ml-6 sm:ml-10 px-4 py-2.5 text-[clamp(.95rem,2.8vw,1.2rem)] rotate-1">
                The Jeremiah Generation
                <Crown className="w-7" />
              </Strip>
            </div>

            <p
              className="mt-7 max-w-md text-[16px] sm:text-[17px] leading-relaxed text-stone-700 opacity-0 animate-[fadeUp_0.6s_ease_forwards]"
              style={{ animationDelay: '220ms' }}
            >
              <b className="text-[#161616]">Revival will begin with young people.</b> Anak muda dari kota-kota LevelUP, jalan bareng menuju Amanat Agung 2033.
            </p>
            <div className="mt-8 opacity-0 animate-[fadeUp_0.6s_ease_forwards]" style={{ animationDelay: '320ms' }}>
              <CtaButtons />
            </div>
          </div>

          <Collage events={preview} />
        </div>
      </section>

      {/* Crossed tapes */}
      <div className="relative h-40 my-4" aria-hidden>
        <div className={`absolute inset-x-[-5%] top-4 rotate-[2.5deg] ${LIFT}`}>
          <div className="bg-[#ffd83d] py-2.5 overflow-hidden" style={{ clipPath: torn(31, 6, 'tb', 70) }}>
            <div className={`flex w-max whitespace-nowrap animate-[marquee_44s_linear_infinite_reverse] ${MK} text-[16px] uppercase`}>
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="px-4">
                  Revival will begin with young people <span className="text-[#e02a2f]">✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className={`absolute inset-x-[-5%] top-[4.5rem] -rotate-2 ${LIFT}`}>
          <div className="bg-[#161616] py-3.5 overflow-hidden" style={{ clipPath: torn(30, 7, 'tb', 70) }}>
            <div className={`flex w-max whitespace-nowrap animate-[marquee_32s_linear_infinite] ${MK} text-[20px] sm:text-[24px] uppercase text-[#fbf6ec]`}>
              {[...TAPE, ...TAPE].map((t, i) => (
                <span key={`${t}-${i}`} className="flex items-center gap-5 px-5">
                  {t}
                  <span className="text-[#e02a2f]">✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visi */}
      <section className="px-5 sm:px-8 pt-14 pb-20 max-w-5xl mx-auto">
        <div className="relative">
          <Tape seed={41} className="-top-3 left-8 -rotate-6 h-7 w-24" />
          <Tape seed={42} className="-top-3 right-10 rotate-6 h-7 w-20" />
          <Torn
            seed={40}
            className="-rotate-1"
            inner="relative bg-[#fffdf7] px-6 sm:px-14 py-14 sm:py-16"
            bg="repeating-linear-gradient(transparent 0 37px, rgba(70,100,170,.16) 37px 38px)"
          >
            <Strip tone="yellow" seed={43} className="px-3 py-2 text-[14px] -rotate-2">
              Visi kami
            </Strip>
            <p className="mt-6 text-[clamp(1.45rem,4vw,2.6rem)] font-extrabold leading-[1.25] tracking-[-.02em]">
              Setiap orang di Bumi mengalami{' '}
              <span className="bg-[linear-gradient(transparent_58%,#ffd83d_58%)] [box-decoration-break:clone] px-1">perjumpaan yang otentik</span> dengan
              Tuhan Yesus Kristus — pada{' '}
              <span className="relative inline-block whitespace-nowrap px-1">
                <span className={`${MK} font-normal text-[#e02a2f]`}>Pentakosta 2033</span>
                <Ring />
              </span>
            </p>
            <p className={`mt-9 ${MK} text-[15px] sm:text-[17px] leading-snug text-stone-600 -rotate-1`}>&ldquo;{TAGLINE}&rdquo;</p>
            <Smiley className="absolute right-3 bottom-4 sm:right-8 sm:bottom-8 w-12 h-12 sm:w-14 sm:h-14 rotate-12" />
          </Torn>
        </div>
      </section>

      {/* WFE stats */}
      <section className="px-5 sm:px-8 pb-24 max-w-6xl mx-auto">
        <h2 className={`${MK} text-[clamp(2rem,6vw,3.4rem)] leading-none uppercase`}>
          WFE <span className="text-[#e02a2f]">2023</span>
        </h2>
        <p className="mt-4 text-[15px] text-stone-700 max-w-lg">
          <b className="text-[#161616]">Worship For Everyone</b> serentak Sumpah Pemuda 2023 — anak muda lintas gereja kumpul sehati buat doa, puji, dan sembah.
        </p>
        <div className="mt-10 grid sm:grid-cols-3 gap-8 sm:gap-6">
          {STATS.map((s, i) => (
            <div key={s.n} className={`relative ${s.note} px-6 pt-8 pb-7 shadow-[0_16px_22px_-14px_rgba(40,30,10,.55)]`}>
              <Tape seed={50 + i} className={`-top-3 left-1/2 -translate-x-1/2 ${i % 2 ? 'rotate-3' : '-rotate-3'} h-6 w-20`} />
              <p className={`${MK} text-[clamp(2.8rem,8vw,3.8rem)] leading-none text-[#e02a2f]`}>{s.n}</p>
              <p className="mt-3 text-[15px] font-bold text-stone-800">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ministries */}
      <section className="px-5 sm:px-8 pb-24 max-w-6xl mx-auto">
        <div className="relative inline-block">
          <h2 className={`${MK} text-[clamp(2rem,6vw,3.4rem)] leading-[1.05] uppercase`}>
            Pilih tempatmu <span className="text-[#e02a2f]">melayani</span>
          </h2>
          <Scribble className="absolute -right-12 -top-6 w-10 text-[#e02a2f]" />
        </div>
        <p className="mt-4 max-w-lg text-[15px] text-stone-700">{MINISTRIES_INTRO}</p>
        <div className="mt-9 flex flex-wrap gap-x-4 gap-y-5">
          {MINISTRIES.map(([code, name, slug], i) => {
            const tone = (['ink', 'yellow', 'paper', 'red'] as const)[i % 4]
            return (
              <a key={code} href={`https://levelupgen.com/${slug}/`} target="_blank" rel="noopener noreferrer" className={`${LIFT} ${PRESS}`}>
                <Strip tone={tone} seed={60 + i} className={`px-4 py-3 text-[17px] ${i % 3 === 0 ? '-rotate-2' : i % 3 === 1 ? 'rotate-1' : '-rotate-1'}`}>
                  {code}
                  {name && <span className="font-[family-name:var(--font-proto)] normal-case text-[13px] font-semibold opacity-80">{name}</span>}
                </Strip>
              </a>
            )
          })}
        </div>
      </section>

      {/* Events */}
      {preview.length > 0 && (
        <section className="pb-20">
          <div className="px-5 sm:px-8 max-w-6xl mx-auto flex items-end justify-between gap-4">
            <h2 className={`${MK} relative text-[clamp(2rem,6vw,3.4rem)] leading-none uppercase`}>
              Ada event, <span className="text-[#e02a2f]">gas!</span>
              <Brush className="-bottom-3 h-3" />
            </h2>
            <Link href={`/login?callbackUrl=${encodeURIComponent('/events')}`} className={`shrink-0 ${LIFT} ${PRESS}`}>
              <Strip tone="ink" seed={70} className="px-3.5 py-2 text-[13px] rotate-2">
                Lihat semua
              </Strip>
            </Link>
          </div>
          <div className="mt-8 flex gap-6 overflow-x-auto snap-x snap-mandatory px-5 sm:px-8 scroll-px-5 sm:scroll-px-8 pt-5 pb-8 max-w-6xl mx-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {preview.map((e, i) => (
              <Polaroid key={e.id_event} e={e} i={i} />
            ))}
          </div>
          <p className="px-5 sm:px-8 max-w-6xl mx-auto text-[13px] text-stone-600">
            Get Ticket bakal minta kamu masuk dulu, abis itu langsung lanjut ambil tiket.
          </p>
        </section>
      )}

      {/* CTA */}
      <section className="px-5 sm:px-8 pb-16 max-w-5xl mx-auto">
        <div className="relative">
          <Tape seed={81} className="-top-3 left-6 -rotate-12 h-7 w-24" />
          <Tape seed={82} className="-top-3 right-6 rotate-12 h-7 w-24" />
          <Torn seed={80} amp={12} className="rotate-1" inner="relative bg-[#fffdf7] px-6 py-16 sm:py-20 text-center">
            <Crown className="mx-auto w-14 -rotate-6" />
            <h2 className={`${MK} mt-3 text-[clamp(2.3rem,7.5vw,4.6rem)] leading-[.95] uppercase`}>
              Yuk, naik level
              <br />
              <span className="relative inline-block text-[#e02a2f]">
                bareng
                <Brush className="-bottom-2 h-3.5" />
              </span>
              <Dot />
            </h2>
            <p className="mt-7 text-[15.5px] text-stone-700 max-w-sm mx-auto">Daftar gratis, dapet kartu anggota, ikut event di kotamu.</p>
            <CtaButtons className="mt-8 justify-center" />
            <div className="mt-8 mx-auto max-w-xs">
              <InstallApp />
            </div>
            <Smiley className="absolute left-4 top-6 sm:left-10 sm:top-10 w-14 h-14 -rotate-12" />
            <Heart className="absolute right-5 bottom-6 sm:right-12 sm:bottom-10 w-11 text-[#e02a2f] rotate-12" />
            <Scribble className="absolute right-8 top-8 w-9 text-[#161616]" />
          </Torn>
        </div>
      </section>

      <footer className="px-5 sm:px-8 py-8 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-stone-600">
        <span className={`${MK} text-[15px] text-[#161616]`}>
          LevelUP <span className="text-[#e02a2f]">·</span> The Jeremiah Generation
        </span>
        <nav className="flex gap-5 font-semibold text-stone-700">
          {SOCIALS.map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="hover:text-[#e02a2f] transition">
              {label}
            </a>
          ))}
          <a href="https://levelupgen.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#e02a2f] transition">
            levelupgen.com
          </a>
        </nav>
      </footer>
    </main>
  )
}
