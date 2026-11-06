'use client'
import { Anton, Space_Mono } from 'next/font/google'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { parseDob, type MemberCardData } from '@/lib/pwa-member'

// Own module, not components/pwa/ui.tsx: every Sekretariat page imports ui.tsx and would preload these fonts.
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-id-display', display: 'swap' })
const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-id-mono', display: 'swap' })

/** Defines --font-id-display and --font-id-mono for anything styled to match the card. */
export const ID_FONTS = `${anton.variable} ${spaceMono.variable}`

const CANVAS_W = 1005
const ACCENT = '#F8B801'
const INK = '#1D191A'
const DISPLAY = 'font-[family-name:var(--font-id-display)] uppercase whitespace-nowrap leading-none'
const LABEL = 'text-[#5E5853] uppercase tracking-[2px]'

// Average Anton glyph width in em. Names are free text, so display sizes shrink to fit instead of clipping.
const ANTON_EM = 0.46
export const fit = (text: string, maxWidth: number, maxSize: number) =>
  Math.min(maxSize, maxWidth / (Math.max(text.length, 1) * ANTON_EM))

// The canvas renders at ~35% on a phone, so the panel's small print is sized up from the design file's
// 10-14px (which would land at 3.5-5px on screen) to stay readable there.

// Decorative only, as in the design: encodes nothing and is never scanned (attendance uses the ticket QR).
const BARS = [
  [2, 1], [4, 2], [7, 1], [11, 1], [14, 2], [17, 2], [20, 1], [22, 2], [26, 1], [28, 1], [32, 2], [35, 4], [42, 1], [44, 3],
  [50, 1], [54, 2], [58, 1], [60, 1], [64, 4], [69, 1], [72, 1], [76, 1], [80, 1], [84, 4], [89, 1], [93, 2], [96, 1], [98, 2],
  [101, 2], [104, 2], [107, 2], [112, 2], [116, 2], [121, 2], [125, 1], [127, 4], [132, 3], [136, 1], [140, 1], [144, 2],
  [148, 3], [153, 1], [157, 1], [159, 2], [163, 1], [166, 1], [169, 2], [172, 3], [176, 4], [183, 2], [187, 1], [190, 2], [194, 2],
]

export function Sparkle({ size, fill = ACCENT, className = '' }: { size: number; fill?: string; className?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" fill={fill} />
    </svg>
  )
}

/** Placeholder until photo upload exists. */
export function Silhouette({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 190 250" className={className}>
      <circle cx="95" cy="78" r="46" fill={INK} />
      <path d="M8 250 C8 175 45 140 95 140 C145 140 182 175 182 250 Z" fill={INK} />
    </svg>
  )
}

/** Fills the frame, biased upward because faces sit above centre in most photos. */
const PHOTO_FIT = 'object-cover object-[50%_25%]'

