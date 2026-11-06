/* eslint-disable */
// GENERATED from app/dashboard/pemuridan/page.tsx by scripts/gen-demo-preview.mjs — do not edit; change the source or the generator and re-run.
'use client'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { ANTON, IconButton, LABEL, MONO, PANEL, PaperHeader, PaperMain, PRESS, Strip, TAPE } from '@/components/pwa/paper-ui'
import { PEMURIDAN, PEMURIDAN_AKTIF, progressKey, type Seri } from '@/lib/pemuridan'

const noSubscribe = () => () => {}

/** Part the member last opened on this device, or null before the first visit. */
function savedPart(seri: Seri) {
  try {
    const v = parseInt(localStorage.getItem(progressKey(seri.slug)) ?? '', 10)
    return v >= 0 && v < seri.bagian ? v : null
  } catch {
    return null
  }
}

export default function PemuridanPage() {
  const router = useRouter()
  if (!PEMURIDAN_AKTIF) notFound()
  return (
    <PaperMain>
      <PaperHeader
        sticker="Cerita interaktif"
        title="Pemuridan"
        leading={<IconButton icon="back" label="Kembali" onClick={() => router.push('/demo-preview/dashboard')} className="-rotate-3" />}
      />
      <div className="px-5 mt-4 space-y-5 pb-8">
        <p className={`${MONO} text-[12.5px] leading-relaxed text-[#44403c]`}>
          Ikuti ceritanya, sentuh gambarnya, dan temukan pelajarannya dari Firman.
        </p>
        {PEMURIDAN.map((s) => (
          <SeriCard key={s.slug} seri={s} />
        ))}
      </div>
    </PaperMain>
  )
}

function SeriCard({ seri }: { seri: Seri }) {
  const at = useSyncExternalStore(noSubscribe, () => savedPart(seri), () => null)
  return (
    <Link href={`/demo-preview/dashboard/pemuridan/${seri.slug}`} className={`relative block px-4 pt-4 pb-4 ${PANEL} ${PRESS}`}>
      <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
      <Image src="/pemuridan/wp-logo.png" alt="" width={183} height={195} className="absolute right-4 top-4 h-auto w-9 rotate-6" />
      <p className={`${LABEL} pr-12 text-[10px] font-bold text-[#57534e]`}>
        Seri #{seri.no} · {seri.tema}
      </p>
      <h2 className={`${ANTON} mt-2 pr-12 text-[26px] leading-[1.05] tracking-[.01em]`}>
        {seri.judul}
        <span className="block text-[#e02a2f]">{seri.sub}</span>
      </h2>
      <p className={`${MONO} mt-2 text-[11.5px] text-[#57534e]`}>
        {seri.bagian} bagian · {seri.ayat}
      </p>
      <div aria-hidden className="mt-4 flex gap-1">
        {Array.from({ length: seri.bagian }, (_, i) => (
          <i
            key={i}
            className={`h-1.5 flex-1 rounded-full ${at != null && i < at ? 'bg-[#161616]' : i === at ? 'bg-[#e02a2f]' : 'bg-[#161616]/15'}`}
          />
        ))}
      </div>
      <Strip className="mt-4">{at ? `Lanjut · ${at + 1} / ${seri.bagian}` : 'Mulai'}</Strip>
    </Link>
  )
}
