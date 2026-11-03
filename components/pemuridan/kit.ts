// Drawing kit for Pemuridan stories, ported from the "Keluar tapi Gagal Masuk" design file.
// Scenes build their SVG and panel markup as strings, so every class name lives here as a literal
// for Tailwind to find. Sizes are cqw of the 9:16 story card (StoryPlayer makes it a size container).
// Plain marker classes (hot, seen, on, sel, show, gone, go...) are what the scene scripts query and toggle.

export type SceneCtx = {
  svg: SVGSVGElement
  panel: HTMLElement
  /** prefers-reduced-motion */
  rm: boolean
  done(): void
  setHint(t: string): void
}

export type Scene = {
  eyebrow: string
  t1: string
  t2: string
  color: string
  next?: string
  hint: string
  art(): string
  panel(): string
  mount?(c: SceneCtx): void | (() => void)
}

export type Story = { badge: string; label: string; scenes: Scene[] }

export const DISPLAY = 'font-[family-name:var(--font-story-display)]'
export const BODY_FONT = 'font-[family-name:var(--font-story-body)]'
export const VERSE_FONT = 'font-[family-name:var(--font-story-verse)]'
export const FOCUS = 'focus-visible:outline-3 focus-visible:outline-[#D7A23E] focus-visible:outline-offset-2'

