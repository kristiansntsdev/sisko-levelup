'use client'
import { useCallback, useRef, useState } from 'react'
import type { PamfletDoc, AnyElement, TextEl, ImageEl, StickerEl } from '../lib/types'
import { uid } from '../lib/types'
import { EditorCanvas, type EditorCanvasHandle } from './EditorCanvas'
import { IdleToolbar, TextToolbar, ImageToolbar, ShapeToolbar, selectedToolbarKind } from './Toolbars'
import {
  TextEditSheet, FontSheet, SliderSheet, ColorSheet,
  ImagePickerSheet, StickerSheet, BackgroundSheet,
} from './Sheets'

interface Props {
  doc: PamfletDoc
  setDoc: (updater: (doc: PamfletDoc) => PamfletDoc) => void
  kotaLogo: string
  onBack: () => void
  onSave: () => void
  onSwitchTemplate: () => void
  showToast: (msg: string, kind?: 'success' | 'error') => void
}

type SheetKind =
  | null
  | { kind: 'text-edit' }
  | { kind: 'font' }
  | { kind: 'size' }
  | { kind: 'color-text' }
  | { kind: 'color-shape' }
  | { kind: 'image-pick' }
  | { kind: 'image-replace' }
  | { kind: 'sticker' }
  | { kind: 'bg' }