/** Member photo, or `fallback` if none is set or it can't display (WebP needs iOS 14+). Parent must be positioned. */
export function MemberPhoto({ src, fallback }: { src?: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState<string | null>(null)
  if (!src || failed === src) return <>{fallback}</>
  // eslint-disable-next-line @next/next/no-img-element -- already sized and converted at upload; card scales by CSS transform
  return <img src={src} alt="" onError={() => setFailed(src)} className={`absolute inset-0 w-full h-full ${PHOTO_FIT}`} />
}

// Fixed-size canvas scaled to its container, so the composition is identical on every width.
// The aspect-ratio box holds the height before the first measure; the first scale is a typical phone width.
// transform, not CSS zoom: on some iPhones WebKit shrank the boxes but drew the text at full size.
function FitCanvas({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(350 / CANVAS_W)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      if (el.clientWidth) setScale(el.clientWidth / CANVAS_W)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`relative isolate w-full aspect-[1005/650] rounded-2xl overflow-hidden shadow-[0_18px_40px_-12px_rgba(40,30,10,.6)] ${onClick ? 'cursor-pointer active:scale-[.99] transition' : ''}`}
    >
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: CANVAS_W, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}

function TierStamp({ tier }: { tier: string }) {
  const lines = tier === 'LEVELUP PUSAT' ? ['LEVELUP', 'PUSAT'] : [tier]
  const size = fit(lines[0], 168, 88)
  return (
    <div className="absolute right-6 bottom-6 w-[150px] h-[150px]">
      <svg aria-hidden="true" viewBox="0 0 150 150" className="absolute inset-0 w-full h-full">
        <circle cx="75" cy="75" r="72" fill="none" stroke={INK} strokeWidth="2" />
        <circle cx="77" cy="74" r="68.5" fill="none" stroke={INK} strokeWidth="1.2" opacity="0.7" />
        <circle cx="75" cy="75" r="38" fill="none" stroke={INK} strokeWidth="1.5" />
        <circle cx="75" cy="75" r="3" fill={INK} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <p className={`${DISPLAY} text-[#F8B801] text-center -rotate-10`} style={{ fontSize: size }}>
          {lines.map((l) => (
            <span key={l} className="block">{l}</span>
          ))}
        </p>
      </div>
    </div>
  )
}

export function MemberCard({ m, onClick }: { m: MemberCardData; onClick?: () => void }) {
  const fullName = m.name.replace(/^\S+\.\s/, '').trim()
  const [first = '', ...others] = fullName.split(/\s+/)
  const rest = others.join(' ')
  const dob = parseDob(m.dob)
  const serial = m.no.match(/\d+$/)?.[0]?.padStart(2, '0')
  const hasCity = m.city && m.city !== '—'

  return (
    <FitCanvas onClick={onClick}>
      <div
        className={`${ID_FONTS} relative w-[1005px] h-[650px] overflow-hidden bg-[#1A1718] text-[#1D191A] font-[family-name:var(--font-id-mono)] select-none`}
      >
        {/* Photo */}
        <div className="absolute left-16 top-[100px] w-[300px] h-[392px] -rotate-5 p-2.5 rounded-[22px] bg-[#F4F1EA] shadow-[0_16px_34px_rgba(0,0,0,0.5)]">
          <div className="relative h-full rounded-[14px] overflow-hidden bg-[#F8B801]">
            <MemberPhoto src={m.photo} fallback={<Silhouette className="absolute left-[15px] -bottom-1.5 w-[250px] h-[310px]" />} />
            {/* On a photo, dark text over a dark area would vanish, so it gets a paper backing */}
            {serial && <p className={`${DISPLAY} absolute right-3.5 top-1.5 text-[46px] ${m.photo ? 'bg-[#F4F1EA] rounded px-2 py-1 text-[34px]' : ''}`}>#{serial}</p>}
          </div>
        </div>

        {/* Birth date sticker + tape; most new members have no date yet */}
        {dob && (
          <>
            <div className={`${DISPLAY} absolute left-[26px] top-[62px] -rotate-6 pt-2 px-4 pb-1.5 rounded bg-[#F4F1EA] shadow-[0_6px_14px_rgba(0,0,0,0.4)] text-[28px] leading-[1.1] tracking-[1px]`}>
              {dob.short}
            </div>
            <div aria-hidden="true" className="absolute left-[52px] top-11 w-[82px] h-[26px] -rotate-8 bg-[#F8B801]/85" />
          </>
        )}

        <Sparkle size={38} className="absolute left-[374px] top-[104px]" />
        <Sparkle size={18} fill="#F4F1EA" className="absolute left-[402px] top-[152px]" />

        {/* Name, torn paper */}
        <div className="absolute left-7 top-[438px] -rotate-3 origin-top-left flex flex-col items-start">
          <div className="drop-shadow-[0_10px_14px_rgba(0,0,0,0.5)]">
            <div className="pt-3.5 px-4 pb-2.5 bg-[#F4F1EA] [clip-path:polygon(0_5%,8%_0,38%_3%,70%_0,100%_4%,98%_52%,100%_96%,62%_100%,28%_97%,3%_100%,1%_50%)]">
              <p className={`${DISPLAY} text-[#F8B801] [-webkit-text-stroke:4px_#1D191A] [paint-order:stroke_fill]`} style={{ fontSize: fit(first, 350, 94) }}>
                {first}
              </p>
            </div>
          </div>
          {rest && (
            <p className={`${DISPLAY} ml-[57px] text-[#F8B801] [-webkit-text-stroke:3px_#1D191A] [paint-order:stroke_fill]`} style={{ fontSize: fit(rest, 330, 58) }}>
              {rest}
            </p>
          )}
        </div>

        {/* ID panel */}
        <div className="absolute left-[426px] top-[66px] w-[516px] h-[524px] pt-[22px] px-9 pb-6 rounded-[14px] bg-[#F1ECE1] shadow-[0_18px_40px_rgba(0,0,0,0.5)] flex flex-col">
          <div className="absolute right-7 -top-[34px] min-w-[176px] h-10 pt-2 px-4 rounded-t-xl bg-[#F1ECE1] text-[17px] font-bold tracking-[2px] text-center uppercase whitespace-nowrap">
            ID – {m.no}
          </div>
          <div aria-hidden="true" className="absolute -left-[30px] -top-2 w-[108px] h-[30px] -rotate-38 bg-[#F8B801]/85" />
          <div aria-hidden="true" className="absolute -right-7 -bottom-3.5 w-[108px] h-[30px] -rotate-38 bg-[#F8B801]/85 z-2" />

          <div className="flex justify-between items-center pb-3 border-b-2 border-dotted border-[#1D191A]/40">
            <div className={`${DISPLAY} pt-1.5 px-2.5 pb-1 bg-[#F8B801] -rotate-1 text-[40px] tracking-[.5px]`}>LEVEL UP</div>
            <p className="text-[18px] leading-[1.3] tracking-[1.5px] text-[#5E5853] text-right uppercase">
              Kartu Anggota
              <br />
              Member Card
            </p>
          </div>

          <p className={`mt-7 text-[17px] ${LABEL}`}>Full name</p>
          <p className={`${DISPLAY} mt-1 self-start pb-0.5 border-b-[3px] border-[#1D191A] leading-[1.05] tracking-[.5px]`} style={{ fontSize: fit(fullName, 444, 46) }}>
            {fullName}
          </p>
          {hasCity && (
            <p className={`${DISPLAY} mt-2 self-start -skew-x-12 origin-bottom-left text-[#F8B801]`} style={{ fontSize: fit(m.city, 430, 35) }}>
              {m.city}
            </p>
          )}

          {/* Column widths fit "12 SEPTEMBER 2004" and "USUALLY CALLED" at this size */}
          <div className="mt-7 grid grid-cols-[170px_minmax(0,1fr)] gap-x-7 uppercase">
            <div className="flex flex-col gap-1.5 min-w-0">
              <p className="text-[21px] font-bold tracking-[1px] truncate">{first}</p>
              <div className="h-0.5 bg-[#1D191A]" />
              <p className={`text-[16px] ${LABEL}`}>Usually called</p>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <p className="text-[21px] font-bold tracking-[1px] truncate">{dob?.long ?? (m.dob || '—')}</p>
              <div className="h-0.5 bg-[#1D191A]" />
              <p className={`text-[16px] ${LABEL}`}>Birth</p>
            </div>
          </div>

          <p className="mt-[22px] w-[300px] text-[22px] leading-[1.4] text-[#2B2627]">Bersatu mengerjakan Amanat Agung!</p>

          <div className="mt-auto w-[248px] flex flex-col gap-1.5">
            <svg aria-hidden="true" width="248" height="44" viewBox="0 0 200 40" preserveAspectRatio="none" fill={INK}>
              {BARS.map(([x, w]) => (
                <rect key={x} x={x} y="0" width={w} height="40" />
              ))}
            </svg>
            <div className={`flex justify-between text-[16px] ${LABEL}`}>
              <span>Project by</span>
              <span className="text-[#1D191A]">LevelUP</span>
            </div>
          </div>

          <TierStamp tier={m.tier} />
        </div>
      </div>
    </FitCanvas>
  )
}
