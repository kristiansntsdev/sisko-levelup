// Separate from zine.tsx so pages can use the paper look without preloading its Permanent Marker font.
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
