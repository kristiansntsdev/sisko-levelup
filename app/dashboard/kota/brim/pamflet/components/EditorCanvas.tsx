'use client'
import {
  forwardRef, useCallback, useEffect, useImperativeHandle,
  useLayoutEffect, useRef, useState,
} from 'react'
import { Stage, Layer, Group, Rect, Line, Image as KonvaImage, Transformer } from 'react-konva'
import useImage from 'use-image'
import type Konva from 'konva'
import type { AnyElement, ImageEl, Background, PamfletDoc } from '../lib/types'
import { bgNode, coverCrop } from '../lib/render'
import { ElementNode } from './ElementNode'

interface Props {
  doc: PamfletDoc
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (updater: (doc: PamfletDoc) => PamfletDoc) => void
  onCroppingChange?: (cropping: boolean) => void
}

export interface EditorCanvasHandle {
  /** Render the canvas to a 2× PNG data URL. */
  toPNG: () => string | undefined
  /** Enter crop mode for the currently-selected image. */
  startCrop: () => void
}

const ACCENT = '#5b5bd6'
const CROP_ACCENT = '#f59e0b'

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export const EditorCanvas = forwardRef<EditorCanvasHandle, Props>(function EditorCanvas(
  { doc, selectedId, onSelect, onChange, onCroppingChange }, ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const layerRef = useRef<Konva.Layer>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const cropCommitRef = useRef<(() => void) | null>(null)
  const [scale, setScale] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [cropId, setCropId] = useState<string | null>(null)

  useEffect(() => setMounted(true), [])

  // Fit-scale the 1080×1350 canvas into the available space.
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const measure = () => {
      const r = wrap.getBoundingClientRect()
      const pad = 24
      const s = Math.min((r.width - pad) / doc.canvas.w, (r.height - pad) / doc.canvas.h)
      setScale(s > 0 ? s : 0)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [doc.canvas.w, doc.canvas.h])

  const updateEl = useCallback((id: string, patch: Partial<AnyElement>) => {
    onChange(d => ({
      ...d,
      elements: d.elements.map(e => e.id === id ? ({ ...e, ...patch } as AnyElement) : e),
    }))
  }, [onChange])

  const selected = selectedId ? doc.elements.find(e => e.id === selectedId) ?? null : null

  // Leave crop mode when selection moves off the cropped image.
  useEffect(() => {
    if (cropId && selectedId !== cropId) setCropId(null)
  }, [cropId, selectedId])

  useEffect(() => { onCroppingChange?.(!!cropId) }, [cropId, onCroppingChange])

  // Attach the transformer to the selected node (skipped during crop).
  useEffect(() => {
    const tr = trRef.current
    const layer = layerRef.current
    if (!tr || !layer) return
    if (selectedId && !cropId) {
      const node = layer.findOne('#' + selectedId)
      tr.nodes(node ? [node] : [])
    } else {
      tr.nodes([])
    }
    tr.getLayer()?.batchDraw()
  }, [selectedId, cropId, doc])

  useImperativeHandle(ref, () => ({
    toPNG: () => {
      const stage = stageRef.current
      if (!stage || scale <= 0) return undefined
      return stage.toDataURL({ pixelRatio: 2 / scale, mimeType: 'image/png' })
    },
    startCrop: () => {
      const sel = doc.elements.find(e => e.id === selectedId)
      if (sel?.type === 'image') setCropId(sel.id)
    },
  }), [scale, doc.elements, selectedId])

  const dispW = doc.canvas.w * scale
  const dispH = doc.canvas.h * scale

  const backdrop = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const t = e.target
    if (t === t.getStage() || t.name() === 'background') onSelect(null)
  }

  const isImgSticker = selected?.type === 'image' || selected?.type === 'sticker'

  const handleSelesai = () => {
    cropCommitRef.current?.()
    setCropId(null)
  }

  return (
    <div ref={wrapRef} style={{
      flex: 1, minHeight: 0, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 12, background: '#e7e5e4', overflow: 'hidden', touchAction: 'none',
    }}>
      {mounted && scale > 0 && (
        <Stage
          ref={stageRef}
          width={dispW} height={dispH}
          scaleX={scale} scaleY={scale}
          onMouseDown={backdrop}
          onTouchStart={backdrop}
          style={{ boxShadow: '0 6px 24px rgba(0,0,0,.12), 0 1px 3px rgba(0,0,0,.06)' }}
        >
          <Layer ref={layerRef}>
            <CanvasBackground bg={doc.canvas.bg} w={doc.canvas.w} h={doc.canvas.h} />
            {doc.elements.map(el => (
              // Hide the element being cropped — CropOverlay redraws it.
              el.id === cropId ? null : (
                <ElementNode
                  key={el.id}
                  el={el}
                  draggable={el.id === selectedId && !cropId}
                  onSelect={onSelect}
                  onChange={updateEl}
                />
              )
            ))}
            {!cropId && selected && (
              <Transformer
                ref={trRef}
                rotateEnabled
                keepRatio={!!isImgSticker}
                enabledAnchors={isImgSticker
                  ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
                  : undefined}
                anchorStroke={ACCENT}
                anchorFill="#fff"
                anchorSize={14}
                anchorCornerRadius={3}
                borderStroke={ACCENT}
                borderStrokeWidth={1.5}
                rotateAnchorOffset={30}
                ignoreStroke
                boundBoxFunc={(oldB, newB) =>
                  (newB.width < 24 || newB.height < 24) ? oldB : newB}
              />
            )}
            {cropId && selected?.type === 'image' && (
              <CropOverlay
                el={selected}
                onChange={updateEl}
                commitRef={cropCommitRef}
                canvasW={doc.canvas.w}
                canvasH={doc.canvas.h}
                stageScale={scale}
              />
            )}
          </Layer>
        </Stage>
      )}

      {cropId && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 14,
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              fontSize: 12, color: '#fff', background: 'rgba(0,0,0,.6)',
              padding: '6px 10px', borderRadius: 8,
            }}>Seret kotak untuk memilih area · tarik sudut untuk ubah ukuran</span>
            <button onClick={handleSelesai} style={{
              fontSize: 13, fontWeight: 600, color: '#fff', background: CROP_ACCENT,
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            }}>Selesai</button>
          </div>
        </div>
      )}
    </div>
  )
})