export function Editor({ doc, setDoc, kotaLogo, onBack, onSave, onSwitchTemplate, showToast }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [exporting, setExporting] = useState(false)
  const [cropping, setCropping] = useState(false)
  const [drawMode, setDrawMode] = useState(false)
  const canvasRef = useRef<EditorCanvasHandle>(null)

  const selected = selectedId ? doc.elements.find(e => e.id === selectedId) ?? null : null

  // ── Mutations ──────────────────────────────────────────────
  const patchEl = useCallback(<T extends AnyElement>(id: string, patch: Partial<T>) => {
    setDoc(d => ({
      ...d,
      elements: d.elements.map(e => e.id === id ? ({ ...e, ...patch } as AnyElement) : e),
    }))
  }, [setDoc])

  const patchFont = useCallback((id: string, patch: Partial<TextEl['font']>) => {
    setDoc(d => ({
      ...d,
      elements: d.elements.map(e => e.id === id && e.type === 'text'
        ? ({ ...e, font: { ...e.font, ...patch } } as TextEl)
        : e),
    }))
  }, [setDoc])

  const deleteEl = useCallback((id: string) => {
    setDoc(d => ({ ...d, elements: d.elements.filter(e => e.id !== id) }))
    setSelectedId(null)
  }, [setDoc])

  const duplicateEl = useCallback((id: string) => {
    setDoc(d => {
      const el = d.elements.find(e => e.id === id); if (!el) return d
      const clone = { ...el, id: uid(el.type[0]), x: el.x + 30, y: el.y + 30 } as AnyElement
      return { ...d, elements: [...d.elements, clone] }
    })
  }, [setDoc])

  // Reorder z-stack: 'up' = toward the front, 'down' = toward the back.
  const moveLayer = useCallback((id: string, dir: 'up' | 'down') => {
    setDoc(d => {
      const i = d.elements.findIndex(e => e.id === id)
      const j = dir === 'up' ? i + 1 : i - 1
      if (i < 0 || j < 0 || j >= d.elements.length) return d
      const els = [...d.elements]
      ;[els[i], els[j]] = [els[j], els[i]]
      return { ...d, elements: els }
    })
  }, [setDoc])

  const addText = useCallback(() => {
    const el: TextEl = {
      id: uid('t'), type: 'text',
      x: 200, y: 480, w: 680, h: 120, rotation: 0,
      content: 'Ketuk untuk edit',
      font: {
        family: 'DM Sans', size: 56, weight: 700, italic: false,
        color: '#1c1917', align: 'center', lineHeight: 1.1, letterSpacing: 0, uppercase: false,
      },
    }
    setDoc(d => ({ ...d, elements: [...d.elements, el] }))
    setSelectedId(el.id)
  }, [setDoc])

  const addImage = useCallback((src: string) => {
    const el: ImageEl = {
      id: uid('i'), type: 'image',
      x: 290, y: 290, w: 500, h: 500, rotation: 0,
      src, fit: 'cover', radius: 12, opacity: 1,
    }
    setDoc(d => ({ ...d, elements: [...d.elements, el] }))
    setSelectedId(el.id)
  }, [setDoc])

  const addLogo = useCallback((src: string) => {
    const el: ImageEl = {
      id: uid('i'), type: 'image',
      x: 290, y: 290, w: 500, h: 500, rotation: 0,
      src, fit: 'contain', radius: 0, opacity: 1,
    }
    setDoc(d => ({ ...d, elements: [...d.elements, el] }))
    setSelectedId(el.id)
  }, [setDoc])

  const addSticker = useCallback((svg: string) => {
    setDoc(d => ({
      ...d,
      elements: [...d.elements, {
        id: uid('s'), type: 'sticker',
        x: 390, y: 390, w: 300, h: 300, rotation: 0,
        src: svg, color: '#5b5bd6',
      }],
    }))
  }, [setDoc])

  const addSosmedBar = useCallback((src: string) => {
    const el: ImageEl = {
      id: uid('i'), type: 'image',
      x: 60, y: 1256, w: 960, h: 64, rotation: 0,
      src, fit: 'contain', radius: 0, opacity: 1,
    }
    setDoc(d => ({ ...d, elements: [...d.elements, el] }))
    setSelectedId(el.id)
  }, [setDoc])

  // ── Export PNG ─────────────────────────────────────────────
  const exportPNG = useCallback(async () => {
    setExporting(true)
    setSelectedId(null)
    await new Promise(r => requestAnimationFrame(r))
    try {
      const dataUrl = canvasRef.current?.toPNG()
      if (!dataUrl) throw new Error('Canvas tidak tersedia')
      const a = document.createElement('a')
      a.download = `pamflet-${Date.now()}.png`
      a.href = dataUrl
      a.click()
      showToast('Pamflet diunduh sebagai PNG')
    } catch (err) {
      console.error(err)
      showToast('Export gagal: ' + (err instanceof Error ? err.message : String(err)), 'error')
    } finally {
      setExporting(false)
    }
  }, [showToast])

  // ── Sheet handlers ─────────────────────────────────────────
  const toolbarKind = selectedToolbarKind(selected)

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden">
      <header className="sticky top-0 z-10 bg-surface/85 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto w-full px-3 py-2.5 flex items-center gap-2">
          <button onClick={onBack}
            className="w-10 h-10 rounded-xl border border-border bg-bg flex items-center justify-center text-fg"
            aria-label="Kembali">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="flex-1" />
          <button onClick={onSave}
            className="px-3 py-2 rounded-xl border border-border bg-bg text-fg text-xs font-semibold flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Draft
          </button>
          <button onClick={exportPNG} disabled={exporting}
            className="px-3 py-2 rounded-xl bg-accent text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60">
            {exporting ? 'Memproses…' : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                PNG
              </>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        <EditorCanvas
          ref={canvasRef}
          doc={doc}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onChange={setDoc}
          onCroppingChange={setCropping}
          drawMode={drawMode}
          onFreeformDone={(svg, x, y, w, h) => {
            setDoc(d => ({
              ...d,
              elements: [...d.elements, {
                id: uid('s'), type: 'sticker',
                x, y, w, h, rotation: 0,
                src: svg, color: '#5b5bd6',
              } as StickerEl],
            }))
            setDrawMode(false)
          }}
          onDrawCancel={() => setDrawMode(false)}
        />
      </div>

      {!cropping && !drawMode && toolbarKind === 'idle' && (
        <IdleToolbar
          onAddText={addText}
          onAddImage={() => setSheet({ kind: 'image-pick' })}
          onAddSticker={() => setSheet({ kind: 'sticker' })}
          onChangeBg={() => setSheet({ kind: 'bg' })}
          onChangeTemplate={onSwitchTemplate}
        />
      )}
      {!cropping && !drawMode && toolbarKind === 'text' && selected?.type === 'text' && (
        <TextToolbar el={selected}
          onEdit={() => setSheet({ kind: 'text-edit' })}
          onFont={() => setSheet({ kind: 'font' })}
          onSize={() => setSheet({ kind: 'size' })}
          onColor={() => setSheet({ kind: 'color-text' })}
          onResetRot={() => patchEl(selected.id, { rotation: 0 } as Partial<TextEl>)}
          onForward={() => moveLayer(selected.id, 'up')}
          onBackward={() => moveLayer(selected.id, 'down')}
          onDuplicate={() => duplicateEl(selected.id)}
          onDelete={() => deleteEl(selected.id)} />
      )}
      {!cropping && !drawMode && toolbarKind === 'image' && selected?.type === 'image' && (
        <ImageToolbar el={selected}
          onReplace={() => setSheet({ kind: 'image-replace' })}
          onFitToggle={() => patchEl<ImageEl>(selected.id, { fit: selected.fit === 'cover' ? 'contain' : 'cover' })}
          onCrop={() => canvasRef.current?.startCrop()}
          onResetRot={() => patchEl(selected.id, { rotation: 0 } as Partial<ImageEl>)}
          onForward={() => moveLayer(selected.id, 'up')}
          onBackward={() => moveLayer(selected.id, 'down')}
          onDuplicate={() => duplicateEl(selected.id)}
          onDelete={() => deleteEl(selected.id)} />
      )}
      {!cropping && !drawMode && toolbarKind === 'shape' && selected && (selected.type === 'shape' || selected.type === 'sticker') && (
        <ShapeToolbar el={selected}
          onColor={() => setSheet({ kind: 'color-shape' })}
          onResetRot={() => patchEl(selected.id, { rotation: 0 })}
          onForward={() => moveLayer(selected.id, 'up')}
          onBackward={() => moveLayer(selected.id, 'down')}
          onDuplicate={() => duplicateEl(selected.id)}
          onDelete={() => deleteEl(selected.id)} />
      )}

      {/* ── Sheets ────────────────────────────────────────── */}
      {selected?.type === 'text' && (
        <>
          <TextEditSheet open={sheet?.kind === 'text-edit'}
            value={selected.content}
            onChange={t => patchEl(selected.id, { content: t } as Partial<TextEl>)}
            onClose={() => setSheet(null)} />
          <FontSheet open={sheet?.kind === 'font'}
            font={selected.font}
            onChange={patch => patchFont(selected.id, patch)}
            onClose={() => setSheet(null)} />
          <SliderSheet open={sheet?.kind === 'size'} title="Ukuran Font"
            value={selected.font.size} min={10} max={240} step={1}
            onChange={v => patchFont(selected.id, { size: v })}
            format={v => `${Math.round(v)}px`}
            onClose={() => setSheet(null)} />
          <ColorSheet open={sheet?.kind === 'color-text'} title="Warna Teks"
            value={selected.font.color}
            onChange={c => patchFont(selected.id, { color: c })}
            onClose={() => setSheet(null)} />
        </>
      )}
      {selected?.type === 'image' && (
        <ImagePickerSheet open={sheet?.kind === 'image-replace'}
          onPick={src => patchEl<ImageEl>(selected.id, { src })}
          onClose={() => setSheet(null)} />
      )}
      {selected && (selected.type === 'shape' || selected.type === 'sticker') && (
        <ColorSheet open={sheet?.kind === 'color-shape'} title="Warna"
          value={selected.type === 'shape' ? selected.fill : selected.color}
          onChange={c => selected.type === 'shape'
            ? patchEl(selected.id, { fill: c })
            : patchEl(selected.id, { color: c })}
          onClose={() => setSheet(null)} />
      )}
      <ImagePickerSheet open={sheet?.kind === 'image-pick'}
        onPick={addImage}
        onClose={() => setSheet(null)} />
      <StickerSheet open={sheet?.kind === 'sticker'}
        kotaLogo={kotaLogo}
        onPick={addSticker}
        onPickLogo={addLogo}
        onPickSosmed={addSosmedBar}
        onStartDraw={() => { setSheet(null); setSelectedId(null); setDrawMode(true) }}
        onClose={() => setSheet(null)} />
      <BackgroundSheet open={sheet?.kind === 'bg'}
        value={doc.canvas.bg}
        onChange={bg => setDoc(d => ({ ...d, canvas: { ...d.canvas, bg } }))}
        onClose={() => setSheet(null)} />
    </div>
  )
}
