'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import type { PamfletDoc, AnyElement } from '../lib/types'
import { bgNode, coverCrop } from '../lib/render'
import { ElementNode } from './ElementNode'

const noopSelect = (_id: string) => {}
const noopChange = (_id: string, _patch: Partial<AnyElement>) => {}

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

function ThumbnailBackground({ doc }: { doc: PamfletDoc }) {
  const { bg, w, h } = doc.canvas
  const node = bgNode(bg, w, h)
  if (node.kind === 'image') return <BgImage src={node.src} fit={node.fit} w={w} h={h} />
  return <Rect name="background" x={0} y={0} width={w} height={h} {...node.attrs} />
}

export function Thumbnail({ doc }: { doc: PamfletDoc }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const measure = () => {
      const r = wrap.getBoundingClientRect()
      const s = Math.min(r.width / doc.canvas.w, r.height / doc.canvas.h)
      if (s > 0) setScale(s)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [doc.canvas.w, doc.canvas.h])

  const dispW = doc.canvas.w * scale
  const dispH = doc.canvas.h * scale

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {mounted && scale > 0 && (
        <Stage width={dispW} height={dispH} scaleX={scale} scaleY={scale} listening={false}>
          <Layer listening={false}>
            <ThumbnailBackground doc={doc} />
            {doc.elements.map(el => (
              <ElementNode
                key={el.id}
                el={el}
                draggable={false}
                onSelect={noopSelect}
                onChange={noopChange}
              />
            ))}
          </Layer>
        </Stage>
      )}
    </div>
  )
}