// ── Background ────────────────────────────────────────────────
function CanvasBackground({ bg, w, h }: { bg: Background; w: number; h: number }) {
  const node = bgNode(bg, w, h)
  if (node.kind === 'image') return <BgImage src={node.src} fit={node.fit} w={w} h={h} />
  return <Rect name="background" x={0} y={0} width={w} height={h} {...node.attrs} />
}

function BgImage({ src, fit, w, h }: { src: string; fit: 'cover' | 'contain'; w: number; h: number }) {
  const [img] = useImage(src || '', 'anonymous')
  if (!src || !img) {
    return <Rect name="background" x={0} y={0} width={w} height={h} fill="#ffffff" />
  }
  const nw = img.naturalWidth || img.width
  const nh = img.naturalHeight || img.height
  if (fit === 'cover') {
    return <KonvaImage name="background" image={img} x={0} y={0} width={w} height={h}
      crop={coverCrop(w, h, nw, nh)} />
  }
  const s = Math.min(w / nw, h / nh)
  const dw = nw * s, dh = nh * s
  return (
    <>
      <Rect name="background" x={0} y={0} width={w} height={h} fill="#ffffff" />
      <KonvaImage image={img} x={(w - dw) / 2} y={(h - dh) / 2} width={dw} height={dh} listening={false} />
    </>
  )
}

