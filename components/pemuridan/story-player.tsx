'use client'
import { Barlow, Barlow_Condensed, Literata } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Icon } from '@/components/pwa/ui'
import { progressKey } from '@/lib/pemuridan'
import { BODY_FONT, DISPLAY, FOCUS, type Story } from './kit'
import { STORIES } from './stories'

// Layout from the design: one 9:16 story card centred on a desert-night backdrop, art in the top 58%,
// parchment panel in the bottom 45%. The card is a size container, so everything inside scales with its width.
const display = Barlow_Condensed({ weight: ['600', '700', '800'], subsets: ['latin'], variable: '--font-story-display', display: 'swap' })
const body = Barlow({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--font-story-body', display: 'swap' })
const verse = Literata({ style: 'italic', axes: ['opsz'], subsets: ['latin'], variable: '--font-story-verse', display: 'swap' })

const META = `${DISPLAY} rounded-[4cqw] bg-[rgba(247,239,223,.9)] px-[2.3cqw] py-[1.1cqw] text-[2.6cqw] leading-none font-bold tracking-[.14em] text-[#3E2A1E]`
const RULE = 'before:h-[2px] before:w-[5.5cqw] before:flex-none before:bg-[#3E2A1E] before:opacity-50 before:content-[\'\'] after:h-[2px] after:w-[5.5cqw] after:flex-none after:bg-[#3E2A1E] after:opacity-50 after:content-[\'\']'
const SPRIG = 'pointer-events-none absolute top-[-8.5cqw] h-auto w-[11cqw]'

const noSubscribe = () => () => {}

/** Saved part, overridden by ?s= so a part can be linked directly. */
function startScene(n: number, key: string) {
  let start = 0
  try {
    const v = parseInt(localStorage.getItem(key) ?? '', 10)
    if (v >= 0 && v < n) start = v
  } catch {}
  const s = new URLSearchParams(location.search).get('s')
  if (s !== null && !isNaN(+s)) start = Math.max(0, Math.min(n - 1, +s))
  return start
}

type View = { cur: number; visit: number }
const stepped = (v: View, d: 1 | -1, n: number): View => (v.cur + d < 0 || v.cur + d >= n ? v : { cur: v.cur + d, visit: v.visit + 1 })

export function StoryPlayer({ slug, backHref }: { slug: string; backHref: string }) {
  // The start part comes from localStorage, so the card only renders in the browser.
  const client = useSyncExternalStore(noSubscribe, () => true, () => false)
  const story = STORIES[slug]
  if (!story) throw new Error(`Pemuridan story "${slug}" is missing from components/pemuridan/stories.ts`)

  return (
    <div
      className={`${display.variable} ${body.variable} ${verse.variable} ${BODY_FONT} fixed inset-0 z-40 flex flex-col overflow-hidden overscroll-none bg-[#2A1A17] bg-[radial-gradient(120%_80%_at_50%_0%,#4A2A24_0%,#2A1A17_55%,#1C1210_100%)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-[#F7EFDF] [color-scheme:dark]`}
    >
      <header className="flex h-12 shrink-0 items-center gap-3 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))]">
        <Link href={backHref} aria-label="Kembali ke Pemuridan" className={`grid size-10 place-items-center rounded-full bg-[#F7EFDF]/10 ring-1 ring-[#F7EFDF]/15 ${FOCUS}`}>
          <Icon name="chevronLeft" className="h-5 w-5" sw={2.4} />
        </Link>
        <span className={`${DISPLAY} text-[13px] font-bold uppercase tracking-[.18em] text-[#F7EFDF]/70`}>Pemuridan</span>
      </header>
      <div className="flex min-h-0 flex-1 items-center justify-center pt-1 pb-3 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] [container-type:size]">
        {client && <Stage story={story} storageKey={progressKey(slug)} />}
      </div>
    </div>
  )
}

function Stage({ story, storageKey }: { story: Story; storageKey: string }) {
  const N = story.scenes.length
  // visit changes on every navigation, so hint and ready from a scene's earlier visit don't carry over.
  const [view, setView] = useState<View>(() => ({ cur: startScene(N, storageKey), visit: 0 }))
  const [hint, setHint] = useState<{ visit: number; text: string } | null>(null)
  const [readyVisit, setReadyVisit] = useState(-1)
  const artRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<HTMLDivElement>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const s = story.scenes[view.cur]
  const last = view.cur === N - 1

  const go = (i: number) => setView((v) => ({ cur: (i + N) % N, visit: v.visit + 1 }))
  const step = (d: 1 | -1) => setView((v) => stepped(v, d, N))

  // Scenes draw and wire their own markup; React only owns the chrome around them.
  useEffect(() => {
    const art = artRef.current!, pan = panRef.current!
    const scene = story.scenes[view.cur]
    const visit = view.visit
    art.innerHTML = scene.art()
    pan.innerHTML = scene.panel()
    pan.scrollTop = 0
    const cleanup = scene.mount?.({
      // Explicit type: jodit's global HTMLElementTagNameMap maps 'svg' to HTMLElement.
      svg: art.querySelector<SVGSVGElement>('svg')!,
      panel: pan,
      rm: matchMedia('(prefers-reduced-motion: reduce)').matches,
      done: () => setReadyVisit(visit),
      setHint: (text) => setHint({ visit, text }),
    })
    try {
      localStorage.setItem(storageKey, String(view.cur))
    } catch {}
    return () => {
      try {
        cleanup?.()
      } catch {}
    }
  }, [view, story, storageKey])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName?.toLowerCase() === 'input' || t.getAttribute?.('role') === 'slider') return
      if (e.key === 'ArrowRight') { e.preventDefault(); setView((v) => stepped(v, 1, N)) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setView((v) => stepped(v, -1, N)) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [N])

  return (
    <main
      aria-label={story.label}
      className="relative aspect-[9/16] w-[min(100cqw,calc(100cqh*9/16))] max-w-full flex-none overflow-hidden rounded-[18px] bg-[#F7EFDF] shadow-[0_30px_80px_rgba(0,0,0,.45),0_0_0_1px_rgba(247,239,223,.08)] [container-type:size]"
    >
      <div
        ref={artRef}
        className="absolute inset-x-0 top-0 h-[58%] overflow-hidden bg-[#EADBBE] [&>svg]:block [&>svg]:size-full [&>svg]:touch-manipulation [&>svg]:select-none [&>svg]:animate-story-enter motion-reduce:[&>svg]:animate-none"
      />
      <Image
        src="/pemuridan/wp-logo.png"
        alt=""
        aria-hidden
        width={183}
        height={195}
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-[5.6cqw] z-[2] h-auto w-[10.5cqw] max-w-full -translate-x-1/2 select-none opacity-55 drop-shadow-[0_0_1.4cqw_rgba(255,248,234,.55)]"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] flex flex-col gap-[1.2cqw] px-[3.4cqw] pt-[2.4cqw]">
        <div className="pointer-events-auto flex gap-[.9cqw]">
          {story.scenes.map((sc, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Bagian ${i + 1}: ${sc.t1}`}
              aria-current={i === view.cur ? 'step' : undefined}
              onClick={() => go(i)}
              className="min-w-0 flex-1 cursor-pointer py-[1.1cqw] focus-visible:rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#D7A23E]"
            >
              <i className={`block h-[.95cqw] rounded-[1cqw] ${i < view.cur ? 'bg-[#3E2A1E]' : i === view.cur ? 'bg-[#8E1B2E]' : 'bg-[rgba(62,42,30,.22)]'}`} />
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className={META}>{story.badge}</span>
          <span className={META}>
            {view.cur + 1} / {N}
          </span>
        </div>
      </div>

      <section
        className="absolute inset-x-0 bottom-0 z-[3] flex h-[45%] flex-col text-[#3E2A1E]"
        onPointerDown={(e) => {
          if ((e.target as Element).closest('button,input')) return
          swipe.current = { x: e.clientX, y: e.clientY }
        }}
        onPointerUp={(e) => {
          const st = swipe.current
          if (!st) return
          swipe.current = null
          const dx = e.clientX - st.x, dy = e.clientY - st.y
          if (Math.abs(dx) > 60 && Math.abs(dy) < 50) step(dx < 0 ? 1 : -1)
        }}
      >
        <div className="absolute inset-x-0 top-[2.6cqw] bottom-0 bg-[#F7EFDF]" />
        <svg className="absolute left-0 top-[-.4cqw] block h-[3.6cqw] w-full" viewBox="0 0 900 40" preserveAspectRatio="none" aria-hidden>
          <path d="M0 40 L0 24 Q70 8 150 18 Q250 32 350 16 Q450 2 550 18 Q660 34 770 14 Q845 2 900 16 L900 40 Z" fill="#F7EFDF" />
        </svg>
        <Sprig className={`${SPRIG} left-[1cqw] -rotate-[14deg]`} />
        <Sprig className={`${SPRIG} right-[1cqw] [transform:scaleX(-1)_rotate(-14deg)]`} />

        <div className="relative flex min-h-0 flex-1 flex-col gap-[1.4cqw] px-[5cqw] pt-[5cqw] pb-[3.4cqw] text-center">
          <p className={`${DISPLAY} text-[2.7cqw] leading-none font-semibold uppercase tracking-[.18em] text-[#6B5644]`}>{s.eyebrow}</p>
          <h1 className={`${DISPLAY} text-[11cqw] leading-[.9] font-extrabold uppercase text-balance`} style={{ color: s.color }}>
            {s.t1}
          </h1>
          <p className={`${DISPLAY} flex items-center justify-center gap-[2.4cqw] text-[4.2cqw] leading-[1.05] font-bold uppercase tracking-[.06em] text-balance ${RULE}`}>{s.t2}</p>
          <div
            ref={panRef}
            className="flex min-h-0 flex-1 flex-col gap-[2.2cqw] overflow-y-auto overscroll-contain px-[.4cqw] pt-[1.4cqw] pb-[1cqw] [scrollbar-color:rgba(62,42,30,.3)_transparent] [scrollbar-width:thin]"
          />
          <div className="flex items-center gap-[2.2cqw] border-t border-[rgba(62,42,30,.12)] pt-[1.2cqw]">
            <button
              type="button"
              aria-label="Bagian sebelumnya"
              disabled={view.cur === 0}
              onClick={() => step(-1)}
              className={`grid size-[10.5cqw] flex-none cursor-pointer place-items-center rounded-full border-2 border-[rgba(62,42,30,.22)] disabled:cursor-default disabled:opacity-30 [&_svg]:size-[4.4cqw] ${FOCUS}`}
            >
              <Chevron d="M15 5l-7 7 7 7" />
            </button>
            <p className="flex min-w-0 flex-1 items-center gap-[1.6cqw] text-left text-[length:max(11px,2.9cqw)] leading-[1.3] font-medium text-[#6B5644] before:size-[1.9cqw] before:flex-none before:animate-story-blink before:rounded-full before:bg-[#B8322E] before:content-[''] motion-reduce:before:animate-none">
              {hint?.visit === view.visit ? hint.text : s.hint}
            </p>
            <button
              type="button"
              aria-label={last ? 'Ulangi cerita dari awal' : 'Bagian berikutnya'}
              onClick={() => go(last ? 0 : view.cur + 1)}
              className={`${DISPLAY} inline-flex h-[10.5cqw] flex-none cursor-pointer items-center gap-[1cqw] rounded-[6cqw] bg-[#8E1B2E] pr-[3.6cqw] pl-[5cqw] text-[4cqw] leading-none font-bold uppercase tracking-[.1em] text-[#F7EFDF] [&_svg]:size-[4.4cqw] ${
                readyVisit === view.visit ? 'animate-story-glow motion-reduce:animate-none' : ''
              } ${FOCUS}`}
            >
              <span>{s.next || 'Lanjut'}</span>
              <Chevron d="M9 5l7 7-7 7" />
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

function Chevron({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}

function Sprig({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 60 100" aria-hidden>
      <path d="M32 98 Q26 60 36 6" stroke="#6E7B45" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <g fill="#7F8B4F">
        <ellipse cx="22" cy="78" rx="11" ry="4.6" transform="rotate(-30 22 78)" />
        <ellipse cx="42" cy="66" rx="11" ry="4.6" transform="rotate(32 42 66)" />
        <ellipse cx="22" cy="50" rx="11" ry="4.6" transform="rotate(-36 22 50)" />
        <ellipse cx="44" cy="38" rx="10" ry="4.4" transform="rotate(30 44 38)" />
        <ellipse cx="26" cy="24" rx="9" ry="4" transform="rotate(-40 26 24)" />
      </g>
      <g fill="#9AA466">
        <ellipse cx="40" cy="14" rx="8" ry="3.6" transform="rotate(28 40 14)" />
        <ellipse cx="44" cy="88" rx="10" ry="4.4" transform="rotate(30 44 88)" />
      </g>
    </svg>
  )
}