// Panel blocks
export const BODY = 'mx-auto max-w-[80cqw] text-[length:max(12.5px,3.6cqw)] leading-[1.45] text-pretty [&_b]:font-semibold'
const VERSE_BOX = 'mx-auto w-full rounded-[3cqw] px-[3.6cqw] py-[2.6cqw] text-left'
export const VERSE = `${VERSE_BOX} max-w-[84cqw] bg-[#EFE2C8]`
export const VERSE_SPLIT = `${VERSE_BOX} [transition:opacity_.3s_ease,transform_.3s_ease]`
export const VERSE_P = `${VERSE_FONT} italic text-[length:max(12px,3.3cqw)] leading-[1.5] text-[#4E3B2D]`
export const VERSE_CITE = `${DISPLAY} mt-[1.2cqw] block text-[2.7cqw] leading-none font-bold not-italic uppercase tracking-[.14em] text-[#8E1B2E]`
export const CHIPS = 'flex flex-wrap justify-center gap-[1.6cqw]'
export const CHIP = `${DISPLAY} inline-flex items-center gap-[1.2cqw] rounded-[6cqw] bg-[rgba(62,42,30,.08)] px-[3cqw] py-[1.4cqw] text-[3.1cqw] leading-none font-bold uppercase tracking-[.06em] text-[#6B5644] [&_svg]:size-[3.2cqw] [&_svg]:opacity-25 [&.on]:bg-[#6E7B45] [&.on]:text-[#F7EFDF] [&.on_svg]:opacity-100 [&.sel]:bg-[#3E2A1E] [&.sel]:text-[#F7EFDF]`
export const CHIP_BTN = `cursor-pointer ${FOCUS}`
export const DOTS = `${DISPLAY} flex items-center justify-center gap-[1.4cqw] text-[3cqw] leading-none font-bold uppercase tracking-[.1em] text-[#6B5644] [&_i]:size-[2.4cqw] [&_i]:rounded-full [&_i]:bg-[rgba(62,42,30,.18)] [&_i.on]:bg-[#6E7B45]`
export const CARD = 'mx-auto w-full max-w-[84cqw] rounded-[3cqw] bg-[#EFE2C8] px-[3.6cqw] py-[3cqw] text-left animate-story-pop motion-reduce:animate-none'
export const CARD_H = `${DISPLAY} text-[5.4cqw] leading-none font-extrabold uppercase text-[#8E1B2E]`
export const CARD_REF = `${DISPLAY} mt-[1.2cqw] mb-[1.4cqw] inline-block text-[2.7cqw] leading-none font-bold uppercase tracking-[.12em] text-[#6B5644]`
export const CARD_P = 'text-[length:max(12.5px,3.4cqw)] leading-[1.45]'
export const CARD_LESSON = `${CARD_P} mt-[1.2cqw] font-semibold`
export const HOLD = `${DISPLAY} mx-auto flex items-center gap-[3cqw] rounded-[10cqw] bg-[#3E2A1E] py-[1.6cqw] pl-[1.6cqw] pr-[5cqw] text-[3.8cqw] leading-none font-bold uppercase tracking-[.08em] text-[#F7EFDF] cursor-pointer touch-none select-none [&_svg]:size-[12cqw] [&_svg]:flex-none [&.holding]:bg-[#5A3B2A] [&.done]:bg-[#6E7B45] ${FOCUS}`
export const HOLD_TRACK = 'fill-none stroke-[rgba(247,239,223,.18)] stroke-8'
export const HOLD_PROG = 'prog fill-none stroke-[#D7A23E] stroke-8 [stroke-linecap:round] [transform:rotate(-90deg)] [transform-origin:50px_50px]'
export const RANGE = 'mx-auto flex w-full max-w-[80cqw] flex-col gap-[1.4cqw]'
export const RANGE_LABEL = `${DISPLAY} text-[3.3cqw] leading-none font-bold uppercase tracking-[.08em] text-[#3E2A1E]`
// m-[2px] is the browser's own range margin, which the design kept (Tailwind's reset removes it).
export const RANGE_INPUT = 'm-[2px] h-[7cqw] w-full cursor-pointer accent-[#8E1B2E]'
export const SPLIT = 'mx-auto grid w-full max-w-[86cqw] grid-cols-2 gap-[2cqw]'
export const DIVE = `${DISPLAY} mx-auto inline-flex items-center gap-[1.4cqw] rounded-[6cqw] bg-[#4C82A3] px-[5cqw] py-[2cqw] text-[3.6cqw] leading-none font-bold uppercase tracking-[.1em] text-white cursor-pointer [&_svg]:size-[3.6cqw] ${FOCUS}`
export const TOGGLE = 'mx-auto grid w-full max-w-[84cqw] grid-cols-2 gap-[2cqw]'
export const TOGGLE_BTN = `${DISPLAY} rounded-[3cqw] border-2 border-transparent px-[2cqw] py-[2.4cqw] text-[3.8cqw] leading-[1.05] font-extrabold uppercase tracking-[.04em] cursor-pointer aria-pressed:border-[#3E2A1E] ${FOCUS}`
export const CHAIN = 'group mx-auto flex w-full max-w-[86cqw] flex-wrap items-center justify-center gap-x-[1.2cqw] gap-y-[1cqw]'
export const CHAIN_STEP = `${DISPLAY} rounded-[2cqw] bg-[rgba(62,42,30,.08)] px-[2.2cqw] py-[1.3cqw] text-[3cqw] leading-none font-bold uppercase tracking-[.06em] text-[#6B5644] transition-colors duration-[.4s] ease-[ease] group-[.good]:bg-[#D7A23E] group-[.good]:text-[#3E2A1E] group-[.bad]:bg-[#5B3A33] group-[.bad]:text-[#F7EFDF]`
export const CHAIN_SEP = `${DISPLAY} text-[3cqw] leading-none font-bold not-italic text-[#6B5644] opacity-50`
export const OUTCOME = 'mx-auto max-w-[82cqw] text-[length:max(12.5px,3.5cqw)] leading-[1.4] font-semibold'
export const CHECKS = 'mx-auto flex w-full max-w-[84cqw] flex-col gap-[1.6cqw]'
export const CHECK_BTN = `group flex items-center gap-[2.6cqw] rounded-[2.6cqw] bg-[#EFE2C8] px-[3cqw] py-[2.2cqw] text-left text-[length:max(12.5px,3.4cqw)] leading-[1.3] font-medium text-[#3E2A1E] cursor-pointer aria-pressed:bg-[#DDE3C2] ${FOCUS}`
export const CHECK_BOX = 'grid size-[5.4cqw] flex-none place-items-center rounded-[1.4cqw] border-2 border-[rgba(62,42,30,.35)] bg-[#F7EFDF] group-aria-pressed:border-[#6E7B45] group-aria-pressed:bg-[#6E7B45] [&_svg]:size-[3.6cqw] [&_svg]:opacity-0 group-aria-pressed:[&_svg]:opacity-100'
export const FINALE = `${DISPLAY} mx-auto max-w-[82cqw] text-[6cqw] leading-none font-extrabold uppercase text-balance text-[#6E7B45]`

