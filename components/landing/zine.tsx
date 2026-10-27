import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Permanent_Marker } from 'next/font/google'

const marker = Permanent_Marker({ weight: '400', subsets: ['latin'], variable: '--font-marker', display: 'swap' })

export const LOGO = '/prototype/levelup-logo.png'

const SOCIALS = [
  ['Instagram', 'https://www.instagram.com/levelup.gen/'],
  ['TikTok', 'https://www.tiktok.com/@levelup.pphtgd/'],
  ['YouTube', 'https://www.youtube.com/@LevelUPGen'],
] as const

export const MK = 'font-[family-name:var(--font-marker)]'
export const LIFT = 'drop-shadow-[0_5px_8px_rgba(40,30,10,.28)]'
export const PRESS = 'rounded-sm transition hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#161616]'

const CRUMPLE = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='480' height='480'><filter id='c'><feTurbulence type='fractalNoise' baseFrequency='.009' numOctaves='5' seed='7' stitchTiles='stitch'/><feDiffuseLighting lighting-color='#fff' surfaceScale='3'><feDistantLight azimuth='225' elevation='55'/></feDiffuseLighting><feComponentTransfer><feFuncR type='linear' slope='.45' intercept='.6'/><feFuncG type='linear' slope='.45' intercept='.6'/><feFuncB type='linear' slope='.45' intercept='.6'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(#c)'/></svg>",
)}")`

export function paper(extra?: string) {
  return { backgroundImage: extra ? `${CRUMPLE}, ${extra}` : CRUMPLE, backgroundBlendMode: 'multiply' }
}

// ponytail: deterministic pseudo-random polygon; jaggedness scales with n, not with element size
export function torn(seed: number, amp: number, sides: string, n = 24) {
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

export type Tone = keyof typeof TONES

export function Strip({ tone, seed = 1, className = '', children }: { tone: Tone; seed?: number; className?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center justify-center gap-2 ${MK} uppercase leading-none ${TONES[tone]} ${className}`} style={{ clipPath: torn(seed, 4, 'lr', 2) }}>
      {children}
    </span>
  )
}

export function Tape({ seed = 5, className = '' }: { seed?: number; className?: string }) {
  return <span aria-hidden className={`absolute z-20 bg-[#efe2bd]/80 ${className}`} style={{ clipPath: torn(seed, 3, 'lr', 2) }} />
}

export const Dot = () => <i className="not-italic text-[#e02a2f]">.</i>

export function Crown({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M8 35 L10 12 L21 23 L30 5 L39 23 L50 12 L50 35 Z" />
      <path d="M55 9 l6 -5 M56 18 h7" />
    </svg>
  )
}

export function Heart({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 46" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M24 41 C 10 31, 3 21, 7 12 C 11 4, 21 5, 24 14 C 27 5, 38 4, 41 12 C 45 21, 38 31, 24 41 C 20 37, 19 34, 22 33" />
    </svg>
  )
}

export function Scribble({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" className={className} aria-hidden>
      <path d="M4 16 L28 5 M6 26 L34 13 M10 36 L36 23" />
    </svg>
  )
}

export function Smiley({ className = '' }: { className?: string }) {
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

export function Ring() {
  return (
    <svg viewBox="0 0 240 70" preserveAspectRatio="none" className="absolute -inset-x-3 -inset-y-2 w-[calc(100%+1.5rem)] h-[calc(100%+1rem)] text-[#e02a2f] pointer-events-none" aria-hidden>
      <path d="M30 14 C 90 2, 200 4, 230 24 C 244 38, 214 62, 130 64 C 60 66, 8 56, 6 36 C 4 20, 40 10, 92 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Brush({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 20" preserveAspectRatio="none" className={`absolute left-0 w-full text-[#e02a2f] ${className}`} aria-hidden>
      <path d="M4 12 C 70 5, 160 15, 296 7" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <path d="M30 16 C 120 11, 200 17, 270 13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".7" />
    </svg>
  )
}

export function Torn({ seed, sides = 'tb', amp = 10, className = '', inner = '', bg, children }: { seed: number; sides?: string; amp?: number; className?: string; inner?: string; bg?: string; children: ReactNode }) {
  return (
    <div className={`${LIFT} ${className}`}>
      <div className={inner} style={{ clipPath: torn(seed, amp, sides, 56), ...paper(bg) }}>
        {children}
      </div>
    </div>
  )
}

export function CtaButtons({ className = '' }: { className?: string }) {
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

export function ZinePage({ children }: { children: ReactNode }) {
  return (
    <main
      className={`${marker.variable} relative min-h-screen bg-[#efe8da] text-[#161616] font-[family-name:var(--font-proto)] overflow-x-hidden`}
      style={paper()}
    >
      {children}
    </main>
  )
}

export function ZineHeader() {
  return (
    <header className="relative z-30 flex items-center justify-between gap-3 px-5 sm:px-8 pt-[max(1.1rem,env(safe-area-inset-top))] max-w-6xl mx-auto">
      <Link href="/" aria-label="LevelUP beranda" className={`relative -rotate-3 ${LIFT} ${PRESS}`}>
        <span className="block bg-[#e02a2f] px-3 py-2" style={{ clipPath: torn(3, 4, 'tblr', 8) }}>
          <Image src={LOGO} alt="LevelUP" width={623} height={243} priority className="h-7 sm:h-8 w-auto" />
        </span>
        <Tape className="-top-2.5 left-1/2 -translate-x-1/2 rotate-2 h-5 w-14" />
      </Link>
      <nav className="flex items-center gap-2.5 sm:gap-3">
        <Link href="/about" className={`${LIFT} ${PRESS}`}>
          <Strip tone="paper" seed={12} className="h-10 px-4 sm:px-5 text-[14px] sm:text-[15px] -rotate-1">
            Tentang
          </Strip>
        </Link>
        <Link href="/login" className={`${LIFT} ${PRESS}`}>
          <Strip tone="ink" seed={9} className="h-10 px-4 sm:px-5 text-[14px] sm:text-[15px] rotate-2">
            Masuk
          </Strip>
        </Link>
      </nav>
    </header>
  )
}

export function ZineFooter() {
  return (
    <footer className="px-5 sm:px-8 py-8 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-stone-600">
      <span className={`${MK} text-[15px] text-[#161616]`}>
        LevelUP <span className="text-[#e02a2f]">·</span> The Jeremiah Generation
      </span>
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-semibold text-stone-700">
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
  )
}
