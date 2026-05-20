'use client'
import type { AnyElement, TextEl, ImageEl, ShapeEl, StickerEl } from '../lib/types'

// ── Toolbar button ────────────────────────────────────────────
export function TBtn({ icon, label, onClick, active }: {
  icon: React.ReactNode; label: string; onClick: () => void; active?: boolean
}) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[60px] ${active ? 'bg-accent-light text-accent' : 'text-fg'}`}>
      <span className="w-6 h-6 flex items-center justify-center">{icon}</span>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  )
}

// ── Idle toolbar (nothing selected) ──────────────────────────
export function IdleToolbar({ onAddText, onAddImage, onAddSticker, onChangeBg, onChangeTemplate }: {
  onAddText: () => void
  onAddImage: () => void
  onAddSticker: () => void
  onChangeBg: () => void
  onChangeTemplate: () => void
}) {
  return (
    <div className="bg-surface border-t border-border">
      <div className="max-w-md mx-auto w-full px-2 py-2 flex items-center justify-around">
        <TBtn label="Template" onClick={onChangeTemplate}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>} />
        <TBtn label="Elemen" onClick={onAddSticker}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 8 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 8 12 2"/></svg>} />
        <TBtn label="Teks" onClick={onAddText}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>} />
        <TBtn label="Galeri" onClick={onAddImage}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>} />
        <TBtn label="Latar" onClick={onChangeBg}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16l5-5 4 4 5-5 4 4"/></svg>} />
      </div>
    </div>
  )
}

// ── Text toolbar ──────────────────────────────────────────────
export function TextToolbar({ el, onEdit, onFont, onSize, onColor, onResetRot, onDuplicate, onDelete }: {
  el: TextEl
  onEdit: () => void
  onFont: () => void
  onSize: () => void
  onColor: () => void
  onResetRot: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-surface border-t border-border">
      <div className="max-w-md mx-auto w-full px-2 py-2 flex items-center gap-1 overflow-x-auto">
        <TBtn label="Edit" onClick={onEdit}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="6" height="16" rx="1"/><path d="M11 8h11M11 12h11M11 16h7"/></svg>} />
        <TBtn label="Font" onClick={onFont}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>} />
        <TBtn label={`${Math.round(el.font.size)}px`} onClick={onSize}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6 7 6 7 18"/><path d="M9 18 14 6 19 18"/><path d="M11 14 17 14"/></svg>} />
        <TBtn label="Warna" onClick={onColor}
          icon={<span style={{ width: 18, height: 18, borderRadius: 5, background: el.font.color, border: '1.5px solid #e7e5e4', display: 'inline-block' }} />} />
        <TBtn label="Reset" onClick={onResetRot}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/></svg>} />
        <TBtn label="Salin" onClick={onDuplicate}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>} />
        <TBtn label="Hapus" onClick={onDelete}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/></svg>} />
      </div>
    </div>
  )
}

// ── Image / Sticker toolbar ───────────────────────────────────
export function ImageToolbar({ el, onReplace, onFitToggle, onCrop, onResetRot, onDuplicate, onDelete }: {
  el: ImageEl
  onReplace: () => void
  onFitToggle: () => void
  onCrop: () => void
  onResetRot: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-surface border-t border-border">
      <div className="max-w-md mx-auto w-full px-2 py-2 flex items-center gap-1 overflow-x-auto">
        <TBtn label="Ganti" onClick={onReplace}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>} />
        <TBtn label={el.fit === 'cover' ? 'Cover' : 'Contain'} onClick={onFitToggle}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>} />
        <TBtn label="Crop" onClick={onCrop}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 002 2h14"/><path d="M18 22V8a2 2 0 00-2-2H2"/></svg>} />
        <TBtn label="Reset" onClick={onResetRot}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/></svg>} />
        <TBtn label="Salin" onClick={onDuplicate}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>} />
        <TBtn label="Hapus" onClick={onDelete}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/></svg>} />
      </div>
    </div>
  )
}

// ── Shape / Sticker toolbar (single colour + delete) ──────────
export function ShapeToolbar({ el, onColor, onResetRot, onDuplicate, onDelete }: {
  el: ShapeEl | StickerEl
  onColor: () => void
  onResetRot: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const color = el.type === 'shape' ? el.fill : el.color
  return (
    <div className="bg-surface border-t border-border">
      <div className="max-w-md mx-auto w-full px-2 py-2 flex items-center gap-1 overflow-x-auto">
        <TBtn label="Warna" onClick={onColor}
          icon={<span style={{ width: 18, height: 18, borderRadius: 5, background: color, border: '1.5px solid #e7e5e4', display: 'inline-block' }} />} />
        <TBtn label="Reset" onClick={onResetRot}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/></svg>} />
        <TBtn label="Salin" onClick={onDuplicate}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>} />
        <TBtn label="Hapus" onClick={onDelete}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/></svg>} />
      </div>
    </div>
  )
}

// helper: which toolbar to show
export function selectedToolbarKind(el: AnyElement | null): 'idle' | 'text' | 'image' | 'shape' {
  if (!el) return 'idle'
  if (el.type === 'text') return 'text'
  if (el.type === 'image') return 'image'
  return 'shape'
}
