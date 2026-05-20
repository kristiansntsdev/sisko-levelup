'use client'
import { useRef, useState } from 'react'
import type { OrgInfo, TextEl, Background } from '../lib/types'
import { DEFAULT_ORG } from '../lib/types'
import { STICKERS } from '../lib/stickers'

// ── Generic bottom-sheet shell ───────────────────────────────
export function Sheet({ open, onClose, title, children, footer }: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,14,12,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', width: '100%', maxWidth: 520,
        maxHeight: '85vh', borderRadius: '20px 20px 0 0',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 -8px 40px rgba(0,0,0,.16)',
      }}>
        {title && (
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-bold text-fg">{title}</h3>
            <button onClick={onClose}
              className="w-9 h-9 rounded-lg bg-bg border border-border text-muted flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-border">{footer}</div>}
      </div>
    </div>
  )
}

// ── Text Edit ─────────────────────────────────────────────────
export function TextEditSheet({ open, value, onChange, onClose }: {
  open: boolean
  value: string
  onChange: (text: string) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(value)
  const commit = () => { onChange(draft); onClose() }
  return (
    <Sheet open={open} onClose={onClose} title="Edit Teks"
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border font-semibold text-fg">Batal</button>
          <button onClick={commit} className="flex-[1.4] py-3 rounded-xl bg-accent text-white font-semibold">Simpan</button>
        </div>
      }>
      <div className="p-5">
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={5}
          className="w-full p-3 border border-border rounded-xl font-medium text-base outline-none focus:border-accent resize-vertical"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        />
      </div>
    </Sheet>
  )
}

// ── Font Sheet ────────────────────────────────────────────────
const FONT_FAMILIES: TextEl['font']['family'][] = ['DM Sans', 'Space Grotesk', 'Instrument Serif', 'DM Mono']
const FONT_WEIGHTS: TextEl['font']['weight'][] = [400, 500, 600, 700, 800]

