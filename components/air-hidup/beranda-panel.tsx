'use client'
import Link from 'next/link'
import { ANTON, BTN, BTN_OUTLINE, LABEL, MONO, PANEL, PRESS, Strip, TAPE } from '@/components/pwa/paper-ui'
import { AIR_STAGE_LABEL, type KotaAir } from '@/lib/air-hidup'
import { AirBar, DropIcon } from './bar'

/** Panel di Beranda untuk Core ke atas: bar air kota sendiri + tautan ke aliran dan (PIC) dashboard PIC. */
export function AirBerandaPanel({ kota, isPic, feedHref, picHref }: { kota: KotaAir; isPic: boolean; feedHref: string; picHref: string }) {
  return (
    <section aria-label="Air Hidup" className={`relative px-4 pt-4 pb-5 ${PANEL}`}>
      <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
      <h2 className={`${ANTON} flex items-center gap-2 pb-3 text-[24px] leading-none border-b-2 border-dotted border-[#161616]/40`}>
        <DropIcon className="h-5 w-5 text-[#2f7fc1]" />
        Air Hidup
      </h2>
      <div className="mt-4">
        <AirBar kota={kota} />
      </div>
      <div className={`mt-4 grid gap-2.5 ${isPic ? 'grid-cols-2' : ''}`}>
        <Link href={feedHref} className={`${BTN_OUTLINE}`}>
          Lihat Aliran
        </Link>
        {isPic && (
          <Link href={picHref} className={BTN}>
            <Strip tone="ink" className="py-3 text-[16px]">
              Dashboard PIC
            </Strip>
          </Link>
        )}
      </div>
    </section>
  )
}

/** Muncul sekali per tahap (Haus, lalu Kering). PIC bisa langsung lapor; Core mengajak PIC-nya. */
export function AirPopup({
  kota,
  isPic,
  laporHref,
  onClose,
  onAjak,
}: {
  kota: KotaAir
  isPic: boolean
  laporHref: string
  onClose: () => void
  onAjak: () => void
}) {
  const kering = kota.stage === 'kering'
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="alertdialog" aria-labelledby="air-popup-title" className={`relative w-full max-w-[360px] px-5 pt-6 pb-5 text-center ${PANEL}`}>
        <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e02a2f] text-white">
          <DropIcon className="h-7 w-7" />
        </span>
        <p className={`${LABEL} mt-3 text-[10px] font-bold text-[#c21f24]`}>
          {kota.namaKota} · {AIR_STAGE_LABEL[kota.stage]}
        </p>
        <h2 id="air-popup-title" className={`${ANTON} mt-1 text-[32px] leading-none`}>
          Airmu mau kering
        </h2>
        <p className={`${MONO} mt-3 text-[12.5px] leading-relaxed text-[#44403c]`}>
          {kering
            ? 'Sudah 40 hari lebih tanpa minum. Yuk kembali duduk di hadirat Tuhan dan minum lagi.'
            : 'Sudah lebih dari 30 hari. Yuk minum lagi sebelum benar-benar kering.'}
        </p>
        <p className={`${MONO} mt-2 text-[11.5px] italic text-[#57534e]`}>“Barangsiapa haus, baiklah ia datang kepada-Ku dan minum.” Yohanes 7:37</p>
        <div className="mt-5 space-y-2.5">
          {isPic ? (
            <Link href={laporHref} onClick={onClose} className={BTN}>
              <Strip>Lapor WW</Strip>
            </Link>
          ) : (
            <button type="button" onClick={onAjak} className={BTN}>
              <Strip>Ajak PIC-mu</Strip>
            </button>
          )}
          <button type="button" onClick={onClose} className={`${MONO} w-full py-2 text-[12px] font-bold underline underline-offset-4 decoration-dotted ${PRESS}`}>
            Nanti dulu
          </button>
        </div>
      </div>
    </div>
  )
}

export function popupText(namaKota: string): string {
  return `Kak, air hidup ${namaKota} mau kering nih. Yuk kita WW lagi, terus lapor di aplikasi LevelUP supaya kota lain ikut minum juga.`
}
