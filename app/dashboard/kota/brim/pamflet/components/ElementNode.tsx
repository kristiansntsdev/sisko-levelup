'use client'
import { memo, useMemo } from 'react'
import { Group, Rect, Circle, Text, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import type Konva from 'konva'
import type { AnyElement, ImageEl, StickerEl } from '../lib/types'
import {
  boxAttrs, textAttrs, shapeAttrs, imageDrawAttrs, stickerDataUrl, PLACEHOLDER_FILL,
} from '../lib/render'

interface Props {
  el: AnyElement
  draggable: boolean
  onSelect: (id: string) => void
  onChange: (id: string, patch: Partial<AnyElement>) => void
}

// ── Drag / transform commit (Group is centre-positioned via offset) ──
function commitDrag(el: AnyElement, node: Konva.Node, onChange: Props['onChange']) {
  onChange(el.id, { x: node.x() - el.w / 2, y: node.y() - el.h / 2 } as Partial<AnyElement>)
}

function commitTransform(el: AnyElement, node: Konva.Node, onChange: Props['onChange']) {
  const sx = node.scaleX(), sy = node.scaleY()
  node.scaleX(1)
  node.scaleY(1)
  const w = Math.max(12, el.w * sx)
  const h = Math.max(12, el.h * sy)
  onChange(el.id, {
    x: node.x() - w / 2,
    y: node.y() - h / 2,
    w, h,
    rotation: node.rotation(),
  } as Partial<AnyElement>)
}

// ── Per-type content (drawn in local 0,0–w,h space) ──────────
function ImageContent({ el }: { el: ImageEl }) {
  const [img] = useImage(el.src || '', 'anonymous')
  if (!el.src || !img) {
    return <Rect width={el.w} height={el.h} cornerRadius={el.radius} fill={PLACEHOLDER_FILL} />
  }
  const draw = imageDrawAttrs(el, {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
  })
  return <KonvaImage image={img} {...draw} cornerRadius={el.radius} opacity={el.opacity} />
}

function StickerContent({ el }: { el: StickerEl }) {
  const url = useMemo(() => stickerDataUrl(el), [el])
  const [img] = useImage(url, 'anonymous')
  if (!img) return null
  return <KonvaImage image={img} width={el.w} height={el.h} />
}

function Content({ el }: { el: AnyElement }) {
  if (el.type === 'text') return <Text {...textAttrs(el)} />
  if (el.type === 'image') return <ImageContent el={el} />
  if (el.type === 'sticker') return <StickerContent el={el} />
  const s = shapeAttrs(el)
  if (s.shape === 'circle') {
    const { shape: _s, ...rest } = s
    return <Circle {...rest} />
  }
  const { shape: _s, ...rest } = s
  return <Rect {...rest} />
}

function ElementNodeImpl({ el, draggable, onSelect, onChange }: Props) {
  return (
    <Group
      id={el.id}
      name="element"
      {...boxAttrs(el)}
      draggable={draggable}
      onMouseDown={() => onSelect(el.id)}
      onTouchStart={() => onSelect(el.id)}
      onDragEnd={e => commitDrag(el, e.target, onChange)}
      onTransformEnd={e => commitTransform(el, e.target, onChange)}
    >
      {/* Transparent hit rect — anchors bounds + makes the whole box selectable */}
      <Rect width={el.w} height={el.h} fill="transparent" />
      <Content el={el} />
    </Group>
  )
}

export const ElementNode = memo(ElementNodeImpl)