// Scene SVG
export const SVD = `${DISPLAY} font-extrabold tracking-[.02em]`
export const SVB = `${BODY_FONT} font-semibold`
export const FADE = 'transition-opacity duration-[.8s] ease-[ease] motion-reduce:transition-none'
export const HOT = 'hot group cursor-pointer outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-[#D7A23E] focus-visible:outline-offset-2'
export const RING = 'fill-none stroke-[#FFF8EA] stroke-5 [transform-box:fill-box] origin-center animate-story-ring group-[.seen]:animate-none group-[.seen]:opacity-0 motion-reduce:animate-none'
export const CORE = 'fill-[#B8322E] stroke-[#FFF8EA] stroke-5 group-[.seen]:fill-[#6E7B45] group-focus-visible:stroke-[#D7A23E] group-focus-visible:stroke-8'
export const FLOW = '[stroke-dasharray:14_22] animate-story-flow motion-reduce:animate-none'
export const STREAM = '[stroke-dasharray:10_16] animate-story-stream motion-reduce:animate-none'
export const SHAKE = 'animate-story-shake motion-reduce:animate-none'
export const FLAKE = 'animate-story-fall motion-reduce:animate-none'
export const TWINKLE = '[transform-box:fill-box] origin-center animate-story-twinkle motion-reduce:animate-none'
export const WALKERS = 'opacity-0 transition-opacity duration-[1.2s] ease-[ease] [&.show]:opacity-100 [&.show_.w]:animate-story-walk motion-reduce:[&.show_.w]:animate-none'
export const FIG = 'fig group'
export const FIG_PERSON = 'transition-opacity duration-[.6s] ease-[ease] group-[.gone]:opacity-[.12] motion-reduce:transition-none'
export const CAIRN = 'opacity-0 transition-opacity duration-[.6s] ease-[ease] group-[.gone]:opacity-95 motion-reduce:transition-none'
export const STONE = 'stone opacity-0 [transform-box:fill-box] origin-center [transform:scale(.3)] [transition:opacity_.5s_ease,transform_.5s_cubic-bezier(.2,.9,.3,1.3)] [&.on]:opacity-100 [&.on]:[transform:none] motion-reduce:transition-none'
export const PAIR = '[transform-box:fill-box] origin-[50%_100%] [transition:transform_2.6s_cubic-bezier(.45,0,.25,1)] [&.go]:[transform:translateY(-318px)_scale(.42)] motion-reduce:transition-none'

export const r1 = (n: number) => Math.round(n * 10) / 10

export function shade(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255
  const t = a < 0 ? 0 : 255, p = Math.abs(a)
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b)
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

export const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'

export const q = <T extends Element = SVGElement>(root: ParentNode, sel: string) => root.querySelector(sel) as T
export const qa = <T extends Element = SVGElement>(root: ParentNode, sel: string) => [...root.querySelectorAll<T>(sel)]

const ARMS: Record<string, [string, number, number]> = {
  down: ['M26 -146 Q38 -122 35 -94', 35, -90], up: ['M26 -146 Q46 -172 48 -206', 48, -210],
  staff: ['M26 -146 Q48 -166 52 -194', 53, -197], pray: ['M26 -146 Q32 -116 8 -112', 4, -112],
  hold: ['M26 -146 Q38 -120 18 -112', 16, -110], reach: ['M26 -146 Q54 -152 72 -172', 74, -175],
  carry: ['M26 -146 Q42 -164 30 -184', 29, -187], hip: ['M26 -146 Q48 -124 30 -100', 28, -99],
}
type Arm = keyof typeof ARMS
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, a, b) => `${-parseFloat(a)} ${b}`)