// ── Crop overlay ──────────────────────────────────────────────
// Shows the full source image dimmed under a dark mask; the chosen crop
// region is redrawn bright on top. The crop box resizes freely (any aspect);
// on commit the element reshapes to the crop box, keeping its centre, so the
// cropped image never distorts.
function CropOverlay({ el, onChange, commitRef, canvasW, canvasH, stageScale }: {
  el: ImageEl
  onChange: (id: string, patch: Partial<AnyElement>) => void
  commitRef: React.MutableRefObject<(() => void) | null>
  canvasW: number
  canvasH: number
  stageScale: number
}) {
  const [img] = useImage(el.src || '', 'anonymous')
  const natW = img ? (img.naturalWidth || img.width) : 0
  const natH = img ? (img.naturalHeight || img.height) : 0
  const trRef = useRef<Konva.Transformer>(null)
  const boxRef = useRef<Konva.Rect>(null)

  // Display the full image fitted inside the canvas with a margin.
  const MARGIN = 70
  const D = (natW > 0 && natH > 0)
    ? Math.min((canvasW - MARGIN * 2) / natW, (canvasH - MARGIN * 2) / natH)
    : 1
  const dispW = natW * D
  const dispH = natH * D
  const ox = (canvasW - dispW) / 2
  const oy = (canvasH - dispH) / 2
  const AR = el.w / el.h

  // Crop box in canvas coordinates.
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  // Initialise once the image loads.
  useEffect(() => {
    if (!img || natW <= 0) return
    if (el.crop) {
      setBox({
        x: ox + el.crop.x * D,
        y: oy + el.crop.y * D,
        w: el.crop.width * D,
        h: el.crop.height * D,
      })
    } else {
      // Largest box with the element's aspect ratio fitting the image.
      let bw = dispW, bh = bw / AR
      if (bh > dispH) { bh = dispH; bw = bh * AR }
      setBox({ x: ox + (dispW - bw) / 2, y: oy + (dispH - bh) / 2, w: bw, h: bh })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img])

  // Keep the transformer attached to the crop box.
  useEffect(() => {
    const tr = trRef.current
    const node = boxRef.current
    if (!tr || !node || !box) return
    tr.nodes([node])
    tr.getLayer()?.batchDraw()
  }, [box, img])

  // Commit: convert the canvas-space crop box back to source pixels, and
  // reshape the element to the crop box (centre kept) so it never distorts.
  commitRef.current = (box && natW > 0) ? () => {
    const sx = clamp((box.x - ox) / D, 0, natW)
    const sy = clamp((box.y - oy) / D, 0, natH)
    const sw = clamp(box.w / D, 1, natW - sx)
    const sh = clamp(box.h / D, 1, natH - sy)
    const cx = el.x + el.w / 2
    const cy = el.y + el.h / 2
    onChange(el.id, {
      crop: { x: sx, y: sy, width: sw, height: sh },
      x: cx - box.w / 2,
      y: cy - box.h / 2,
      w: box.w,
      h: box.h,
    })
  } : null

  if (!img || !box || natW <= 0) {
    return <Rect x={el.x} y={el.y} width={el.w} height={el.h}
      stroke={CROP_ACCENT} strokeWidth={2} dash={[10, 7]} listening={false} />
  }

  const { x: bx, y: by, w: bw, h: bh } = box

  // Rule-of-thirds grid inside the crop box.
  const grid: React.ReactElement[] = []
  for (let i = 1; i <= 2; i++) {
    grid.push(
      <Line key={'v' + i} listening={false} strokeWidth={1} stroke="rgba(255,255,255,0.55)"
        points={[bx + (bw * i) / 3, by, bx + (bw * i) / 3, by + bh]} />,
      <Line key={'h' + i} listening={false} strokeWidth={1} stroke="rgba(255,255,255,0.55)"
        points={[bx, by + (bh * i) / 3, bx + bw, by + (bh * i) / 3]} />,
    )
  }

  const commitNode = (n: Konva.Rect) => {
    const nw = Math.max(30, n.width() * n.scaleX())
    const nh = Math.max(30, n.height() * n.scaleY())
    n.scaleX(1); n.scaleY(1)
    n.width(nw); n.height(nh)
    setBox({ x: n.x(), y: n.y(), w: nw, h: nh })
  }

  return (
    <>
      {/* Full source image — will be dimmed by the mask above it */}
      <KonvaImage image={img} x={ox} y={oy} width={dispW} height={dispH} listening={false} />

      {/* Dark mask over the whole canvas */}
      <Rect x={0} y={0} width={canvasW} height={canvasH} fill="rgba(0,0,0,0.62)" listening={false} />

      {/* Bright crop region: the image redrawn, clipped to the crop box */}
      <Group listening={false} clipFunc={ctx => { ctx.rect(bx, by, bw, bh) }}>
        <KonvaImage image={img} x={ox} y={oy} width={dispW} height={dispH} listening={false} />
      </Group>

      {grid}

      {/* Crop box — draggable; near-transparent fill makes the interior hittable */}
      <Rect
        ref={boxRef}
        x={bx} y={by} width={bw} height={bh}
        stroke={CROP_ACCENT} strokeWidth={2}
        fill="rgba(0,0,0,0.001)"
        draggable
        onDragMove={e => {
          const nx = clamp(e.target.x(), ox, ox + dispW - bw)
          const ny = clamp(e.target.y(), oy, oy + dispH - bh)
          e.target.x(nx); e.target.y(ny)
          setBox(b => b ? { ...b, x: nx, y: ny } : b)
        }}
        onDragEnd={e => setBox(b => b ? { ...b, x: e.target.x(), y: e.target.y() } : b)}
        onTransform={() => { const n = boxRef.current; if (n) commitNode(n) }}
        onTransformEnd={() => { const n = boxRef.current; if (n) commitNode(n) }}
      />

      {/* Resize handles — free-form, all 8 anchors, any aspect ratio */}
      <Transformer
        ref={trRef}
        keepRatio={false}
        rotateEnabled={false}
        anchorStroke={CROP_ACCENT}
        anchorFill="#fff"
        anchorSize={16}
        anchorCornerRadius={3}
        borderStroke={CROP_ACCENT}
        borderStrokeWidth={1.5}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 40 * stageScale || newBox.height < 40 * stageScale) return oldBox
          const minX = ox * stageScale, minY = oy * stageScale
          const maxX = (ox + dispW) * stageScale, maxY = (oy + dispH) * stageScale
          if (newBox.x < minX - 2 || newBox.y < minY - 2 ||
              newBox.x + newBox.width > maxX + 2 || newBox.y + newBox.height > maxY + 2) {
            return oldBox
          }
          return newBox
        }}
      />
    </>
  )
}
