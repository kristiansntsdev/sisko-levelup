'use client'
import { useRef } from 'react'
import { LABEL, MONO } from '@/components/pwa/paper-ui'

export type Fokus = { x: number; y: number }

const klem = (n: number) => Math.min(100, Math.max(0, Math.round(n)))

/**
 * Pilih bagian foto yang tampil di kartu kompak (Beranda): ketuk atau geser di foto untuk memindahkan titik fokus.
 * Di bawahnya pratinjau kartu 4:3 persis seperti yang akan dilihat anggota lain.
 */
export function FotoFokus({ src, fokus, onChange }: { src: string; fokus: Fokus; onChange: (f: Fokus) => void }) {
  const box = useRef<HTMLDivElement>(null)

  function pindah(e: React.PointerEvent) {
    const r = box.current?.getBoundingClientRect()
    if (!r || !r.width || !r.height) return
    onChange({ x: klem(((e.clientX - r.left) / r.width) * 100), y: klem(((e.clientY - r.top) / r.height) * 100) })
  }

  return (
    <div className="space-y-3">
      <div>
        <span className={`${LABEL} mb-1.5 block text-[10px] font-bold text-[#44403c]`}>Ketuk atau geser bagian yang mau ditampilkan</span>
        <div
          ref={box}
          role="slider"
          aria-label="Titik fokus foto"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={fokus.x}
          aria-valuetext={`${fokus.x}% dari kiri, ${fokus.y}% dari atas`}
          tabIndex={0}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            pindah(e)
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) pindah(e)
          }}
          onKeyDown={(e) => {
            const d = e.shiftKey ? 10 : 2
            if (e.key === 'ArrowLeft') onChange({ ...fokus, x: klem(fokus.x - d) })
            else if (e.key === 'ArrowRight') onChange({ ...fokus, x: klem(fokus.x + d) })
            else if (e.key === 'ArrowUp') onChange({ ...fokus, y: klem(fokus.y - d) })
            else if (e.key === 'ArrowDown') onChange({ ...fokus, y: klem(fokus.y + d) })
            else return
            e.preventDefault()
          }}
          // touch-action: none supaya geser jari memindahkan titik, bukan menggulung halaman
          className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-[10px] ring-2 ring-[#161616]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob / uploaded photo */}
          <img src={src} alt="Foto WW" draggable={false} className="block h-auto w-full" />
          <span
            aria-hidden
            className="pointer-events-none absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#e02a2f]/40 shadow-[0_0_0_2px_#161616]"
            style={{ left: `${fokus.x}%`, top: `${fokus.y}%` }}
          />
        </div>
      </div>
      <div>
        <span className={`${LABEL} mb-1.5 block text-[10px] font-bold text-[#44403c]`}>Begini tampilannya di Beranda</span>
        <div className="aspect-[4/3] w-[62%] overflow-hidden rounded-[10px] ring-2 ring-[#161616]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" draggable={false} className="h-full w-full object-cover" style={{ objectPosition: `${fokus.x}% ${fokus.y}%` }} />
        </div>
        <p className={`${MONO} mt-1.5 text-[11px] text-[#57534e]`}>Di halaman Aliran, foto tampil utuh.</p>
      </div>
    </div>
  )
}
