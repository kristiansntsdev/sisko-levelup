'use client'
import Link from 'next/link'
import { AirHidupLanding } from '@/components/air-hidup/landing-section'
import { Brush, LIFT, MK, PRESS, Strip, ZinePage } from '@/components/landing/zine'
import { useAir } from '@/components/demo-preview/air-hidup'
import { getAirHidupFeed } from '@/components/demo-preview/shim/actions/air-hidup'

// Preview of the Air Hidup section on the landing page. The real landing (/) is untouched: it reads the production DB.
export default function AirHidupLandingPreview() {
  const feed = useAir(getAirHidupFeed)
  return (
    <ZinePage>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 pt-[max(1.1rem,env(safe-area-inset-top))] sm:px-8">
        <Strip tone="ink" seed={7} className="px-3.5 py-2 text-[13px] -rotate-1">
          Pratinjau landing · data demo
        </Strip>
        <Link href="/demo-preview/login" className={`${LIFT} ${PRESS}`}>
          <Strip tone="red" seed={9} className="px-4 py-2 text-[14px] rotate-2">
            Coba aplikasinya
          </Strip>
        </Link>
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-12 sm:px-8">
        <h1 className={`${MK} relative text-[clamp(2.4rem,8vw,4.8rem)] leading-[.95] uppercase`}>
          Building a throne <span className="text-[#e02a2f]">for God</span>
          <Brush className="-bottom-3 h-3.5" />
        </h1>
      </div>
      {feed ? (
        <AirHidupLanding nasional={feed.nasional} laporan={feed.laporan} ctaHref="/demo-preview/login" />
      ) : (
        <div className="h-96" />
      )}
    </ZinePage>
  )
}