export type PersonOpts = {
  robe?: string; inner?: string; band?: string; skin?: string; sleeve?: string; hair?: string
  /** Head cover colour; null for bare head. */
  cover?: string | null
  mantle?: string; beard?: string
  back?: boolean; long?: boolean; staff?: boolean; spear?: boolean; shield?: boolean; helmet?: boolean; fringe?: boolean; flip?: boolean
  shadow?: boolean
  pose?: Arm; left?: Arm; right?: Arm
  eyes?: 'open' | 'angry' | 'worried' | 'closed'
  mouth?: 'frown'
}

export function person(x: number, y: number, s: number, o: PersonOpts = {}) {
  const ink = '#3E2A1E', robe = o.robe || '#B2604A', inner = o.inner || '#E9D9B8', band = o.band || '#7A5235',
    skin = o.skin || '#E3B48C', sk2 = shade(skin, -.16), sleeve = o.sleeve || shade(robe, -.08), hair = o.hair || '#3A261A'
  const cover = o.cover === undefined ? '#F1E7D3' : o.cover
  const back = !!o.back
  const ra = o.right || (o.staff ? 'staff' : o.pose) || 'down', la = o.left || o.pose || 'down'
  const R = ARMS[ra] || ARMS.down, L = ARMS[la] || ARMS.down
  let g = ''
  if (o.shadow !== false) g += `<ellipse cx="0" cy="-2" rx="46" ry="8" fill="#3E2A1E" opacity=".13"/>`
  if (o.long && !back) g += `<path d="M-17 -192 Q-27 -160 -23 -136 L23 -136 Q27 -160 17 -192 Z" fill="${hair}"/>`
  if (o.staff) g += ra === 'up'
    ? `<path d="M50 -112 L50 -318 Q50 -338 33 -334 Q25 -330 28 -322" stroke="#7A5235" stroke-width="6" fill="none" stroke-linecap="round"/>`
    : `<path d="M55 -4 L55 -262 Q55 -282 38 -278 Q30 -274 33 -266" stroke="#7A5235" stroke-width="6" fill="none" stroke-linecap="round"/>`
  if (o.spear) g += `<path d="M58 -6 L58 -330" stroke="#5A4030" stroke-width="7" stroke-linecap="round"/><path d="M58 -376 L69 -330 L47 -330 Z" fill="#A3A7AB"/>`
  g += `<ellipse cx="-13" cy="-4" rx="10" ry="5" fill="${ink}"/><ellipse cx="13" cy="-4" rx="10" ry="5" fill="${ink}"/>`
  g += `<path d="M-11 -160 Q-30 -158 -32 -138 L-44 -10 Q0 0 44 -10 L32 -138 Q30 -158 11 -160 Z" fill="${robe}"/>`
  if (!back) g += `<path d="M-7 -156 L-12 -7 Q0 -4 12 -7 L7 -156 Z" fill="${inner}"/>`
  if (o.mantle) g += back
    ? `<path d="M-31 -142 Q-20 -160 0 -160 Q24 -160 31 -142 L39 -42 Q0 -24 -39 -42 Z" fill="${o.mantle}"/>`
    : `<path d="M-31 -142 Q-22 -160 -6 -160 Q6 -118 2 -58 Q-20 -38 -43 -18 Z" fill="${o.mantle}"/>`
  g += `<path d="M-36 -99 Q0 -93 36 -99 L36.6 -91 Q0 -85 -36.6 -91 Z" fill="${band}"/>`
  const arm = (P: [string, number, number], m: boolean) =>
    `<path d="${m ? mirror(P[0]) : P[0]}" stroke="${sleeve}" stroke-width="15" stroke-linecap="round" fill="none"/><circle cx="${m ? -P[1] : P[1]}" cy="${P[2]}" r="6.5" fill="${skin}"/>`
  g += arm(L, true) + arm(R, false)
  if (o.shield) g += `<circle cx="-44" cy="-112" r="38" fill="#8F6A30"/><circle cx="-44" cy="-112" r="27" fill="none" stroke="#D7A23E" stroke-width="4"/><circle cx="-44" cy="-112" r="7" fill="#D7A23E"/>`
  if (back) {
    if (cover) {
      g += `<path d="M-20 -186 Q-22 -211 0 -212 Q22 -211 20 -186 L27 -150 Q0 -143 -27 -150 Z" fill="${cover}"/><path d="M-19.5 -193 Q0 -187 19.5 -193" stroke="${band}" stroke-width="4" fill="none"/><path d="M0 -186 L0 -154" stroke="${shade(cover, -.12)}" stroke-width="2"/>`
    } else {
      g += `<rect x="-6" y="-172" width="12" height="16" fill="${sk2}"/><ellipse cx="0" cy="-183" rx="15" ry="17" fill="${hair}"/>`
    }
  } else {
    if (cover && !o.helmet) g += `<path d="M-19 -186 Q-22 -209 0 -210 Q22 -209 19 -186 L26 -150 Q14 -145 11 -158 L-11 -158 Q-14 -145 -26 -150 Z" fill="${cover}"/>`
    g += `<rect x="-6" y="-172" width="12" height="16" fill="${sk2}"/>`
    g += `<ellipse cx="0" cy="-183" rx="14" ry="16.5" fill="${skin}"/>`
    if (o.beard) g += `<path d="M-14.5 -186 Q-16 -160 0 -151 Q16 -160 14.5 -186 Q11 -174 0 -172.5 Q-11 -174 -14.5 -186 Z" fill="${o.beard}"/><path d="M-6.5 -174 Q0 -177.5 6.5 -174" stroke="${o.beard}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`
    else g += o.mouth === 'frown'
      ? `<path d="M-3.6 -169.5 Q0 -172.8 3.6 -169.5" stroke="#8C4A3A" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
      : `<path d="M-3.6 -172 Q0 -168.8 3.6 -172" stroke="#8C4A3A" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
    const e = o.eyes
    if (e === 'open' || e === 'angry' || e === 'worried') {
      g += `<circle cx="-5.4" cy="-184" r="1.9" fill="${ink}"/><circle cx="5.4" cy="-184" r="1.9" fill="${ink}"/>`
      if (e === 'angry') g += `<path d="M-9.5 -191.5 L-2 -188 M9.5 -191.5 L2 -188" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`
      if (e === 'worried') g += `<path d="M-9 -188 L-3 -191 M9 -188 L3 -191" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>`
    } else g += `<path d="M-8.5 -184.5 Q-5.3 -182 -2.1 -184.5 M2.1 -184.5 Q5.3 -182 8.5 -184.5" stroke="${ink}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`
    g += `<path d="M0.6 -181 Q-1.6 -176 1.4 -175.6" stroke="${sk2}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
    g += `<circle cx="-9" cy="-176.5" r="3.2" fill="#E8957F" opacity=".45"/><circle cx="9" cy="-176.5" r="3.2" fill="#E8957F" opacity=".45"/>`
    if (o.helmet) g += `<path d="M-17 -184 Q-17 -211 0 -211 Q17 -211 17 -184 L17 -180 Q0 -188 -17 -180 Z" fill="#9C7A3C"/><path d="M0 -211 L0 -226" stroke="#B8322E" stroke-width="8" stroke-linecap="round"/><path d="M-17 -184 L-15 -168 M17 -184 L15 -168" stroke="#9C7A3C" stroke-width="5" stroke-linecap="round"/>`
    else if (cover) g += `<path d="M-17.5 -184 Q-19 -206 0 -207 Q19 -206 17.5 -184 Q13 -196 0 -197 Q-13 -196 -17.5 -184 Z" fill="${cover}"/><path d="M-16 -193 Q0 -201 16 -193" stroke="${band}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    else g += `<path d="M-15 -180 Q-17 -206 0 -206 Q17 -206 15 -180 Q13 -193 0 -195 Q-13 -193 -15 -180 Z" fill="${hair}"/>`
    if (o.fringe) g += `<path d="M-13.5 -187 Q-7 -195 0 -193 Q7 -195 13.5 -187" stroke="${hair}" stroke-width="4" fill="none" stroke-linecap="round"/>`
  }
  return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${o.flip ? -s : s} ${s})">${g}</g>`
}

