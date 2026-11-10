'use client'
import Link from 'next/link'
import { ANTON, BTN, LABEL, LIFTED, MONO, PANEL, PRESS, SectionHead, Strip } from '@/components/pwa/paper-ui'
import { Icon, type IconName } from '@/components/pwa/ui'
import type { KotaAir, WwLaporan } from '@/lib/air-hidup'
import { AirBar, DropIcon, WATER } from './bar'
import { fmtTanggal, LaporanCard } from './feed'

const SOON_TOOLS: { i: IconName; t: string }[] = [
  { i: 'users', t: 'Anggota' },
  { i: 'calendar', t: 'Event' },
  { i: 'chat', t: 'Kesaksian' },
]

/** Dashboard PIC (userlevel 4). Satu-satunya alat aktif untuk sekarang: Pelaporan WW. */
export function PicDashboard({
  kota,
  masuk,
  laporanKota,
  laporHref,
  feedHref,
  onAmin,
  onSoon,
}: {
  kota: KotaAir
  /** laporan kota lain yang mengalirkan Air Hidup ke kota ini (terbaru), kalau ada */
  masuk: WwLaporan | null
  laporanKota: WwLaporan[]
  laporHref: string
  feedHref: string
  onAmin: (id: number) => void
  onSoon: (t: string) => void
}) {
  return (
    <div className="flex flex-col gap-7">
      <section className={`px-4 py-5 ${PANEL}`}>
        <AirBar kota={kota} size="lg" />
        <Link href={laporHref} className={`${BTN} mt-5`}>
          <Strip className="py-3.5 text-[21px]">
            <DropIcon className="h-5 w-5" />
            Lapor WW
          </Strip>
        </Link>
        <p className={`${MONO} mt-3 text-[11.5px] leading-relaxed text-[#57534e]`}>
          WW tanpa tiket cukup dilaporkan. Tidak ada minimum peserta dan tidak perlu approval.
        </p>
      </section>

      {masuk && (
        <section className={`relative px-4 py-4 ${PANEL}`} style={{ boxShadow: `inset 4px 0 0 ${WATER}` }}>
          <p className={`${LABEL} text-[9.5px] font-bold`} style={{ color: WATER }}>
            Air Hidup mengalir ke kalian
          </p>
          <p className={`${ANTON} mt-1 text-[20px] leading-tight`}>{masuk.namaKota} mengalirkan ke {kota.namaKota}</p>
          <p className={`${MONO} mt-1.5 text-[12.5px] leading-relaxed`}>“{masuk.isi}”</p>
          <p className={`${LABEL} mt-1.5 text-[9.5px] text-[#57534e]`}>
            {fmtTanggal(masuk.tanggal)} · {masuk.jumlah} orang · giliran kalian minum
          </p>
        </section>
      )}

      <section>
        <SectionHead title="Alat PIC" />
        <div className="grid grid-cols-2 gap-2.5">
          <Link href={laporHref} className={`relative flex h-[104px] flex-col items-center justify-center gap-2 rounded-[14px] bg-[#fffdf7] -rotate-1 ${LIFTED} ${PRESS}`}>
            <span className="flex h-11 w-11 -rotate-3 items-center justify-center rounded-[10px] bg-[#2f7fc1] text-white">
              <DropIcon className="h-[22px] w-[22px]" />
            </span>
            <span className={`${ANTON} text-[14.5px] leading-none tracking-[.02em]`}>Pelaporan WW</span>
          </Link>
          <Link href={feedHref} className={`relative flex h-[104px] flex-col items-center justify-center gap-2 rounded-[14px] bg-[#fffdf7] rotate-1 ${LIFTED} ${PRESS}`}>
            <span className="flex h-11 w-11 -rotate-3 items-center justify-center rounded-[10px] bg-[#161616] text-[#ffd83d]">
              <Icon name="megaphone" className="h-[22px] w-[22px]" />
            </span>
            <span className={`${ANTON} text-[14.5px] leading-none tracking-[.02em]`}>Aliran Air Hidup</span>
          </Link>
          {SOON_TOOLS.map((t) => (
            <button
              key={t.t}
              type="button"
              onClick={() => onSoon(t.t)}
              className={`relative flex h-[104px] flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dotted border-[#161616]/30 ${PRESS}`}
            >
              <span className="flex h-11 w-11 -rotate-3 items-center justify-center rounded-[10px] bg-[#161616]/[.07]">
                <Icon name={t.i} className="h-[22px] w-[22px]" />
              </span>
              <span className={`${ANTON} text-[14.5px] leading-none tracking-[.02em]`}>{t.t}</span>
              <span className={`${LABEL} absolute right-1.5 top-1.5 rotate-6 text-[8.5px] font-bold text-[#c21f24]`}>Soon</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionHead title="Laporan Kota Kita" count={laporanKota.length} />
        {laporanKota.length === 0 ? (
          <p className={`${LABEL} rounded-[14px] border-2 border-dotted border-[#161616]/30 px-4 py-7 text-center text-[11px] text-[#57534e]`}>Belum ada laporan</p>
        ) : (
          <div className="space-y-4">
            {laporanKota.map((l) => (
              <LaporanCard key={l.id} l={l} onAmin={onAmin} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
