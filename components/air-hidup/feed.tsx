'use client'
import Link from 'next/link'
import { ANTON, LABEL, MONO, PANEL, Poster, PRESS, ROWS, SectionHead } from '@/components/pwa/paper-ui'
import { AirBar, DropIcon, WATER } from './bar'
import { urutKotaHaus, type KotaAir, type WwLaporan } from '@/lib/air-hidup'

export function fmtTanggal(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function NasionalCounter({ orang, kota }: { orang: number; kota: number }) {
  return (
    <div className={`relative px-4 py-4 ${PANEL}`}>
      <p className={`${LABEL} text-[10px] font-bold text-[#57534e]`}>30 hari terakhir</p>
      <p className={`${ANTON} mt-1 flex items-center gap-2 text-[30px] leading-none`}>
        <DropIcon className="w-7 h-7" />
        <span style={{ color: WATER }}>{orang}</span>
        <span className="text-[18px]">orang dari {kota} kota</span>
      </p>
      <p className={`${MONO} mt-1.5 text-[12px] text-[#44403c]`}>sudah minum Air Hidup bersama.</p>
    </div>
  )
}

export function LaporanCard({ l, onAmin, compact, editHref }: { l: WwLaporan; onAmin?: (id: number) => void; compact?: boolean; editHref?: string }) {
  return (
    <article className={`flex flex-col overflow-hidden ${PANEL} ${compact ? 'h-full' : ''}`}>
      {l.foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={l.foto}
          alt=""
          // Kompak (Beranda): 4:3 dengan titik fokus pilihan PIC. Penuh (Aliran, dashboard PIC): tinggi alami.
          className={compact ? 'block aspect-[4/3] w-full bg-[#e02a2f] object-cover' : 'block h-auto max-h-[30rem] w-full bg-[#e02a2f] object-cover'}
          style={compact ? { objectPosition: `${l.fotoX}% ${l.fotoY}%` } : undefined}
        />
      ) : (
        <Poster src="" className={compact ? 'aspect-[4/3] w-full' : 'h-40 w-full'} />
      )}
      <div className="flex flex-1 flex-col px-4 py-3.5">
        <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>
          {fmtTanggal(l.tanggal)} · {l.jumlah} orang
        </p>
        <p className={`${ANTON} mt-1 text-[21px] leading-tight tracking-[.01em]`}>{l.namaKota}</p>
        <p className={`${MONO} mt-2 text-[13px] leading-relaxed ${compact ? 'line-clamp-3' : ''}`}>“{l.isi}”</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className={`${LABEL} min-w-0 truncate text-[9.5px] text-[#57534e]`}>oleh {l.oleh}</span>
          <div className="flex shrink-0 items-center gap-2">
            {editHref && (
              <Link href={editHref} className={`${MONO} rounded-full px-3 py-1.5 text-[12px] font-bold ring-2 ring-[#161616]/40 ${PRESS}`}>
                Edit
              </Link>
            )}
            {onAmin ? (
              <button
                type="button"
                aria-pressed={l.aminSaya}
                onClick={() => onAmin(l.id)}
                className={`${MONO} rounded-full px-3.5 py-1.5 text-[12px] font-bold ring-2 ring-[#161616] ${PRESS} ${l.aminSaya ? 'bg-[#161616] text-[#ffd83d]' : 'bg-[#fffdf7]'}`}
              >
                Amin · {l.amin}
              </button>
            ) : (
              <span className={`${MONO} text-[12px] font-bold`}>Amin · {l.amin}</span>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

/** Aliran Air Hidup: penghitung nasional, bar tiap kota (terhaus dulu), lalu laporan terbaru. */
export function AirFeed({
  nasional,
  kota,
  laporan,
  onAmin,
}: {
  nasional: { orang: number; kota: number }
  /** bar air tiap kota; hanya LevelUP Pusat (userlevel 5), kosong untuk anggota lain */
  kota?: KotaAir[]
  laporan: WwLaporan[]
  onAmin: (id: number) => void
}) {
  return (
    <div className="flex flex-col gap-7">
      <NasionalCounter {...nasional} />
      {kota && (
      <section>
        <SectionHead title="Air Tiap Kota" count={kota.length} />
        <div className={`px-4 ${PANEL}`}>
          <ul className={ROWS}>
            {urutKotaHaus(kota).map((k) => (
              <li key={k.idCabang} className="py-3.5">
                <AirBar kota={k} />
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}
      <KabarTerbaru laporan={laporan} onAmin={onAmin} />
    </div>
  )
}

/** Kabar Terbaru: laporan WW tiap kota + tombol Amin. Tampil di Beranda semua anggota (apa pun level) dan di aliran. */
export function KabarTerbaru({ laporan, onAmin, action, carousel }: { laporan: WwLaporan[]; onAmin: (id: number) => void; action?: { href: string; label: string }; carousel?: boolean }) {
  return (
    <section>
      <SectionHead title="Kabar Terbaru" action={action} />
      {laporan.length === 0 ? (
        <p className={`${LABEL} rounded-[14px] border-2 border-dotted border-[#161616]/30 py-7 px-4 text-center text-[11px] text-[#57534e]`}>Belum ada laporan</p>
      ) : carousel ? (
        // Beranda: geser ke samping; kartu berikutnya mengintip. -mx-5/px-5 = tembus ke tepi layar (kontainer halaman px-5).
        <div className="-mx-5 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-5 pb-5 pt-1 -mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {laporan.map((l) => (
            <div key={l.id} className={`shrink-0 snap-center first:snap-start ${laporan.length === 1 ? 'w-full' : 'w-[82%]'}`}>
              <LaporanCard l={l} onAmin={onAmin} compact />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {laporan.map((l) => (
            <LaporanCard key={l.id} l={l} onAmin={onAmin} />
          ))}
        </div>
      )}
    </section>
  )
}