export function palm(x: number, y: number, s = 1, l = 1) {
  const tx = 22 * l, ty = -160
  let g = `<path d="M-7 0 Q${r1(tx * .2)} -90 ${tx - 4} ${ty} L${tx + 4} ${ty} Q${r1(tx * .2 + 12)} -90 7 0 Z" fill="#8B6B47"/>`
  for (let i = 1; i < 8; i++) { const t = i / 8, yy = ty * t, xx = tx * t * t; g += `<path d="M${r1(xx - 6)} ${r1(yy)} q6 4 12 0" stroke="#6B5034" stroke-width="2.2" fill="none" stroke-linecap="round"/>` }
  ;[[-178, 78], [-148, 92], [-114, 78], [-72, 84], [-38, 94], [-6, 80], [-206, 62]].forEach(([a, L], i) => {
    g += `<path transform="translate(${tx} ${ty}) rotate(${a}) scale(1 ${a < -90 ? -1 : 1})" d="M0 0 Q${L * .5} -20 ${L} 14 Q${L * .45} 2 0 0 Z" fill="${i % 2 ? '#5F7A42' : '#738F4E'}"/>`
  })
  return `<g transform="translate(${x} ${y}) scale(${s})">${g}</g>`
}

export const tree = (x: number, y: number, s = 1, c1 = '#8C9A55', c2 = '#6E7B45') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6 0 Q-4 -30 -10 -50 L-2 -52 Q2 -30 6 0 Z" fill="#7A5A3A"/><circle cx="-18" cy="-62" r="24" fill="${c2}"/><circle cx="14" cy="-66" r="26" fill="${c1}"/><circle cx="-2" cy="-86" r="24" fill="${c1}"/></g>`
export const cloud = (x: number, y: number, s = 1, o = .92, c = '#FFF8EC') =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}" opacity="${o}"><ellipse cx="0" cy="0" rx="58" ry="17"/><circle cx="-22" cy="-10" r="20"/><circle cx="6" cy="-20" r="26"/><circle cx="32" cy="-6" r="17"/></g>`
export const bird = (x: number, y: number, s = 1, c = '#5A4636') =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M-12 0 Q-6 -7 0 0 Q6 -7 12 0" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
export const rock = (x: number, y: number, w: number, h: number, f = '#B8916B') =>
  `<g transform="translate(${x} ${y})"><path d="M${-w / 2} 0 Q${-w / 2} ${-h * .7} ${-w * .18} ${-h} Q${w * .25} ${-h * 1.06} ${w * .46} ${-h * .5} Q${w * .55} ${-h * .1} ${w / 2} 0 Z" fill="${f}"/><path d="M${-w * .3} ${-h * .62} Q${-w * .16} ${-h * .92} ${w * .06} ${-h * .92}" stroke="${shade(f, .25)}" stroke-width="5" fill="none" stroke-linecap="round"/></g>`