export function FontSheet({ open, font, onChange, onClose }: {
  open: boolean
  font: TextEl['font']
  onChange: (font: Partial<TextEl['font']>) => void
  onClose: () => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Font">
      <div className="p-5 flex flex-col gap-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Family</div>
          <div className="grid grid-cols-2 gap-2">
            {FONT_FAMILIES.map(f => (
              <button key={f} onClick={() => onChange({ family: f })}
                className={`p-3 border-2 rounded-xl text-left ${font.family === f ? 'border-accent bg-accent-light' : 'border-border bg-surface'}`}
                style={{ fontFamily: `"${f}", sans-serif` }}>
                <div className="text-base font-semibold">{f}</div>
                <div className="text-xs text-muted">Aa Bb 123</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Weight</div>
          <div className="grid grid-cols-5 gap-2">
            {FONT_WEIGHTS.map(w => (
              <button key={w} onClick={() => onChange({ weight: w })}
                className={`py-2 border-2 rounded-lg text-sm ${font.weight === w ? 'border-accent bg-accent-light text-accent' : 'border-border'}`}
                style={{ fontWeight: w }}>
                {w}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <ToggleBtn active={font.italic} onClick={() => onChange({ italic: !font.italic })}>Italic</ToggleBtn>
          <ToggleBtn active={font.uppercase} onClick={() => onChange({ uppercase: !font.uppercase })}>UPPER</ToggleBtn>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Align</div>
          <div className="grid grid-cols-3 gap-2">
            {(['left', 'center', 'right'] as const).map(a => (
              <button key={a} onClick={() => onChange({ align: a })}
                className={`py-2 border-2 rounded-lg text-sm ${font.align === a ? 'border-accent bg-accent-light text-accent' : 'border-border'}`}>
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  )
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-3 border-2 rounded-xl text-sm font-semibold ${active ? 'border-accent bg-accent-light text-accent' : 'border-border'}`}>
      {children}
    </button>
  )
}

// ── Size / Slider Sheet ───────────────────────────────────────
export function SliderSheet({ open, title, value, min, max, step, onChange, onClose, format }: {
  open: boolean; title: string
  value: number; min: number; max: number; step?: number
  onChange: (v: number) => void
  onClose: () => void
  format?: (v: number) => string
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="p-5 flex flex-col gap-4">
        <div className="text-center text-2xl font-bold text-fg tabular-nums">
          {format ? format(value) : Math.round(value)}
        </div>
        <input type="range" min={min} max={max} step={step ?? 1} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="w-full accent-accent" />
        <div className="flex justify-between text-xs text-muted">
          <span>{format ? format(min) : min}</span>
          <span>{format ? format(max) : max}</span>
        </div>
      </div>
    </Sheet>
  )
}

// ── Color Sheet ───────────────────────────────────────────────
const PALETTE = [
  '#1c1917', '#78716c', '#fafaf9', '#ffffff',
  '#5b5bd6', '#3838a8', '#e7e7fb',
  '#dc2626', '#fca5a5', '#fee2e2',
  '#16a34a', '#86efac', '#dcfce7',
  '#ea580c', '#fdba74', '#fed7aa',
  '#0891b2', '#67e8f9', '#cffafe',
  '#9333ea', '#d8b4fe', '#f3e8ff',
  '#f59e0b', '#fcd34d', '#fef3c7',
]

export function ColorSheet({ open, title, value, onChange, onClose }: {
  open: boolean; title: string; value: string
  onChange: (color: string) => void
  onClose: () => void
}) {
  const [hex, setHex] = useState(value)
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="p-5 flex flex-col gap-4">
        <div className="grid grid-cols-8 gap-2">
          {PALETTE.map(c => (
            <button key={c} onClick={() => onChange(c)}
              className={`aspect-square rounded-xl border-2 ${value === c ? 'border-accent' : 'border-border'}`}
              style={{ background: c }}
              aria-label={c} />
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <input type="color" value={hex.startsWith('#') ? hex : '#000000'}
            onChange={e => { setHex(e.target.value); onChange(e.target.value) }}
            className="w-12 h-12 rounded-lg border border-border" />
          <input type="text" value={hex}
            onChange={e => setHex(e.target.value)}
            onBlur={() => onChange(hex)}
            placeholder="#000000"
            className="flex-1 p-3 border border-border rounded-xl font-mono text-sm outline-none focus:border-accent" />
        </div>
      </div>
    </Sheet>
  )
}

// ── Image Picker Sheet ────────────────────────────────────────
export function ImagePickerSheet({ open, onPick, onClose }: {
  open: boolean
  onPick: (src: string) => void
  onClose: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => { onPick(String(ev.target?.result || '')); onClose() }
    r.readAsDataURL(f)
  }
  return (
    <Sheet open={open} onClose={onClose} title="Pilih Gambar">
      <div className="p-5 flex flex-col gap-3">
        <button onClick={() => fileRef.current?.click()}
          className="w-full py-8 border-2 border-dashed border-border rounded-2xl flex flex-col items-center gap-2 text-muted hover:border-accent hover:text-accent">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span className="text-sm font-semibold">Upload dari perangkat</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
      </div>
    </Sheet>
  )
}

// ── Sticker Sheet ─────────────────────────────────────────────
const DEFAULT_LOGOS = [
  { src: '/LOGO MAHKOTA PPHTGD-01-01.png', label: 'Mahkota PPHTGD' },
  { src: '/Logo WW Hitam Merah.png', label: 'WW Hitam Merah' },
  { src: '/Logo WW Putih Merah.png', label: 'WW Putih Merah' },
]

const SOSMED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 72" width="1080" height="72">
  <rect width="1080" height="72" rx="36" fill="white"/>
  <rect width="1080" height="72" rx="36" fill="none" stroke="#d1d5db" stroke-width="2"/>
  <circle cx="54" cy="36" r="22" fill="#8B1A1A"/>
  <circle cx="54" cy="36" r="12" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
  <ellipse cx="54" cy="36" rx="6" ry="12" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="42" y1="36" x2="66" y2="36" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="45" y1="30" x2="63" y2="30" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="45" y1="42" x2="63" y2="42" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
  <text x="86" y="42" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="700" fill="#1c1917">levelupgen.com</text>
  <line x1="278" y1="16" x2="278" y2="56" stroke="#d1d5db" stroke-width="1.5"/>
  <circle cx="316" cy="36" r="22" fill="#8B1A1A"/>
  <rect x="305" y="25" width="22" height="22" rx="6" fill="none" stroke="white" stroke-width="1.6"/>
  <circle cx="316" cy="36" r="6" fill="none" stroke="white" stroke-width="1.6"/>
  <circle cx="325" cy="27" r="2" fill="white"/>
  <text x="348" y="42" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="700" fill="#1c1917">levelup.gen</text>
  <line x1="540" y1="16" x2="540" y2="56" stroke="#d1d5db" stroke-width="1.5"/>
  <circle cx="578" cy="36" r="22" fill="#8B1A1A"/>
  <rect x="566" y="27" width="24" height="18" rx="4" fill="white"/>
  <polygon points="574,31 588,36 574,41" fill="#8B1A1A"/>
  <text x="612" y="42" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="700" fill="#1c1917">LevelUP Generation</text>
  <line x1="802" y1="16" x2="802" y2="56" stroke="#d1d5db" stroke-width="1.5"/>
  <circle cx="840" cy="36" r="22" fill="#8B1A1A"/>
  <g transform="translate(840,36) scale(0.8)" fill="white">
    <path d="M6,-13 L6,-6 C9,-5 12,-2.5 14,-1 L14,5 C11.5,5.5 8.5,4.5 6.5,3 L6.5,10 C6.5,14.5 2.5,17 -1,15 C-4.5,13 -5,8 -2.5,5.5 C-0.5,3.5 2.5,4 3.5,5 L3.5,-1 C-2.5,-2.5 -8,2 -8,8 C-8,14 -3.5,18 2,17.5 C7.5,17 12,12 12,6.5 L12,-4 C14,-3 16.5,-1.5 19,-1 L19,-7 C16,-7 12,-9.5 11,-13 Z"/>
  </g>
  <text x="872" y="42" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="700" fill="#1c1917">levelup.pphtgd</text>
</svg>`

const SOSMED_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SOSMED_SVG)}`

export function StickerSheet({ open, kotaLogo, onPick, onPickLogo, onPickSosmed, onClose }: {
  open: boolean
  kotaLogo?: string
  onPick: (svg: string) => void
  onPickLogo: (src: string) => void
  onPickSosmed: (src: string) => void
  onClose: () => void
}) {
  const logos = kotaLogo
    ? [...DEFAULT_LOGOS, { src: kotaLogo, label: 'Logo Kota' }]
    : DEFAULT_LOGOS

  return (
    <Sheet open={open} onClose={onClose} title="Elemen">
      <div className="p-5 flex flex-col gap-5">
        {/* Social media bar */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Sosial Media</div>
          <button
            onClick={() => { onPickSosmed(SOSMED_URL); onClose() }}
            className="w-full border border-border rounded-xl bg-surface hover:border-accent transition-colors overflow-hidden p-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SOSMED_URL} alt="Social media bar" className="w-full h-auto" />
          </button>
        </div>

        {/* Logos */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Logo</div>
          <div className="grid grid-cols-4 gap-3">
            {logos.map(l => (
              <button key={l.src} onClick={() => { onPickLogo(l.src); onClose() }}
                className="aspect-square p-2 border border-border rounded-xl bg-surface hover:border-accent transition-colors flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.src} alt={l.label} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        {/* Stickers */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Stiker</div>
          <div className="grid grid-cols-4 gap-3">
            {STICKERS.map(s => (
              <button key={s.id} onClick={() => { onPick(s.svg); onClose() }}
                className="aspect-square p-3 border border-border rounded-xl text-fg hover:border-accent hover:text-accent transition-colors"
                dangerouslySetInnerHTML={{ __html: s.svg }} />
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  )
}

// ── Background Sheet ──────────────────────────────────────────
const BG_PRESETS: Background[] = [
  { kind: 'color', color: '#ffffff' },
  { kind: 'color', color: '#fafaf9' },
  { kind: 'color', color: '#1c1917' },
  { kind: 'color', color: '#5b5bd6' },
  { kind: 'gradient', from: '#5b5bd6', to: '#3838a8', angle: 160 },
  { kind: 'gradient', from: '#fca5a5', to: '#fee2e2', angle: 160 },
  { kind: 'gradient', from: '#86efac', to: '#dcfce7', angle: 160 },
  { kind: 'gradient', from: '#fcd34d', to: '#fde68a', angle: 160 },
]

export function BackgroundSheet({ open, onChange, onClose }: {
  open: boolean; value: Background
  onChange: (bg: Background) => void
  onClose: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => { onChange({ kind: 'image', src: String(ev.target?.result || ''), fit: 'cover' }); onClose() }
    r.readAsDataURL(f)
  }
  return (
    <Sheet open={open} onClose={onClose} title="Latar Belakang">
      <div className="p-5 flex flex-col gap-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Preset</div>
          <div className="grid grid-cols-4 gap-2">
            {BG_PRESETS.map((bg, i) => (
              <button key={i} onClick={() => onChange(bg)}
                className="aspect-square rounded-xl border-2 border-border"
                style={bg.kind === 'color' ? { background: bg.color }
                  : bg.kind === 'gradient' ? { background: `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})` }
                  : { background: `url(${bg.src}) center/cover` }} />
            ))}
          </div>
        </div>
        <button onClick={() => fileRef.current?.click()}
          className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-sm font-semibold text-muted hover:border-accent hover:text-accent">
          Upload background image
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
      </div>
    </Sheet>
  )
}

// ── Org Modal ─────────────────────────────────────────────────
export function OrgModal({ open, org, onChange, onClose }: {
  open: boolean; org: OrgInfo
  onChange: (org: OrgInfo) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<OrgInfo>(org)
  const save = () => { onChange(draft); onClose() }
  const reset = () => setDraft(DEFAULT_ORG)
  return (
    <Sheet open={open} onClose={onClose} title="Info Organisasi"
      footer={
        <div className="flex gap-2">
          <button onClick={reset} className="px-4 py-3 rounded-xl border border-border font-semibold text-muted">Reset</button>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border font-semibold text-fg">Batal</button>
          <button onClick={save} className="flex-[1.4] py-3 rounded-xl bg-accent text-white font-semibold">Simpan</button>
        </div>
      }>
      <div className="p-5 flex flex-col gap-3">
        <Field label="Nama organisasi" value={draft.name} onChange={v => setDraft({ ...draft, name: v })} />
        <Field label="Tagline" value={draft.tagline} onChange={v => setDraft({ ...draft, tagline: v })} />
        <Field label="Logo text (3-4 huruf)" value={draft.logoText} onChange={v => setDraft({ ...draft, logoText: v.slice(0, 4) })} mono />
        <Field label="Instagram" value={draft.instagram} onChange={v => setDraft({ ...draft, instagram: v })} mono />
        <Field label="Website" value={draft.website} onChange={v => setDraft({ ...draft, website: v })} mono />
        <Field label="Contact name" value={draft.contactName} onChange={v => setDraft({ ...draft, contactName: v })} />
        <Field label="Contact phone" value={draft.contactPhone} onChange={v => setDraft({ ...draft, contactPhone: v })} mono />
      </div>
    </Sheet>
  )
}

function Field({ label, value, onChange, mono }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-fg2">{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-accent"
        style={mono ? { fontFamily: 'DM Mono, monospace', letterSpacing: '.03em' } : undefined}
      />
    </label>
  )
}

// ── Drafts Sheet ──────────────────────────────────────────────
import type { Draft } from '../lib/types'
import { Thumbnail } from './Thumbnail'

export function DraftsSheet({ open, drafts, onPick, onDelete, onClose }: {
  open: boolean; drafts: Draft[]
  onPick: (d: Draft) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Draft Tersimpan">
      <div className="p-5">
        {drafts.length === 0 ? (
          <div className="py-10 text-center text-muted">
            <div className="text-sm font-semibold text-fg">Belum ada draft</div>
            <div className="text-xs mt-1">Simpan pamflet saat sedang mengedit untuk muncul di sini.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {drafts.map(d => (
              <div key={d.id} className="flex gap-3 items-center border border-border rounded-xl p-2.5">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0">
                  <Thumbnail doc={d.doc} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-fg truncate">{d.name}</div>
                  <div className="text-xs text-muted">
                    {new Date(d.savedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button onClick={() => onPick(d)}
                  className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold">
                  Buka
                </button>
                <button onClick={() => onDelete(d.id)}
                  className="p-2 text-muted hover:text-red-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  )
}

// ── Save Draft Sheet ──────────────────────────────────────────
export function SaveDraftSheet({ open, defaultName, onSave, onClose }: {
  open: boolean; defaultName: string
  onSave: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(defaultName)
  return (
    <Sheet open={open} onClose={onClose} title="Simpan Draft"
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border font-semibold text-fg">Batal</button>
          <button onClick={() => { onSave(name); onClose() }}
            className="flex-[1.4] py-3 rounded-xl bg-accent text-white font-semibold">Simpan</button>
        </div>
      }>
      <div className="p-5">
        <Field label="Nama draft" value={name} onChange={setName} />
      </div>
    </Sheet>
  )
}
