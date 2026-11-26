'use client'
import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ANTON, BTN, BTN_OUTLINE, LABEL, MONO, PANEL, PRESS, Strip, TAPE } from '@/components/pwa/paper-ui'
import { AIR_STAGE_LABEL, perluPopup, type AirAnggota } from '@/lib/air-hidup'
import { PaperToast } from '@/components/pwa/paper-ui'
import { AirBar, DropIcon } from './bar'

/** Panel di Beranda semua anggota: air milik sendiri + tautan ke aliran dan (PIC) dashboard PIC. */
export function AirBerandaPanel({ saya, isPic, anggotaHaus, feedHref, picHref }: { saya: AirAnggota | null; isPic: boolean; anggotaHaus: number | null; feedHref: string; picHref: string }) {
  return (
    <section aria-label="Air Hidup" className={`relative px-4 pt-4 pb-5 ${PANEL}`}>
      <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
      <h2 className={`${ANTON} flex items-center gap-2 pb-3 text-[24px] leading-none border-b-2 border-dotted border-[#161616]/40`}>
        <DropIcon className="h-5 w-5 text-[#2f7fc1]" />
        Air Hidup
      </h2>
      <div className="mt-4">
        {saya ? (
          <>
            <AirBar air={saya} nama={saya.namaKota || undefined} />
            <p className={`${MONO} mt-2.5 text-[11.5px] leading-relaxed text-[#57534e]`}>
              Airmu terisi penuh tiap kamu absen di WW Online, atau PIC menandaimu di laporan WW kotamu.
            </p>
          </>
        ) : (
          <p className={`${MONO} text-[12px] text-[#57534e]`}>Air Hidup belum bisa dimuat. Coba lagi sebentar.</p>
        )}
        {isPic && anggotaHaus != null && anggotaHaus > 0 && (
          <p className={`${MONO} mt-2 text-[12px] font-bold text-[#c21f24]`}>{anggotaHaus} anggota kotamu Haus atau Kering.</p>
        )}
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
  saya,
  isPic,
  laporHref,
  onClose,
  onAjak,
}: {
  saya: AirAnggota
  isPic: boolean
  laporHref: string
  onClose: () => void
  onAjak: () => void
}) {
  const kering = saya.stage === 'kering'
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="alertdialog" aria-labelledby="air-popup-title" className={`relative w-full max-w-[360px] px-5 pt-6 pb-5 text-center ${PANEL}`}>
        <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e02a2f] text-white">
          <DropIcon className="h-7 w-7" />
        </span>
        <p className={`${LABEL} mt-3 text-[10px] font-bold text-[#c21f24]`}>
          {saya.namaKota ? `${saya.namaKota} · ` : ''}
          {AIR_STAGE_LABEL[saya.stage]}
        </p>
        <h2 id="air-popup-title" className={`${ANTON} mt-1 text-[32px] leading-none`}>
          Airmu mau kering
        </h2>
        <p className={`${MONO} mt-3 text-[12.5px] leading-relaxed text-[#44403c]`}>
          {kering
            ? 'Sudah 40 hari lebih tanpa minum. Yuk kembali duduk di hadirat Tuhan dan minum lagi: ikut WW Online atau WW kotamu.'
            : 'Sudah lebih dari 30 hari. Yuk minum lagi sebelum benar-benar kering: ikut WW Online atau WW kotamu.'}
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
  return `Kak, air hidupku mau kering nih. Yuk kita WW${namaKota ? ` ${namaKota}` : ''} lagi, terus tolong tandai aku di laporan WW di aplikasi LevelUP ya.`
}

// Pop-up sekali per tahap per siklus air, per HP per akun (localStorage, pola lonceng Pengumuman).
const POPUP_EVT = 'levelup-air-popup'
const popupKey = (pembaca: string) => `levelup-air-popup:${pembaca}`
const popupTanda = (a: AirAnggota) => `${a.stage}:${a.sejak ?? ''}`

function bacaPopup(pembaca: string): string {
  try {
    return localStorage.getItem(popupKey(pembaca)) ?? ''
  } catch {
    return ''
  }
}

function subscribePopup(cb: () => void) {
  window.addEventListener('storage', cb)
  window.addEventListener(POPUP_EVT, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(POPUP_EVT, cb)
  }
}

/** Panel + pop-up di Beranda semua anggota. Data dari server; pop-up tertutup disimpan di HP ini. */
export function AirBerandaSaya({ saya, isPic, anggotaHaus, pembaca, feedHref, picHref, laporHref }: { saya: AirAnggota | null; isPic: boolean; anggotaHaus: number | null; pembaca: string; feedHref: string; picHref: string; laporHref: string }) {
  const [toast, setToast] = useState<string | null>(null)
  // null di render server: pop-up tidak ikut HTML awal, jadi tidak berkedip.
  const tersimpan = useSyncExternalStore(subscribePopup, () => bacaPopup(pembaca), () => null)
  const tanda = saya ? popupTanda(saya) : ''
  const tampil = !!saya && perluPopup(saya.stage) && tersimpan !== null && tersimpan !== tanda

  function tutup() {
    try {
      localStorage.setItem(popupKey(pembaca), tanda)
    } catch {
      /* penyimpanan diblokir: pop-up muncul lagi pada pembukaan berikutnya */
    }
    window.dispatchEvent(new Event(POPUP_EVT))
  }

  async function ajak() {
    const text = popupText(saya?.namaKota ?? '')
    try {
      await navigator.clipboard.writeText(text)
      setToast('Pesan disalin. Kirim ke PIC-mu lewat WhatsApp.')
    } catch {
      setToast('Salin manual: ' + text)
    }
    setTimeout(() => setToast(null), 3200)
    tutup()
  }

  return (
    <>
      <AirBerandaPanel saya={saya} isPic={isPic} anggotaHaus={anggotaHaus} feedHref={feedHref} picHref={picHref} />
      {tampil && saya && <AirPopup saya={saya} isPic={isPic} laporHref={laporHref} onClose={tutup} onAjak={ajak} />}
      <PaperToast msg={toast} />
    </>
  )
}