// The design put the twinkle animation on the positioned path itself, and an animated CSS transform replaces the
// SVG transform attribute, so every star ended up in the top-left corner. The wrapper keeps the position.
export const star = (x: number, y: number, s = 1, c = '#F3C85C') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path class="${TWINKLE}" d="M0 -14 Q2 -2 14 0 Q2 2 0 14 Q-2 2 -14 0 Q-2 -2 0 -14 Z" fill="${c}"/></g>`
export const tent = (x: number, y: number, s: number, c: string, st?: string) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-64 0 L-8 -66 Q0 -72 8 -66 L64 0 Z" fill="${c}"/>${st ? `<path d="M-38 -30 L38 -30 M-22 -48 L22 -48" stroke="${st}" stroke-width="6"/>` : ''}<path d="M-16 0 L0 -38 L16 0 Z" fill="#4A3426"/><path d="M8 -66 L64 0 L30 0 Z" fill="#000" opacity=".1"/></g>`
export const pill = (x: number, y: number, t: string, bg: string, fg: string, fs = 24, anchor: 'start' | 'middle' | 'end' = 'start') => {
  const w = t.length * (fs * .56 + 1.5) + fs * 1.2
  const rx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x
  return `<g><rect x="${r1(rx)}" y="${y - fs * .95}" width="${r1(w)}" height="${fs * 1.6}" rx="${fs * .8}" fill="${bg}"/><text x="${r1(rx + w / 2)}" y="${y + fs * .12}" text-anchor="middle" class="${SVD}" font-size="${fs}" fill="${fg}" letter-spacing="1.5">${t}</text></g>`
}
export const calf = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-36 -40 L-33 0 M-20 -38 L-18 0 M18 -38 L20 0 M34 -40 L36 0" stroke="#B9852C" stroke-width="9" stroke-linecap="round"/><path d="M-48 -50 Q-60 -42 -60 -24" stroke="#B9852C" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="-52" rx="48" ry="22" fill="#D7A23E"/><path d="M30 -64 Q44 -88 56 -82 Q68 -74 62 -58 Q54 -50 40 -50 Z" fill="#D7A23E"/><path d="M48 -84 Q46 -98 36 -100 M58 -82 Q64 -94 74 -94" stroke="#EAC56A" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="-8" cy="-61" rx="26" ry="7" fill="#F2D27C" opacity=".75"/><circle cx="54" cy="-71" r="2.4" fill="#6B4A1A"/></g>`
export const quail = (x: number, y: number, s = 1, f = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s * f} ${s})"><ellipse rx="14" ry="8.5" fill="#8A6A4A"/><circle cx="12" cy="-6" r="6" fill="#8A6A4A"/><path d="M17 -6 L23 -4 L17 -2 Z" fill="#D7A23E"/><path d="M-6 -3 Q4 -22 12 -8 Z" fill="#6E5236"/><circle cx="13.5" cy="-7" r="1.3" fill="#2A1A12"/></g>`
export const snake = (x: number, y: number, s = 1, f = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s * f} ${s})"><path d="M0 0 C18 -16 34 16 52 0 S88 -16 104 0" stroke="#B86B32" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M0 0 C18 -16 34 16 52 0 S88 -16 104 0" stroke="#5A3A20" stroke-width="10" fill="none" stroke-dasharray="3 10"/><ellipse cx="110" cy="-2" rx="10" ry="7" fill="#B86B32"/><path d="M119 -2 L130 -4 M126 -3 L130 1" stroke="#B8322E" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="112" cy="-4" r="1.6" fill="#2A1A12"/></g>`
export const hot = (x: number, y: number, id: string, label: string, inner?: string) =>
  `<g class="${HOT}" data-id="${id}" tabindex="0" role="button" aria-label="${label}" transform="translate(${x} ${y})"><circle r="62" fill="transparent"/><circle class="${RING}" r="30"/><circle class="${CORE}" r="20"/>${inner || '<path d="M-7 0 H7 M0 -7 V7" stroke="#FFF8EA" stroke-width="3.6" stroke-linecap="round"/>'}</g>`
export const grad = (id: string, a: string, b: string, c?: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/>${c ? `<stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/>` : `<stop offset="1" stop-color="${b}"/>`}</linearGradient>`
export const SVG = (inner: string, defs = '', label = '') =>
  `<svg viewBox="0 0 900 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}"><defs>${defs}</defs>${inner}</svg>`

/** Wires every .hot element under root to fn, by click and by Enter or Space. */
export function onHot(root: ParentNode, fn: (id: string, el: SVGElement) => void) {
  qa(root, '.hot').forEach((el) => {
    const go = () => fn(el.dataset.id ?? '', el)
    el.addEventListener('click', go)
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } })
  })
}

export const B = (t: string) => `<p class="${BODY}">${t}</p>`
export const V = (t: string, r: string) => `<blockquote class="${VERSE}"><p class="${VERSE_P}">${t}</p><cite class="${VERSE_CITE}">${r}</cite></blockquote>`
export const card = (h: string, ref: string, text: string, lesson: string, hStyle = '') =>
  `<div class="${CARD}"><h3 class="${CARD_H}"${hStyle ? ` style="${hStyle}"` : ''}>${h}</h3><span class="${CARD_REF}">${ref}</span><p class="${CARD_P}">${text}</p><p class="${CARD_LESSON}">${lesson}</p></div>`
